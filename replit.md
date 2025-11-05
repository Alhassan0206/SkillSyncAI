# SkillSync AI - Replit Configuration

## Overview

SkillSync AI is an AI-driven multi-tenant web platform that analyzes skills and project requirements, generates optimized learning and hiring roadmaps, and automatically matches job-seekers with employers. The platform serves three distinct user types: job-seekers (individuals seeking employment and skill development), employers (hiring managers posting jobs and reviewing candidates), and platform administrators (managing tenants and system health).

The application provides personalized skill gap analysis, AI-powered job matching, automated learning roadmap generation, and intelligent candidate screening to reduce time-to-hire and improve match quality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design system

**Design System:**
- Custom typography system using Inter (primary), Space Grotesk (marketing headlines), and JetBrains Mono (code/technical data)
- Hybrid design approach: reference-based for marketing pages (inspired by Stripe, Linear, Airbnb) and system-based for dashboards (inspired by LinkedIn, Notion, Greenhouse)
- Consistent spacing using Tailwind primitives (2, 4, 6, 8, 12, 16, 20, 24 units)
- Theme support with light/dark mode toggle stored in localStorage
- Custom CSS variables for colors, borders, and elevation states

**Application Structure:**
- Three role-specific dashboards with dedicated sidebars and routing:
  - Job Seeker Dashboard: profile management, job matching, applications tracking, learning plans
  - Employer Dashboard: job posting, candidate review, team management, analytics
  - Admin Dashboard: tenant management, user oversight, system health monitoring, billing
- Separate marketing site with landing page, features, pricing sections
- Role selection flow for new users upon first authentication

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Node.js runtime environment
- Session-based authentication using Replit Auth (OpenID Connect)
- PostgreSQL database via Neon serverless driver
- Drizzle ORM for type-safe database queries and schema management

**API Structure:**
- RESTful API endpoints organized by feature domain
- Authentication middleware protecting all user-specific routes
- Route handlers in `/server/routes.ts` for user profiles, jobs, applications, matches, learning plans
- Storage layer abstraction (`IStorage` interface) separating business logic from data access
- Database connection pooling with Neon serverless WebSocket configuration

**AI Service Integration:**
- OpenAI GPT-5 integration for intelligent matching and analysis
- Job-candidate matching with explainable AI (match score, matching/gap skills, reasoning)
- Skill gap analysis comparing current skills against target roles
- Learning roadmap generation with prioritized skills and resource recommendations
- Resume parsing and skill extraction from unstructured text

**Core Data Models:**
- Users: authentication identity with role assignment (job_seeker, employer, admin)
- Job Seekers: extended profile with skills, experience, resume, portfolio links
- Employers: company information and hiring preferences
- Jobs: posting details with required/preferred skills and experience level
- Applications: job seeker applications with status tracking
- Matches: AI-generated job-candidate pairings with fit scores and explanations
- Learning Plans: personalized skill development roadmaps with resources
- Tenants: multi-tenant support with subscription plans and Stripe integration

### Data Storage

**Database:**
- PostgreSQL database hosted on Neon serverless platform
- Drizzle ORM schema definitions in `/shared/schema.ts` shared between client and server
- Migration management via drizzle-kit with migrations stored in `/migrations` directory
- Session storage using connect-pg-simple for Express sessions in database
- UUID primary keys with generated defaults for most entities
- JSONB columns for flexible data structures (skills arrays, AI metadata)

**Schema Relationships:**
- Users belong to tenants (multi-tenancy)
- Job seekers and employers reference users (one-to-one)
- Jobs belong to employers (one-to-many)
- Applications link job seekers to jobs (many-to-many)
- Matches link job seekers to jobs with AI-generated scores
- Learning plans belong to job seekers (one-to-one)

### Authentication & Authorization

**Authentication:**
- Replit Auth integration using OpenID Connect protocol
- Session-based authentication with secure HTTP-only cookies
- 1-week session duration with automatic renewal
- Session store persisted in PostgreSQL for scalability
- User claims extracted from ID tokens (sub, email, name, profile image)

**Authorization:**
- Role-based access control (job_seeker, employer, admin)
- `isAuthenticated` middleware protecting all dashboard routes
- Frontend route guards based on user role
- Role selection flow for users without assigned roles
- Separate dashboards and API endpoints per role

### External Dependencies

**Third-Party Services:**
- **OpenAI API**: GPT-5 model for AI-powered matching, skill analysis, and roadmap generation
- **Replit Auth**: OpenID Connect authentication provider
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Stripe**: Payment processing and subscription management (customer/subscription IDs stored)

**Frontend Libraries:**
- **Radix UI**: Headless component primitives for accessible UI components
- **TanStack Query**: Server state management with automatic caching and refetching
- **React Hook Form**: Form validation with Zod schema integration
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **shadcn/ui**: Pre-built component library with customizable variants
- **Lucide React**: Icon library for consistent iconography
- **date-fns**: Date manipulation and formatting utilities

**Development Tools:**
- **Vite**: Fast build tool with HMR and optimized production builds
- **TypeScript**: Type safety across client, server, and shared code
- **esbuild**: Server-side bundling for production deployment
- **Drizzle Kit**: Database migration and schema management CLI