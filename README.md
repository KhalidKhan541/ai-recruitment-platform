# AI Recruitment Platform

An intelligent recruitment platform powered by AI, built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

- **AI-Powered Resume Analysis** - Automatically parse and analyze resumes using GPT-4, Claude, or Gemini
- **Smart Candidate Matching** - Match candidates to job openings based on skills, experience, and preferences
- **Interview Preparation** - Generate interview questions and evaluate answers with AI
- **Job Posting Management** - Create, publish, and manage job postings
- **Application Tracking** - Track candidates through the entire hiring pipeline
- **Talent Pools** - Build and manage talent pools for future openings
- **Analytics Dashboard** - Comprehensive hiring analytics and reporting
- **Multi-Provider AI** - Support for OpenAI, Anthropic, Google, and local Ollama models

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **AI**: OpenAI, Anthropic, Google Gemini, Ollama
- **Auth**: NextAuth.js with credentials, Google, and GitHub providers
- **UI**: Tailwind CSS, Radix UI, Lucide icons
- **Email**: Resend, Nodemailer
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/ai-recruitment-platform.git
cd ai-recruitment-platform
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Start the database:

```bash
docker-compose up -d db redis
```

5. Run database migrations:

```bash
npx prisma migrate dev
```

6. Seed the database:

```bash
npx prisma db seed
```

7. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Docker Setup

For a complete development environment:

```bash
docker-compose up -d
```

This starts:
- App on port 3000
- PostgreSQL on port 5432
- Redis on port 6379
- MailHog on port 8025

### Production Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Project Structure

```
ai-recruitment-platform/
├── prisma/              # Database schema and migrations
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   │   ├── ui/          # Reusable UI components
│   │   └── jobs/        # Job-specific components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and services
│   │   ├── ai/          # AI provider integrations
│   │   ├── candidates/  # Candidate management
│   │   ├── jobs/        # Job management
│   │   └── recruiters/  # Recruiter services
│   ├── stores/          # State management
│   └── types/           # TypeScript type definitions
├── tests/               # Test files
│   ├── api/             # API tests
│   ├── components/      # Component tests
│   ├── hooks/           # Hook tests
│   ├── lib/             # Library tests
│   └── stores/          # Store tests
├── docker-compose.yml   # Development Docker setup
├── docker-compose.prod.yml  # Production Docker setup
└── Dockerfile           # Application Dockerfile
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- tests/api/jobs.test.ts
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript check
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run migrations
- `npx prisma studio` - Open Prisma Studio

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `ANTHROPIC_API_KEY` | Anthropic API key | No |
| `GOOGLE_AI_KEY` | Google AI API key | No |
| `REDIS_URL` | Redis connection string | No |
| `RESEND_API_KEY` | Resend email API key | No |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
