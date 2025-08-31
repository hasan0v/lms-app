# 🎓 SÜNİ İNTELLEKT - AI-Powered Learning Management System# Süni İntellekt - Learning Management System



An intelligent, modern Learning Management System built with Next.js 15, Supabase, and AI-enhanced features. This platform provides adaptive learning experiences with real-time analytics, collaborative tools, and comprehensive course management.This is a modern Learning Management System built with [Next.js](https://nextjs.org) and [Supabase](https://supabase.com).



![License](https://img.shields.io/badge/license-MIT-blue.svg)## Features

![Next.js](https://img.shields.io/badge/Next.js-15.4.2-black)

![React](https://img.shields.io/badge/React-19.1.0-blue)- 📚 Course and module management

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)- 👥 User roles (Admin, Student)

![Supabase](https://img.shields.io/badge/Supabase-2.52.0-green)- 📝 Task assignments and submissions

![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-blue)- 💬 Real-time chat system

- 📊 Progress tracking and grading

## 🌟 Features- 📧 Email notifications

- 🎥 YouTube video integration

### 🎯 Core Learning Features

- **Adaptive Content Engine**: AI-powered content recommendations based on learning patterns## Getting Started

- **Interactive Rich Text Editor**: Tiptap-based editor with multimedia support

- **Real-time Chat System**: Collaborative learning with instant messagingFirst, run the development server:

- **Task Management**: Comprehensive assignment system with file uploads

- **Grading & Feedback**: Structured evaluation system with detailed feedback```bash

- **Progress Tracking**: Visual progress indicators and achievement trackingnpm run dev

- **Jupyter Notebook Support**: Integrated notebook viewer for data science courses# or

yarn dev

### 🔐 Authentication & Security# or

- **Supabase Authentication**: Secure user registration and loginpnpm dev

- **Role-based Access Control**: Student and Admin role management# or

- **Row Level Security (RLS)**: Database-level security policiesbun dev

- **Profile Management**: User profiles with customizable settings```

- **Password Reset**: Secure password recovery with email templates

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 👨‍💼 Administrative Tools

- **Course Management**: Complete CRUD operations for coursesYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- **Module & Topic Organization**: Hierarchical content structure

- **User Management**: Student account administrationThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- **Analytics Dashboard**: Performance metrics and engagement data

- **Grading Queue**: Streamlined assignment review process## Environment Variables

- **Email Template Management**: Customizable notification templates

Create a `.env.local` file with your Supabase configuration:

### 🎨 User Experience

- **Responsive Design**: Mobile-first approach with Tailwind CSS```

- **Dark/Light Mode Support**: Adaptive themingNEXT_PUBLIC_SUPABASE_URL=your_supabase_url

- **Interactive Animations**: Framer Motion for smooth transitionsNEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

- **File Management**: Cloudflare R2 integration for media storage```

- **Real-time Updates**: Live notifications and updates

## Learn More

## 🏗️ Technology Stack

To learn more about Next.js, take a look at the following resources:

### Frontend

- **Framework**: Next.js 15.4.2 (App Router)- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- **Language**: TypeScript 5.x- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- **UI Library**: React 19.1.0

- **Styling**: Tailwind CSS 4.xYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- **Animations**: Framer Motion 12.x

- **Icons**: Lucide React## Deploy on Vercel

- **Rich Text**: Tiptap 3.x

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Backend & Database

- **Database**: Supabase (PostgreSQL)Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Cloudflare R2 (configured)
- **Email Service**: Resend

### Development Tools
- **Linting**: ESLint 9.x
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm
- **Deployment**: Vercel-ready configuration

## 📁 Project Structure

```
lms-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   │   ├── signin/        # Login page
│   │   │   ├── signup/        # Registration page
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── dashboard/         # Protected dashboard area
│   │   │   ├── admin/         # Admin-only routes
│   │   │   │   ├── courses/   # Course management
│   │   │   │   ├── tasks/     # Task management
│   │   │   │   └── users/     # User management
│   │   │   ├── courses/       # Student course access
│   │   │   ├── tasks/         # Student task view
│   │   │   ├── grades/        # Grade reports
│   │   │   ├── chat/          # Real-time chat
│   │   │   ├── grading/       # Admin grading interface
│   │   │   └── profile/       # User profile
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── email/         # Email services
│   │   │   └── password-reset/
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable components
│   │   ├── admin/             # Admin-specific components
│   │   ├── landing/           # Landing page components
│   │   ├── tasks/             # Task-related components
│   │   ├── ui/                # UI primitives
│   │   ├── AuthGate.tsx       # Auth protection
│   │   ├── DashboardLayout.tsx
│   │   ├── RichTextEditor.tsx
│   │   ├── NotebookViewer.tsx
│   │   └── YouTubeVideoPlayer.tsx
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Authentication state
│   ├── hooks/                 # Custom hooks
│   │   └── useSignedUrl.ts    # File upload utilities
│   ├── lib/                   # Utility libraries
│   │   ├── supabase.ts        # Database client
│   │   ├── storage.ts         # File storage
│   │   ├── tasks.ts           # Task utilities
│   │   └── email/             # Email services
│   └── types/                 # TypeScript definitions
├── database/                  # Database schema & migrations
│   ├── migrations/            # SQL migration files
│   │   ├── add_chat_system.sql
│   │   ├── add_indexes_for_chat_and_topics.sql
│   │   ├── add_media_links.sql
│   │   ├── add_storage_support.sql
│   │   └── fix_storage_rls.sql
│   └── add_notebook_support.sql
├── email-templates/           # Email template files
├── public/                    # Static assets
└── package.json              # Dependencies & scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Cloudflare R2 account (optional, for file storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lms-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Email Service (Resend)
   RESEND_API_KEY=your_resend_api_key

   # Cloudflare R2 (Optional)
   CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_key
   CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
   CLOUDFLARE_R2_ENDPOINT=your_r2_endpoint
   ```

4. **Database Setup**
   Run the SQL migrations in your Supabase SQL editor:
   ```bash
   # Run migrations in order:
   database/add_notebook_support.sql
   database/migrations/add_chat_system.sql
   database/migrations/add_indexes_for_chat_and_topics.sql
   database/migrations/add_media_links.sql
   database/migrations/add_storage_support.sql
   database/migrations/fix_storage_rls.sql
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗂️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `user_profiles` | Extended user information beyond Supabase Auth |
| `courses` | Course definitions and metadata |
| `modules` | Course sections/chapters |
| `topics` | Individual lessons within modules |
| `tasks` | Assignments linked to topics |
| `submissions` | Student assignment submissions |
| `chat_messages` | Real-time messaging system |

### Key Relationships

```
courses (1) → (n) modules → (n) topics → (1) tasks
users (1) → (n) submissions ← (1) tasks
users (1) → (n) chat_messages
```

## 🛣️ API Routes

### Authentication Routes
- `POST /api/auth/send-verification` - Send email verification
- `POST /api/auth/reset-password` - Password reset request
- `POST /api/auth/update-password` - Update user password
- `POST /api/auth/verify-reset-token` - Verify reset token

### Email Routes
- `POST /api/email/send` - Send custom emails
- `GET /api/auth/preview-template` - Preview email templates

### Utility Routes
- `POST /api/setup-database` - Database initialization
- `POST /api/test-email` - Email service testing
- `POST /api/test-resend` - Resend service testing

## 🎨 UI Components

### Layout Components
- `DashboardLayout` - Main dashboard wrapper
- `AuthGate` - Authentication protection
- `ProtectedRoute` - Role-based route protection

### Feature Components
- `RichTextEditor` - Tiptap-based content editor
- `NotebookViewer` - Jupyter notebook display
- `YouTubeVideoPlayer` - Embedded video player
- `FileAttachmentLink` - File download interface
- `TopicForm` - Topic creation/editing
- `TaskManager` - Assignment management interface

### UI Primitives
- Notification System
- Confirm Dialog
- Loading States
- Error Boundaries

## 🔧 Configuration

### Next.js Configuration
```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dcsshjzqyysqpzhgewtx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
}
```

### Supabase Configuration
- Row Level Security (RLS) enabled on all tables
- Real-time subscriptions for chat and notifications
- File storage integration with secure upload URLs
- Authentication policies for student/admin roles

## 🚀 Deployment

### Vercel Deployment
The project is configured for Vercel deployment:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "src/app/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["fra1"]
}
```

### Environment Variables
Set the following in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

## 🧪 Testing

### Development Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Testing Flow
1. Create admin account in Supabase Auth
2. Set user role to 'admin' in user_profiles table
3. Test course creation and management
4. Create test student account
5. Test student learning flow
6. Verify grading system

## 📚 Features in Development

### Current Implementation Status

✅ **Completed Features**
- User authentication and role management
- Course, module, and topic CRUD operations
- Rich text editor with media support
- Task submission and grading system
- Real-time chat functionality
- Student dashboard with progress tracking
- Admin panel with comprehensive management tools
- Email notification system
- File upload and storage integration
- Responsive UI with Tailwind CSS

🚧 **In Progress**
- Advanced analytics and reporting
- AI-powered content recommendations
- Enhanced progress tracking
- Mobile app optimization
- Jupyter notebook integration improvements

🔮 **Planned Features**
- Quiz and assessment system
- Video conferencing integration
- Offline mode support
- Advanced search functionality
- Gamification elements
- Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the troubleshooting guides in project files

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.io/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Tiptap](https://tiptap.dev/) - Rich text editor
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Vercel](https://vercel.com/) - Deployment platform

---

Built with ❤️ for modern education and AI-enhanced learning experiences.