import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { storage } from "./storage";
import type { Express } from "express";
import { randomUUID } from "crypto";

export function setupOAuth(app: Express) {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${process.env.REPL_URL || "http://localhost:5000"}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              console.error("Google OAuth: No email found in profile", profile.id);
              return done(new Error("No email found"), undefined);
            }

            let user = await storage.getUserByEmail(email);

            if (!user) {
              const id = randomUUID();
              user = await storage.createUser({
                id,
                email,
                firstName: profile.name?.givenName || profile.displayName?.split(" ")[0],
                lastName: profile.name?.familyName || profile.displayName?.split(" ")[1],
                role: "job_seeker",
                googleId: profile.id,
              });
            } else if (!user.googleId) {
              await storage.upsertUser({
                ...user,
                googleId: profile.id,
              });
            }

            return done(null, user);
          } catch (error) {
            console.error("Google OAuth error:", error);
            return done(error as Error, undefined);
          }
        }
      )
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: `${process.env.REPL_URL || "http://localhost:5000"}/api/auth/github/callback`,
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              console.error("GitHub OAuth: No email found in profile", profile.id);
              return done(new Error("No email found"), undefined);
            }

            let user = await storage.getUserByEmail(email);

            if (!user) {
              const id = randomUUID();
              user = await storage.createUser({
                id,
                email,
                firstName: profile.displayName?.split(" ")[0] || profile.username,
                lastName: profile.displayName?.split(" ")[1],
                role: "job_seeker",
                githubId: profile.id,
              });
            } else if (!user.githubId) {
              await storage.upsertUser({
                ...user,
                githubId: profile.id,
              });
            }

            return done(null, user);
          } catch (error) {
            console.error("GitHub OAuth error:", error);
            return done(error as Error, undefined);
          }
        }
      )
    );
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"],
  }));

  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { 
      failureRedirect: "/login?error=oauth_failed",
      successRedirect: "/?oauth=success",
    })
  );

  app.get("/api/auth/github", passport.authenticate("github", {
    scope: ["user:email"],
  }));

  app.get("/api/auth/github/callback",
    passport.authenticate("github", {
      failureRedirect: "/login?error=oauth_failed",
      successRedirect: "/?oauth=success",
    })
  );
}
