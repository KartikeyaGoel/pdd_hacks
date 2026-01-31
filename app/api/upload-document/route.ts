import { NextRequest, NextResponse } from 'next/server';
import { getDemoUserId } from '@/lib/demo-user';
import { prisma } from '@/lib/prisma';
import { uploadToKnowledgeBase } from '@/lib/elevenlabs';
import { extractTextFromBuffer, SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/file-processing';
import type { DocumentUploadResponse } from '@/lib/types';

/**
 * POST /api/upload-document
 * 
 * Handles file uploads and indexes them in ElevenLabs Knowledge Base.
 * 
 * Request: multipart/form-data with:
 * - file: The file to upload
 * - name: User-friendly name
 * - category: Optional category
 */
export async function POST(request: NextRequest) {
  try {
    // Get demo user ID (no auth required for hackathon demo)
    const userId = getDemoUserId();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;
    const category = formData.get('category') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Document name is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const mimeType = file.type;
    if (!SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES]) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Supported: PDF, DOCX, TXT, MD, PNG, JPG` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Extract text from file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let extractedText: string;
    try {
      // Note: Images (PNG/JPG) require client-side OCR
      if (mimeType.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Image files require client-side OCR processing' },
          { status: 400 }
        );
      }
      
      extractedText = await extractTextFromBuffer(buffer, mimeType);
    } catch (error) {
      console.error('Text extraction error:', error);
      return NextResponse.json(
        { error: 'Failed to extract text from file' },
        { status: 422 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content found in file' },
        { status: 422 }
      );
    }

    // Upload to ElevenLabs Knowledge Base
    let knowledgeBaseDoc;
    try {
      knowledgeBaseDoc = await uploadToKnowledgeBase(userId, {
        name,
        content: extractedText,
        category: category || undefined,
      });
    } catch (error) {
      console.error('Knowledge base upload error:', error);
      return NextResponse.json(
        { error: 'Failed to index document in knowledge base' },
        { status: 500 }
      );
    }

    // Store document metadata in database
    const document = await prisma.document.create({
      data: {
        userId,
        name,
        category: category || null,
        contentType: mimeType,
        size: file.size,
        elevenLabsDocId: knowledgeBaseDoc.id,
        content: extractedText.substring(0, 10000), // Store first 10k chars
        processedAt: knowledgeBaseDoc.status === 'indexed' ? new Date() : null,
        metadata: {
          chunkCount: knowledgeBaseDoc.chunkCount,
          originalFileName: file.name,
          wordCount: extractedText.split(/\s+/).length,
        },
      },
    });

    const response: DocumentUploadResponse = {
      document_id: document.id,
      status: knowledgeBaseDoc.status,
      chunk_count: knowledgeBaseDoc.chunkCount,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);
    
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

