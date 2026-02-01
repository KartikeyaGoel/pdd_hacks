import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET handler for /api/documents
 * Retrieves a paginated list of documents for the authenticated user.
 * Supports filtering by category and sorting by date, name, or size.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication Check
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to view documents." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse Query Parameters
    const searchParams = request.nextUrl.searchParams;
    
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "date";
    const orderParam = searchParams.get("order")?.toLowerCase();
    const order = orderParam === "asc" ? "asc" : "desc"; // Default to desc
    
    // Pagination parsing with safety checks
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    const limit = isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 100); // Clamp between 1 and 100
    
    const offsetParam = parseInt(searchParams.get("offset") || "0", 10);
    const offset = isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0); // Ensure non-negative

    // 3. Construct Prisma Query Objects
    
    // Filter construction
    const where: Prisma.DocumentWhereInput = {
      userId: userId,
      ...(category ? { category } : {}),
    };

    // Sort construction
    let orderBy: Prisma.DocumentOrderByWithRelationInput;
    switch (sort) {
      case "name":
        orderBy = { name: order };
        break;
      case "size":
        orderBy = { fileSize: order };
        break;
      case "date":
      default:
        orderBy = { uploadedAt: order };
        break;
    }

    // 4. Execute Database Queries (Parallel)
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          category: true,
          uploadedAt: true,
          fileSize: true,
          mimeType: true,
        },
      }),
      prisma.document.count({ where }),
    ]);

    // 5. Return Response
    return NextResponse.json({
      documents,
      total,
      limit,
      offset,
    });

  } catch (error) {
    console.error("Error fetching documents:", error);
    
    // Handle specific Prisma errors if necessary, otherwise generic 500
    return NextResponse.json(
      { error: "Internal Server Error: Failed to fetch documents." },
      { status: 500 }
    );
  }
}