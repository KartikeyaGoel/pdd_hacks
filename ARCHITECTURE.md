# Montessori Architecture Overview

## Module Dependency Graph

This document provides a visual overview of the module dependencies and priority ordering for the Montessori project.

### Priority Levels (1-25)

**Priority 1-4: Foundation (Configuration & Types)**
- `prisma_schema_Prisma.prompt` → `prisma/schema.prisma`
- `prisma_client_TypeScript.prompt` → `lib/prisma.ts`
- `types_TypeScript.prompt` → `lib/types.ts`
- `env_config_TypeScript.prompt` → `lib/env.ts`

**Priority 5-10: Libraries & Utilities**
- `auth_config_TypeScript.prompt` → `lib/auth.ts`
- `file_processing_TypeScript.prompt` → `lib/file-processing.ts`
- `elevenlabs_client_TypeScript.prompt` → `lib/elevenlabs.ts`
- `audio_utils_TypeScript.prompt` → `lib/audio-utils.ts`
- `app_store_TypeScript.prompt` → `lib/store.ts`
- `api_client_TypeScript.prompt` → `lib/api-client.ts`

**Priority 11-17: Backend API Routes**
- `api_upload_document_route_TypeScript.prompt` → `app/api/upload-document/route.ts`
- `api_agent_initialize_route_TypeScript.prompt` → `app/api/agent/initialize/route.ts`
- `api_conversations_list_route_TypeScript.prompt` → `app/api/conversations/route.ts`
- `api_conversations_continue_route_TypeScript.prompt` → `app/api/conversations/[id]/continue/route.ts`
- `api_conversations_delete_route_TypeScript.prompt` → `app/api/conversations/[id]/route.ts`
- `api_webhook_conversation_end_route_TypeScript.prompt` → `app/api/webhook/conversation-end/route.ts`
- `api_webhook_tool_execution_route_TypeScript.prompt` → `app/api/webhook/tool-execution/route.ts`

**Priority 18-22: UI Components & Layout**
- `root_layout_TypeScriptReact.prompt` → `app/layout.tsx`
- `sidebar_component_TypeScriptReact.prompt` → `components/Sidebar.tsx`
- `voice_interface_component_TypeScriptReact.prompt` → `components/VoiceInterface.tsx`
- `file_uploader_component_TypeScriptReact.prompt` → `components/FileUploader.tsx`
- `conversation_list_component_TypeScriptReact.prompt` → `components/ConversationList.tsx`

**Priority 23-25: Pages**
- `main_page_TypeScriptReact.prompt` → `app/page.tsx`
- `upload_page_TypeScriptReact.prompt` → `app/upload/page.tsx`
- `history_page_TypeScriptReact.prompt` → `app/history/page.tsx`

## Dependency Flow

```
Foundational Modules (Priority 1-4)
    ↓
Libraries & Utilities (Priority 5-10)
    ↓
Backend API Routes (Priority 11-17)
    ↓
UI Components & Layout (Priority 18-22)
    ↓
Pages (Priority 23-25)
```

## Key Design Decisions

1. **Framework**: Next.js 14 App Router for modern React with server components
2. **Database**: Vercel Postgres with Prisma ORM for type-safe database access
3. **Authentication**: NextAuth.js v5 for session management
4. **State Management**: Zustand for client-side global state
5. **AI Platform**: ElevenLabs for all conversational AI features
6. **File Processing**: Server-side processing with pdf-parse, mammoth, tesseract.js
7. **Styling**: TailwindCSS v3 with custom design system

## External Integrations

- **ElevenLabs**: Conversational AI, Knowledge Base, TTS
- **Toolhouse.ai**: Pre-built agent tools (calendar, reminders)
- **rtrvr.ai**: Real-time web scraping for current information

## Module Count by Type

- **Configuration**: 4 modules (Prisma schema, env, auth, types)
- **Libraries**: 6 modules (file processing, ElevenLabs, audio, store, API client, Prisma client)
- **API Routes**: 7 modules (upload, agent, conversations, webhooks)
- **UI Components**: 5 modules (layout, sidebar, voice interface, uploader, history list)
- **Pages**: 3 modules (main, upload, history)

**Total**: 25 modules
