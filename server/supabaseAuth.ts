import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import session from "express-session";
import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
}

// Public client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Express session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === "production";

  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: sessionTtl,
    },
  });
}

// Sync Supabase user with our users table
async function syncUserWithDatabase(supabaseUser: User) {
  const userData = {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    firstName: supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.full_name?.split(" ")[0] || "",
    lastName: supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
    profileImageUrl: supabaseUser.user_metadata?.avatar_url || null,
  };
  
  await storage.upsertUser(userData);
  return userData;
}

// Setup Supabase Auth routes
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  console.log("🔐 Setting up Supabase Authentication");

  // Sign up with email/password
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
        },
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      if (data.user) {
        await syncUserWithDatabase(data.user);
        (req.session as any).userId = data.user.id;
        (req.session as any).accessToken = data.session?.access_token;
        (req.session as any).refreshToken = data.session?.refresh_token;
      }

      res.json({ 
        user: data.user, 
        session: data.session,
        message: data.user?.confirmed_at ? "Signed up successfully" : "Please check your email to confirm"
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Sign in with email/password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ message: error.message });
      }

      if (data.user) {
        await syncUserWithDatabase(data.user);
        (req.session as any).userId = data.user.id;
        (req.session as any).accessToken = data.session?.access_token;
        (req.session as any).refreshToken = data.session?.refresh_token;
      }

      res.json({ user: data.user, session: data.session });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const accessToken = (req.session as any).accessToken;
      if (accessToken) {
        await supabaseAdmin.auth.admin.signOut(accessToken);
      }
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Legacy logout route (GET)
  app.get("/api/logout", (req: Request, res: Response) => {
    req.session.destroy(() => res.redirect("/"));
  });

  // Refresh session
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = (req.session as any).refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token" });
      }

      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data.session) {
        return res.status(401).json({ message: "Session refresh failed" });
      }

      (req.session as any).accessToken = data.session.access_token;
      (req.session as any).refreshToken = data.session.refresh_token;
      res.json({ session: data.session });
    } catch (error) {
      res.status(500).json({ message: "Refresh failed" });
    }
  });

  // Get current session/user from token in header (for API clients)
  app.get("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const sessionUserId = (req.session as any).userId;

      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          return res.status(401).json({ message: "Invalid token" });
        }
        return res.json({ user, userId: user.id });
      }

      if (sessionUserId) {
        const user = await storage.getUser(sessionUserId);
        return res.json({ user, userId: sessionUserId });
      }

      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      res.status(500).json({ message: "Session check failed" });
    }
  });

  // Password reset request
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${req.protocol}://${req.get("host")}/reset-password`,
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({ message: "Password reset email sent" });
    } catch (error) {
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // Update password (after reset)
  app.post("/api/auth/update-password", async (req: Request, res: Response) => {
    try {
      const { password, accessToken } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      // Use the access token from the reset flow
      const token = accessToken || (req.session as any).accessToken;
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Password update failed" });
    }
  });
}

// Authentication middleware - checks session or Bearer token
export const isAuthenticated: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionUserId = (req.session as any).userId;
    const sessionAccessToken = (req.session as any).accessToken;

    // Check Bearer token first (for API clients)
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Attach user info to request (compatible with old format)
      (req as any).user = {
        claims: { sub: user.id },
        id: user.id,
        email: user.email,
      };
      return next();
    }

    // Check session
    if (sessionUserId) {
      // Verify the session token is still valid
      if (sessionAccessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(sessionAccessToken);
        if (!error && user) {
          (req as any).user = {
            claims: { sub: user.id },
            id: user.id,
            email: user.email,
          };
          return next();
        }

        // Try to refresh the token
        const refreshToken = (req.session as any).refreshToken;
        if (refreshToken) {
          const { data, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: refreshToken
          });
          if (!refreshError && data.session) {
            (req.session as any).accessToken = data.session.access_token;
            (req.session as any).refreshToken = data.session.refresh_token;
            (req as any).user = {
              claims: { sub: data.user!.id },
              id: data.user!.id,
              email: data.user!.email,
            };
            return next();
          }
        }
      }

      // Fallback: just use the session userId (for backward compatibility)
      (req as any).user = {
        claims: { sub: sessionUserId },
        id: sessionUserId,
      };
      return next();
    }

    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

