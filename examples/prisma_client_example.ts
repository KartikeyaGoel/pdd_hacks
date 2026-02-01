import { NextResponse } from "next/server";
// Import the singleton instance from your library file
// Adjust the path based on where you saved the module (e.g., @/lib/prisma)
import { prisma } from "./lib/prisma";

/**
 * Example usage in a Next.js API Route (App Router)
 * 
 * This example demonstrates how to use the exported `prisma` singleton
 * to perform database operations. Because the module handles connection
 * pooling and hot-reloading logic, you can simply import and use it directly.
 */

export async function GET() {
  try {
    // 1. Use the imported `prisma` instance directly.
    // No need to instantiate `new PrismaClient()` here.
    
    // Example: Fetch all users
    // Note: This assumes a 'User' model exists in your schema.prisma
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // 2. Example: Create a record
    // const newUser = await prisma.user.create({
    //   data: {
    //     email: 'test@example.com',
    //     name: 'Test User'
    //   }
    // });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * Example usage in a Server Action
 */
export async function createUserAction(formData: FormData) {
  "use server";
  
  const email = formData.get("email") as string;
  
  if (!email) return { error: "Email required" };

  try {
    // The same singleton instance is reused here
    const user = await prisma.user.create({
      data: { email },
    });
    
    return { success: true, userId: user.id };
  } catch (e) {
    return { error: "Failed to create user" };
  }
}