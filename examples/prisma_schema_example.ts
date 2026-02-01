/**
 * example_usage.ts
 *
 * This script demonstrates how to use the generated Prisma Client based on the
 * provided schema.prisma file.
 *
 * Prerequisites:
 * 1. Ensure your .env file has a valid DATABASE_URL.
 * 2. Run `npx prisma db push` or `npx prisma migrate dev` to sync the DB.
 * 3. Run `npx prisma generate` to update the client.
 */

import { PrismaClient } from '@prisma/client';

// Initialize the Prisma Client
// In a real application, this is often exported from a singleton module (e.g., lib/prisma.ts)
const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. Creating Data with Nested Writes ---');

  // Create a new User along with an initial Conversation and Messages.
  // Prisma handles the foreign keys (userId, conversationId) automatically.
  const newUser = await prisma.user.create({
    data: {
      email: `learner_${Date.now()}@example.com`, // Ensure uniqueness
      name: 'Alex Learner',
      profile: {
        bio: 'Passionate learner interested in astronomy',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      },

      // Creating related Conversation
      conversations: {
        create: {
          title: 'Introduction to Astrophysics',
          summary: 'Discussing basic concepts of stars and galaxies.',
          // Creating related Messages within the Conversation
          messages: {
            create: [
              {
                role: 'system',
                content: 'You are a helpful astronomy tutor.',
              },
              {
                role: 'user',
                content: 'How are stars formed?',
              },
            ],
          },
        },
      },
    },
    // Include the created relations in the result
    include: {
      conversations: {
        include: {
          messages: true
        }
      },
    }
  });

  console.log(`Created User: ${newUser.id}`);
  console.log(`Created Conversation: ${newUser.conversations[0].id}`);
  console.log(`Initial Message Count: ${newUser.conversations[0].messages.length}`);


  console.log('\n--- 2. Working with Documents (Unique Constraints) ---');

  // Create a Document for the user
  // The schema defines a unique constraint on `elevenLabsDocId` if it exists
  const newDoc = await prisma.document.create({
    data: {
      userId: newUser.id,
      name: 'Star_Formation_Notes.pdf',
      contentType: 'application/pdf',
      category: 'Science',
      elevenLabsDocId: 'el_kb_unique_123', // Must be unique across the table
    },
  });

  console.log(`Uploaded Document: ${newDoc.name} (ID: ${newDoc.id})`);


  console.log('\n--- 3. Querying with Indexes and Filters ---');

  // Fetch conversations for the user.
  // The schema has @@index([userId]) and @@index([userId, startedAt]),
  // making this query highly optimized.
  const recentConversations = await prisma.conversation.findMany({
    where: {
      userId: newUser.id,
      deletedAt: null, // Filter out "soft deleted" items
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: 5,
    select: {
      id: true,
      title: true,
      startedAt: true,
      _count: {
        select: { messages: true } // Efficiently count related messages
      }
    }
  });

  console.log('Recent Conversations:', recentConversations);


  console.log('\n--- 4. Implementing Soft Delete ---');

  // The schema uses `deletedAt` for soft deletes.
  // We update the record instead of using prisma.conversation.delete()
  if (recentConversations.length > 0) {
    const conversationId = recentConversations[0].id;

    const softDeleted = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        deletedAt: new Date(), // Set the timestamp
      },
    });

    console.log(`Soft deleted conversation: ${softDeleted.id}`);
    console.log(`Deleted At: ${softDeleted.deletedAt}`);
  }
}

// Execute the script
main()
  .catch((e) => {
    console.error('Error executing example:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
