// Prisma client was removed during migration to Mongoose.
// Some compiled artifacts or libraries may still import this file.
// To avoid runtime errors while the codebase is being fully migrated,
// this module intentionally throws with an actionable message.

export const db = new Proxy({}, {
  get() {
    throw new Error(
      "Prisma client has been removed. The project now uses Mongoose.\n" +
      "Replace imports of '@/lib/prisma' or './prisma' with '@/lib/mongoose' and Mongoose models."
    );
  }
});
