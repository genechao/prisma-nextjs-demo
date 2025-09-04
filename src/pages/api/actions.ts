import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '../../../generated/prisma'
import { prisma } from '../../lib/prisma'
import { Snapshot } from '../../lib/types'

// WARNING: This API route is simplified for demo purposes.
// In a real application, you would typically:
// - Implement authorization checks (e.g., Auth.js) for every request.
// - Use a comprehensive input validation library (e.g., Zod) for all incoming payloads.
// - Have multiple, dedicated API endpoints for better organization and RESTfulness.
// - Return specific, relevant objects or messages from write operations, rather than a full data snapshot.

// This file defines the backend API routes for the Prisma Next.js demo.
// It handles incoming requests from the frontend and interacts with the database
// using Prisma Client to perform CRUD operations, providing a "snapshot" of data.
//
// A "snapshot" in this context refers to a comprehensive, up-to-date view
// of the relevant database state (all items, item types, and categories)
// that is fetched and sent to the frontend after every action. This ensures
// the UI always reflects the latest data without complex client-side state management.

async function getSnapshot(): Promise<Snapshot> {
  // This function fetches a snapshot of all relevant data (ItemTypes, Categories, Items) for the UI.
  // It uses Prisma's findMany operations to query the database.
  // Promise.all is used to execute these database queries simultaneously for efficiency.
  const [itemTypes, categories, items] = await Promise.all([
    // prisma.itemType.findMany: Fetches all records from the ItemType model.
    // select: { field: true } is used to explicitly specify which columns to return.
    // This reduces the data payload and improves performance by only fetching necessary data.
    prisma.itemType.findMany({ select: { id: true, code: true, name: true } }),
    // prisma.category.findMany: Fetches all records from the Category model.
    // Includes parentId to represent hierarchical categories.
    prisma.category.findMany({ select: { id: true, code: true, name: true, parentId: true } }),
    // prisma.item.findMany: Fetches all records from the Item model.
    // Includes nested 'select' for related models (itemType, categories, currentLoan)
    // to fetch their data in a single query (eager loading).
    // orderBy: { id: 'asc' } ensures a consistent order for the items.
    prisma.item.findMany({
        select: {
          id: true,
          title: true,
          requestedBy: true,
          itemType: { select: { id: true, name: true } }, // Select specific fields from related ItemType
          categories: { select: { id: true, name: true } }, // Select specific fields from related Categories
          currentLoan: { select: { id: true, patronName: true, checkoutDate: true } }, // Select specific fields from related Loan
        },
        orderBy: { id: 'asc' },
    }).then((items) =>
        // Post-processing: Convert checkoutDate to ISO string for consistent frontend display.
        // Prisma returns Date objects, but for JSON serialization and frontend consistency,
        // converting to ISO string is often preferred.
        items.map((i) => ({
          ...i,
          currentLoan: i.currentLoan
            ? { ...i.currentLoan, checkoutDate: new Date(i.currentLoan.checkoutDate as unknown as Date).toISOString() }
            : null,
        }))
      ),
  ])
  return { itemTypes, categories, items }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure the authentication token is configured in the environment.
    if (!process.env.NEXT_PUBLIC_DEMO_AUTH_TOKEN) {
      console.error('NEXT_PUBLIC_DEMO_AUTH_TOKEN is not set. Please configure your .env.local file.');
      return res.status(500).json({ ok: false, message: 'Server configuration error: Authentication token not set.' });
    }

    if (req.method === 'GET') {
      const snapshot = await getSnapshot()
      // return res.status(200).json({ ok: true, snapshot })
      return res.status(200).send(JSON.stringify({ ok: true, snapshot }, null, 2))
    }

    if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' })

    // In a real app, you'd add authorization checks here.
    // Example using Auth.js:
    //
    // import { getSession } from 'next-auth/react';
    // const session = await getSession({ req });
    // if (!session || session.user.role !== 'ADMIN') {
    //   return res.status(403).json({ ok: false, message: 'Forbidden' });
    // }
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!authHeader || !authHeader.startsWith('Bearer ') || token !== process.env.NEXT_PUBLIC_DEMO_AUTH_TOKEN) {
      return res.status(401).json({ ok: false, message: 'Unauthorized: Invalid or missing token.' });
    }

    const { action, payload } = req.body as { action: string; payload?: Record<string, unknown> }

    if (!action || !payload) {
      return res.status(400).json({ ok: false, message: 'Action and payload are required.' })
    }

    switch (action) {
      case 'createItemType': {
        const { code, name } = payload as { code: string; name: string }
        if (!code || code.trim().length === 0) {
          return res.status(400).json({ ok: false, message: 'Item type code is required.' })
        }
        if (!name || name.trim().length === 0) {
          return res.status(400).json({ ok: false, message: 'Item type name is required.' })
        }
        // prisma.itemType.create: Inserts a new record into the ItemType model.
        // The 'data' object contains the fields for the new record.
        await prisma.itemType.create({ data: { code, name } })
        break
      }
      case 'createCategory': {
        const { code, name, parentId } = payload as { code: string; name: string; parentId?: number | null }
        if (!code || code.trim().length === 0) {
          return res.status(400).json({ ok: false, message: 'Category code is required.' })
        }
        if (!name || name.trim().length === 0) {
          return res.status(400).json({ ok: false, message: 'Category name is required.' })
        }
        // prisma.category.create: Inserts a new record into the Category model.
        // parentId: parentId ?? null handles optional self-referencing for nested categories.
        await prisma.category.create({ data: { code, name, parentId: parentId ?? null } })
        break
      }
      case 'createItem': {
        const { title, itemTypeId, requestedBy } = payload as { title: string; itemTypeId: number; requestedBy?: string | null }
        if (!title || title.trim().length === 0) {
          return res.status(400).json({ ok: false, message: 'Item title is required.' })
        }
        if (typeof itemTypeId !== 'number' || isNaN(itemTypeId)) {
          return res.status(400).json({ ok: false, message: 'Item type ID is required and must be a number.' })
        }
        // prisma.item.create: Inserts a new record into the Item model.
        // itemTypeId links the new item to an existing ItemType.
        await prisma.item.create({
          data: {
            title,
            itemTypeId,
            requestedBy: (typeof requestedBy === 'string' && requestedBy.trim().length === 0) ? null : (requestedBy ?? null)
          }
        })
        break
      }
      case 'linkCategory': {
        const { itemId, categoryId } = payload as { itemId: number; categoryId: number }
        if (typeof itemId !== 'number' || isNaN(itemId)) {
          return res.status(400).json({ ok: false, message: 'Item ID is required and must be a number.' })
        }
        if (typeof categoryId !== 'number' || isNaN(categoryId)) {
          return res.status(400).json({ ok: false, message: 'Category ID is required and must be a number.' })
        }
        // prisma.item.update: Updates an existing Item record.
        // where: { id: itemId } specifies the record to update.
        // data: { categories: { connect: { id: categoryId } } } links the Item to a Category
        // in a many-to-many relationship without creating new records.
        await prisma.item.update({
          where: { id: itemId },
          data: { categories: { connect: { id: categoryId } } },
        })
        break
      }
      case 'unlinkCategory': {
        const { itemId, categoryId } = payload as { itemId: number; categoryId: number }
        if (typeof itemId !== 'number' || isNaN(itemId)) {
          return res.status(400).json({ ok: false, message: 'Item ID is required and must be a number.' })
        }
        if (typeof categoryId !== 'number' || isNaN(categoryId)) {
          return res.status(400).json({ ok: false, message: 'Category ID is required and must be a number.' })
        }
        // prisma.item.update: Updates an existing Item record.
        // where: { id: itemId } specifies the record to update.
        // data: { categories: { disconnect: { id: categoryId } } } unlinks the Item from a Category
        // in a many-to-many relationship without deleting records.
        await prisma.item.update({
          where: { id: itemId },
          data: { categories: { disconnect: { id: categoryId } } },
        })
        break
      }
      case 'checkout': {
        const { itemId, patronName } = payload as { itemId: number; patronName: string }
        if (typeof itemId !== 'number' || isNaN(itemId)) {
          return res.status(400).json({ ok: false, message: 'Item ID is required and must be a number.' })
        }
        if (!patronName || patronName.trim().length === 0) {
          return res.status(400).json({ ok: false, message: 'Patron name is required.' })
        }
        // prisma.$transaction: Ensures atomicity for multiple database operations.
        // If any operation within the transaction fails, all changes are rolled back.
        // This is crucial here to prevent race conditions (e.g., two people checking out the same item).
        await prisma.$transaction(async (tx) => {
          // tx.loan.create: Creates a new Loan record within the transaction.
          const loan = await tx.loan.create({ data: { itemId, patronName } })
          // tx.item.updateMany: Attempts to update the Item to link it to the new loan.
          // The 'where' clause (currentLoanId: null) is critical for preventing race conditions:
          // it ensures the update only happens if the item is NOT already loaned.
          const updated = await tx.item.updateMany({
            where: { id: itemId, currentLoanId: null },
            data: { currentLoanId: loan.id },
          })
          // If updated.count is 0, it means the item was already loaned or didn't exist,
          // so we throw an error to roll back the entire transaction (including the loan creation).
          if (updated.count === 0) {
            throw new Error('Item already loaned or does not exist')
          }
        })
        break
      }
      case 'return': {
        const { itemId } = payload as { itemId: number }
        if (typeof itemId !== 'number' || isNaN(itemId)) {
          return res.status(400).json({ ok: false, message: 'Item ID is required and must be a number.' })
        }
        // prisma.item.findUnique: Finds a single Item record by its unique ID.
        // select: { currentLoanId: true } fetches only the currentLoanId field.
        const item = await prisma.item.findUnique({
          where: { id: itemId },
          select: { currentLoanId: true }
        })
        // Check if the item actually has an active loan.
        if (!item?.currentLoanId) throw new Error('No active loan for this item')
        // prisma.$transaction: Ensures atomicity for updating the loan and clearing the item's loan ID.
        await prisma.$transaction(async (tx) => {
          // tx.loan.update: Marks the specific loan as returned by setting returnedAt to the current date.
          await tx.loan.update({
            where: { id: item.currentLoanId! },
            data: { returnedAt: new Date() }
          })
          // tx.item.updateMany: Clears the currentLoanId on the Item.
          // The 'where' clause ensures this only happens if the currentLoanId still matches
          // the one we just marked as returned, preventing race conditions.
          const updated = await tx.item.updateMany({
            where: { id: itemId, currentLoanId: item.currentLoanId! },
            data: { currentLoanId: null },
          })
          // If updated.count is 0, it means the loan was already cleared or didn't match,
          // so we throw an error to roll back the transaction.
          if (updated.count === 0) {
            throw new Error('Failed to return item. It may have been returned by another process.')
          }
        })
        break
      }
      case 'deleteItem': {
        const { id } = payload as { id: number }
        if (typeof id !== 'number' || isNaN(id)) {
          return res.status(400).json({ ok: false, message: 'Item ID is required and must be a number.' })
        }
        // prisma.item.delete: Deletes a record from the Item model.
        // The 'where' clause specifies which record to delete.
        await prisma.item.delete({ where: { id } })
        break
      }
      default:
        return res.status(400).json({ ok: false, message: 'Unknown action' })
    }

    const snapshot = await getSnapshot()
    // return res.status(200).json({ ok: true, snapshot })
    return res.status(200).send(JSON.stringify({ ok: true, snapshot }, null, 2))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    // Check if the error is a known Prisma Client error.
    // For example, 'P2025' indicates a record not found for an update or delete operation.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return res.status(404).json({ ok: false, message: 'Record not found' })
    }
    return res.status(400).json({ ok: false, message })
  }
}
