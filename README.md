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

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- PostgreSQL database (or Vercel Postgres)
- ElevenLabs API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd montessori-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for local)
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `TOOLHOUSE_API_KEY`: (Optional) Toolhouse.ai API key
- `RTRVR_API_KEY`: (Optional) rtrvr.ai API key

4. Initialize the database:
```bash
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

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

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker (Alternative)

```bash
docker build -t montessori-ai .
docker run -p 3000:3000 montessori-ai
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
