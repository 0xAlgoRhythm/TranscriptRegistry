import { db } from './dist/db/connection.js';
import { students } from './dist/db/schema.js';

async function test() {
  try {
    await db.insert(students).values({
      walletAddress: "0xtest123" + Date.now(),
      fullName: "Test",
      studentId: "123",
      universityId: 1,
      status: "approved",
      email: "test@test.com",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    console.log("Success");
  } catch (e) {
    console.error("EXACT ERROR:", e);
  }
  process.exit(0);
}
test();
