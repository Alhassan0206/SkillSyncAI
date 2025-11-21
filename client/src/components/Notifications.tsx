import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  userId: string;
  tenantId?: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  category?: string;
  scheduledFor?: string;
  digestGroupId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
  createdAt: string;
}

export default function Notifications() {
  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
  });

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/notifications/mark-all-read', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const unreadCount = unreadCountData?.count || 0;
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs" data-testid="badge-notification-count">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0" data-testid="popover-notifications">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground" data-testid="loading-notifications">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground" data-testid="empty-notifications">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div>
              {unreadNotifications.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                    Unread
                  </div>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                      isMarkingAsRead={markAsReadMutation.isPending}
                    />
                  ))}
                  <Separator />
                </div>
              )}
              
              {readNotifications.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                    Earlier
                  </div>
                  {readNotifications.slice(0, 10).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={() => {}}
                      isMarkingAsRead={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  isMarkingAsRead: boolean;
}

function NotificationItem({ notification, onMarkAsRead, isMarkingAsRead }: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  
  return (
    <div
      className={`group p-4 hover-elevate cursor-pointer ${
        !notification.read ? 'bg-muted/50' : ''
      }`}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead();
                }}
                disabled={isMarkingAsRead}
                data-testid={`button-mark-read-${notification.id}`}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {timeAgo}
          </p>
        </div>
      </div>
    </div>
  );
}
