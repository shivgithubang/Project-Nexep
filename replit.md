# Overview

This is an AI-powered career coaching application built with Next.js that helps users develop their professional careers through personalized guidance. The platform provides three main services: intelligent resume building, AI-generated cover letters, and interview preparation with mock quizzes. Users can track their progress through industry-specific insights and analytics. The application leverages Google's Gemini AI to generate personalized content based on user profiles including their industry, experience level, and skills.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses Next.js 15 with React 19 as the frontend framework, implementing a modern React Server Components architecture. The UI is built with Tailwind CSS for styling and Shadcn UI components for consistent design patterns. The application uses the App Router with a clear separation between public pages and authenticated routes. Key UI libraries include Radix UI primitives for accessibility, React Hook Form with Zod validation for form handling, and various specialized components like React Markdown for content rendering and HTML2PDF for document generation.

## Authentication & Authorization
User authentication is handled by Clerk, providing OAuth integration and user management. The middleware implements route protection, redirecting unauthenticated users from protected routes (/dashboard, /resume, /interview, /ai-cover-letter, /onboarding) to sign-in pages. User sessions are managed server-side with automatic redirection flows configured for post-authentication routing.

## Database Architecture
The application uses Prisma as the ORM with a PostgreSQL database (Neon DB). The data model includes core entities: Users (with Clerk integration), Resumes, Cover Letters, Interview Quizzes, and Industry Insights. The database schema supports user profiles with industry-specific data, career documents, and performance tracking. Database operations are wrapped in server actions for security and performance.

## AI Integration
Google's Gemini AI (gemini-1.5-flash model) powers the content generation throughout the application. AI prompts are carefully crafted to generate industry-specific content including resume improvements, cover letter creation, interview questions, and market insights. The AI responses are structured using JSON formats for consistent parsing and data handling.

## Background Processing
Inngest handles scheduled background tasks, specifically running weekly industry insight updates every Sunday at midnight. This ensures users receive current market data including salary ranges, growth rates, skill demands, and industry trends. The background jobs use the same Gemini AI integration for generating fresh market analysis.

## Server Actions Architecture
The application extensively uses Next.js server actions for secure backend operations. Actions are organized by feature (user management, resume handling, interview preparation, cover letter generation, dashboard insights) and include proper authentication checks, error handling, and database transactions where needed.

# External Dependencies

## Authentication Service
- **Clerk**: Provides user authentication, session management, and OAuth integration with pre-built UI components

## AI Service
- **Google Gemini AI**: Powers all content generation including resumes, cover letters, interview questions, and industry insights

## Database
- **Neon DB**: PostgreSQL hosting service for production database
- **Prisma**: ORM for database operations and schema management

## Background Processing
- **Inngest**: Handles scheduled tasks and background job processing for industry data updates

## UI Framework
- **Shadcn UI**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

## Specialized Libraries
- **React Hook Form + Zod**: Form handling and validation
- **React Markdown**: Markdown content rendering
- **HTML2PDF.js**: PDF generation for resumes and documents
- **Recharts**: Data visualization for analytics and insights
- **React Spinners**: Loading states and progress indicators
- **Sonner**: Toast notifications for user feedback