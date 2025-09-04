// Import the PrismaClient constructor from the auto-generated Prisma Client package.
import { PrismaClient } from '../../generated/prisma'

// In development environments with "hot-reloading" (where the server automatically reloads
// when you save a file), the Node.js module cache is often cleared. This causes this file
// to be re-executed from scratch on every code change.
// If a new `PrismaClient` instance were created each time, it would quickly exhaust the
// database's connection limit and cause errors.
// 
// To prevent this, the `PrismaClient` instance is stored on a global object. The global object
// is a single, shared object that persists across module reloads within a single Node.js process.
// This ensures that only one instance of PrismaClient is ever created during the server's lifecycle.
// 
// `globalThis` is the standard, cross-platform way to access the global object.
// We cast `globalThis` to a custom type to tell TypeScript about the `prisma` property we intend to add.
// The `prisma` property is marked as optional (`?`) because it may not exist on the global object yet.
// On the first execution of this code, `globalThis` will not have a `prisma` property.
// Therefore, the expression `globalForPrisma.prisma` (on the line below) will evaluate to `undefined`.
// This is why the type is `{ prisma?: PrismaClient }` - to acknowledge this initial `undefined` state.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// This line exports a constant `prisma` instance for the rest of the application to use.
// If `globalForPrisma.prisma` has a value (meaning it was already created), it's reused.
// If it's `null` or `undefined` (on the very first execution), a `new PrismaClient()` is created.
// The result is that the exported `prisma` constant is always a defined `PrismaClient` instance.
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// This condition ensures the code inside only runs in a development environment (`NODE_ENV` is 'development').
// It saves the `prisma` instance to the global object. This is the crucial step that makes the pattern work.
// On the next hot-reload, the check on the `export const prisma` line above will find this
// globally stored instance and reuse it, preventing the creation of a new instance.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
