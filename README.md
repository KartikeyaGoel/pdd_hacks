# Montessori - AI-Powered Auditory Learning for Commuters

Transform your commute time into productive learning sessions with Montessori, a conversational AI learning platform powered by ElevenLabs.

## Overview

Montessori is a voice-first AI learning platform that provides a personalized academic coach accessible during walking, driving, or transit. Upload your course materials and engage in real-time voice conversations powered by advanced AI.

## Features

- **AI Academic Coach**: Real-time voice conversations with sub-500ms latency
- **Document Upload & RAG**: Upload PDFs, DOCX, TXT, MD, and images for context-aware teaching
- **Conversation History**: Review and resume past learning sessions
- **User Personalization**: AI remembers your knowledge level and learning preferences
- **External Tools**: Calendar integration (Toolhouse.ai) and web scraping (rtrvr.ai)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (Vercel Edge Functions)
- **AI Services**: ElevenLabs Conversational AI, Knowledge Base, TTS
- **Database**: Vercel Postgres with Prisma ORM
- **Auth**: NextAuth.js v5
- **State Management**: Zustand
- **File Processing**: pdf-parse, mammoth, tesseract.js
- **Testing**: Jest (unit tests), Playwright (E2E tests)

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- PostgreSQL database (or Vercel Postgres)
- ElevenLabs API key with Conversational AI access

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd pdd_hacks
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/montessori"
ELEVENLABS_API_KEY="sk_your_api_key_here"

# Optional - for extended features
TOOLHOUSE_API_KEY="th_your_api_key_here"
RTRVR_API_KEY="rtrvr_your_api_key_here"
```

#### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key for voice AI |
| `TOOLHOUSE_API_KEY` | No | Toolhouse.ai key for calendar/reminders |
| `RTRVR_API_KEY` | No | rtrvr.ai key for web scraping |

### 3. Set Up the Database

**Option A: Local PostgreSQL**

```bash
# Create database (if using local PostgreSQL)
createdb montessori

# Push schema to database
npm run db:push
```

**Option B: Docker PostgreSQL**

```bash
# Start PostgreSQL container
docker run --name montessori-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=montessori \
  -p 5432:5432 \
  -d postgres:15-alpine

# Push schema to database
npm run db:push
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Testing

### Unit Tests (Jest)

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### End-to-End Tests (Playwright)

```bash
# Run E2E tests (starts dev server automatically)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed browser
npm run test:e2e:headed
```

### Run All Tests

```bash
npm run test:all
```

## Project Structure

```
montessori-ai/
├── app/                      # Next.js App Router pages and API routes
│   ├── api/                  # Backend API endpoints
│   │   ├── upload-document/  # Document upload handler
│   │   ├── agent/            # Agent initialization
│   │   ├── conversations/    # Conversation management
│   │   └── webhook/          # External webhooks
│   ├── upload/               # Upload page
│   ├── history/              # Conversation history page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main conversation page
├── components/               # React components
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── VoiceInterface.tsx    # Main voice conversation UI
│   ├── FileUploader.tsx      # Document upload component
│   └── ConversationList.tsx  # History list component
├── lib/                      # Utilities and configuration
│   ├── prisma.ts             # Prisma client
│   ├── auth.ts               # NextAuth configuration
│   ├── elevenlabs.ts         # ElevenLabs SDK wrapper
│   ├── file-processing.ts    # File text extraction
│   ├── audio-utils.ts        # Web Audio API utilities
│   ├── store.ts              # Zustand global state
│   ├── api-client.ts         # API fetch wrapper
│   ├── types.ts              # TypeScript types
│   └── env.ts                # Environment validation
├── prisma/                   # Database schema and migrations
│   └── schema.prisma         # Prisma schema
└── public/                   # Static assets
```

## Architecture

The application follows a clean architecture with clear separation of concerns:

### Priority 1-4: Configuration & Core Types
- Database schema (Prisma)
- TypeScript types
- Environment configuration

### Priority 5-10: Libraries & Utilities
- Authentication (NextAuth.js)
- File processing (PDF, DOCX, OCR)
- ElevenLabs client wrapper
- Audio utilities (Web Audio API)
- State management (Zustand)
- API client wrapper

### Priority 11-17: Backend API Routes
- Document upload endpoint
- Agent initialization endpoint
- Conversation management (list, continue, delete)
- Webhooks (conversation end, tool execution)

### Priority 18-25: Frontend Components & Pages
- Root layout with global styles
- Sidebar navigation
- Voice interface component
- File uploader component
- Conversation history component
- Main page, Upload page, History page

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio GUI |

### Database Management

```bash
# Generate Prisma client (runs automatically on npm install)
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues

**Database connection failed**
```
Error: P1001: Can't reach database server
```
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Check if the database exists: `psql -l`

**Prisma client not generated**
```
Error: @prisma/client did not initialize yet
```
Run:
```bash
npm run db:generate
```

**ElevenLabs API errors**
- Verify your API key is valid and has Conversational AI access
- Check your account has sufficient credits
- Ensure the API key starts with `sk_`

**Port 3000 already in use**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

**E2E tests timing out**
- Ensure the dev server can start successfully
- Check if port 3000 is available
- Increase timeout in `playwright.config.ts` if needed

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables:
   - `DATABASE_URL` - Use Vercel Postgres or external PostgreSQL
   - `ELEVENLABS_API_KEY` - Your ElevenLabs API key
   - `TOOLHOUSE_API_KEY` (optional)
   - `RTRVR_API_KEY` (optional)
4. Deploy

### Docker

**Build and run:**
```bash
docker build -t montessori-ai .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e ELEVENLABS_API_KEY="sk_..." \
  montessori-ai
```

**Docker Compose (with PostgreSQL):**

Create a `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/montessori
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=montessori
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

## Sponsor Integration

This project integrates the following sponsor technologies:

- **ElevenLabs**: Conversational AI, Knowledge Base, TTS
- **PromptDriven.ai**: Prompt engineering and testing
- **Toolhouse.ai**: Pre-built agent tools (calendar, reminders)
- **rtrvr.ai**: Real-time web scraping

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues or questions, please open an issue on GitHub.
