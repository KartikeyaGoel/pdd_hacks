import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateFile, extractText } from "@/lib/file-processing";
import { uploadToKnowledgeBase } from "@/lib/elevenlabs";

/**
 * POST handler for /api/upload-document
 * Handles multipart file uploads, processes content, uploads to ElevenLabs,
 * and stores metadata in the database.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to upload documents." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const category = formData.get("category") as string | null;

    // 3. Basic request validation
    if (!file || !name) {
      return NextResponse.json(
        { error: "Missing required fields: file and name are required." },
        { status: 400 }
      );
    }

    // 4. Validate file type and size
    const validationResult = validateFile(file);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // 5. Extract text content from the file
    let extractedText: string;
    try {
      extractedText = await extractText(file);
    } catch (error) {
      console.error("Text extraction failed:", error);
      return NextResponse.json(
        { error: "Failed to process file content." },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "File appears to be empty or text could not be extracted." },
        { status: 400 }
      );
    }

    // 6. Upload to ElevenLabs Knowledge Base
    // We namespace the upload by userId to ensure isolation in the vector store
    let elevenLabsDocId: string;
    try {
      const kbResult = await uploadToKnowledgeBase(userId, {
        name,
        content: extractedText,
        category: category || "general",
      });
      elevenLabsDocId = kbResult.documentId;
    } catch (error) {
      console.error("ElevenLabs upload failed:", error);
      return NextResponse.json(
        { error: "Failed to sync document with AI knowledge base." },
        { status: 502 } // Bad Gateway indicates upstream service failure
      );
    }

    // 7. Store metadata in PostgreSQL via Prisma
    const document = await prisma.document.create({
      data: {
        userId,
        name,
        category: category || "general",
        elevenLabsDocId,
        fileType: file.type,
        fileSize: file.size,
        status: "processed", // Assuming immediate processing success if we got here
      },
    });

    // 8. Return success response
    return NextResponse.json(
      {
        success: true,
        document_id: document.id,
        status: document.status,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}