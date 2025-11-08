import { randomBytes, createHash } from "crypto";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import nodemailer from "nodemailer";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export class AuthEnhancements {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  generatePasswordResetToken(): { token: string; hashedToken: string } {
    const token = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(token).digest("hex");
    return { token, hashedToken };
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userId: string): Promise<void> {
    if (!this.transporter) {
      console.log("Email transporter not configured. Reset link:");
      console.log(`${process.env.CLIENT_URL || "http://localhost:5000"}/reset-password?token=${resetToken}&id=${userId}`);
      return;
    }

    const resetURL = `${process.env.CLIENT_URL || "http://localhost:5000"}/reset-password?token=${resetToken}&id=${userId}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - SkillSync AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your SkillSync AI account.</p>
          <p>Click the link below to reset your password:</p>
          <p style="margin: 20px 0;">
            <a href="${resetURL}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">SkillSync AI - Intelligent Hiring Platform</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  generate2FASecret(userEmail: string): { secret: string; otpauthUrl: string } {
    const secret = speakeasy.generateSecret({
      name: `SkillSync AI (${userEmail})`,
      issuer: "SkillSync AI",
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || "",
    };
  }

  async generate2FAQRCode(otpauthUrl: string): Promise<string> {
    return await qrcode.toDataURL(otpauthUrl);
  }

  verify2FAToken(secret: string, token: string, window: number = 1): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window,
    });
  }

  generateBackupCodes(count: number = 10): string[] {
    return Array.from({ length: count }, () =>
      randomBytes(4).toString("hex").toUpperCase()
    );
  }
}

export const authEnhancements = new AuthEnhancements();

export async function require2FA(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.twoFactorEnabled && !req.session?.twoFactorVerified) {
      return res.status(403).json({ 
        message: "2FA verification required",
        requires2FA: true 
      });
    }

    next();
  } catch (error) {
    console.error("2FA middleware error:", error);
    res.status(500).json({ message: "Failed to verify 2FA status" });
  }
}
