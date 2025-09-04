import { Prisma } from '../generated/prisma'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ItemTypePayload = Prisma.ItemTypeGetPayload<{}>
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type CategoryPayload = Prisma.CategoryGetPayload<{}>
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type LoanPayload = Prisma.LoanGetPayload<{}>
type ItemPayload = Prisma.ItemGetPayload<{
  include: {
    itemType: true,
    categories: true,
    currentLoan: true,
  }
}>

export const itemTypes: ItemTypePayload[] = [
  { id: 1, code: 'BOOK', name: 'Book' },
  { id: 2, code: 'ELEC', name: 'Electronics' },
]

export const categories: CategoryPayload[] = [
  { id: 101, code: 'FICT', name: 'Fiction', parentId: null },
  { id: 102, code: 'SCIFI', name: 'Science Fiction', parentId: 101 },
]

// Loans need to be defined before items if items reference them
export const loans: LoanPayload[] = [
  { id: 1001, itemId: 1, patronName: 'Arthur Dent', checkoutDate: new Date('2025-08-01T10:00:00Z'), returnedAt: null, createdAt: new Date('2025-08-01T09:00:00Z'), updatedAt: new Date('2025-08-01T09:00:00Z') },
]

export const items: ItemPayload[] = [
  {
    id: 1,
    title: "The Hitchhiker's Guide to the Galaxy",
    itemTypeId: 1,
    requestedBy: null,
    currentLoanId: 1001,
    metadata: null,
    createdAt: new Date('2025-07-30T10:00:00Z'),
    updatedAt: new Date('2025-07-30T10:00:00Z'),
    // Nested relations for Payload type
    itemType: itemTypes[0],
    categories: [categories[0], categories[1]],
    currentLoan: loans[0],
  },
  {
    id: 2,
    title: 'Laptop Pro X',
    itemTypeId: 2,
    requestedBy: 'Ford Prefect',
    currentLoanId: null,
    metadata: null,
    createdAt: new Date('2025-07-30T11:00:00Z'),
    updatedAt: new Date('2025-07-30T11:00:00Z'),
    itemType: itemTypes[1],
    categories: [],
    currentLoan: null,
  },
  {
    id: 3,
    title: 'Learning Prisma',
    itemTypeId: 1,
    requestedBy: null,
    currentLoanId: null,
    metadata: null,
    createdAt: new Date('2025-07-30T12:00:00Z'),
    updatedAt: new Date('2025-07-30T12:00:00Z'),
    itemType: itemTypes[0],
    categories: [categories[0]],
    currentLoan: null,
  },
]

// Helper to get category IDs for item creation (for seed script)
export const getItemCategoryIds = (item: ItemPayload) => item.categories.map(cat => ({ id: cat.id }))
