# Gyara Ni - Inventory Management System

## Project Overview
This is a Next.js-based inventory management system with the following features:
- Dashboard with statistics and charts
- Product catalog management
- Category organization
- Order management and tracking
- Inventory control and stock alerts
- Real-time notifications
- User authentication with role-based access

## Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: Tailwind CSS, Radix UI components
- **Backend**: Supabase (PostgreSQL database + authentication)
- **Build System**: Next.js with TypeScript
- **Package Manager**: npm (with pnpm-lock.yaml present)

## Database Setup
The project requires Supabase with several SQL scripts to be executed in order:
1. 001_create_users_and_profiles.sql
2. 002_create_categories_and_products.sql
3. 003_create_inventory_management.sql
4. 004_create_orders_and_sales.sql
5. 005_create_notifications.sql
6. 006_seed_initial_data.sql
7. 007_notification_triggers.sql
8. 008_seed_initial_data_fixed.sql

## Environment Variables Required
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Recent Changes
- 2025-09-13: Initial import and setup for Replit environment
- 2025-09-13: Configured Next.js for Replit with 0.0.0.0:5000 binding
- 2025-09-13: Added cache-control headers for proper Replit iframe handling
- 2025-09-13: Set up Supabase integration with environment variables
- 2025-09-13: Added health check endpoint for deployment monitoring
- 2025-09-13: Configured production deployment with proper host/port settings
- 2025-09-13: **Implemented complete responsive design across all dashboard tables**
- 2025-09-13: **Refactored sidebar to off-canvas mobile pattern with hamburger menu**
- 2025-09-13: **Applied mobile-first design with progressive disclosure patterns**
- 2025-09-13: **Fixed authentication session synchronization with custom callback**
- 2025-09-14: **Fresh GitHub import successfully configured for Replit environment**
- 2025-09-14: **Installed all project dependencies and resolved TypeScript errors**
- 2025-09-14: **Configured Supabase environment variables and verified connection**
- 2025-09-14: **Set up production deployment with autoscale configuration**
- 2025-09-15: **Fresh GitHub import setup completed successfully in Replit environment**
- 2025-09-15: **All dependencies installed and Next.js server running on port 5000**
- 2025-09-15: **Supabase integration configured with environment variables**
- 2025-09-15: **Production deployment configured with autoscale target**
- 2025-09-15: **Health check endpoint verified and application ready for use**
- 2025-09-17: **Fresh GitHub import setup completed successfully in Replit environment**
- 2025-09-17: **Installed Node.js dependencies and resolved all build issues**
- 2025-09-17: **Configured Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)**
- 2025-09-17: **Next.js development server running successfully on 0.0.0.0:5000**
- 2025-09-17: **Production deployment configured with autoscale target and proper build/start commands**
- 2025-09-17: **Application fully functional with Fast Refresh enabled for development**

## User Preferences
- None specified yet

## Project Architecture
- App Router structure (Next.js 13+ pattern)
- Modular component architecture with UI components in /components/ui/
- Supabase integration for backend services
- Middleware for session management