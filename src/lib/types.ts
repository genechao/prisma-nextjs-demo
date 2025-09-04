import { Prisma } from '../../generated/prisma'

// This file defines the shared TypeScript types for the application.
// It uses Prisma's generated types to ensure that the types are always
// in sync with the database schema.

// Prisma.ModelGetPayload is a utility type that allows you to create a type
// that represents the payload of a Prisma model. It takes a generic argument
// that specifies the shape of the payload, including the fields to select.
// This is a powerful way to create types that are derived from your Prisma schema
// without having to manually define them.
//
// The template parameter for GetPayload is an object with a `select` property.
// The `select` property is an object where the keys are the names of the fields
// to include in the type, and the values are `true`.

export type ItemType = Prisma.ItemTypeGetPayload<{
  select: { id: true, code: true, name: true },
}>

export type Category = Prisma.CategoryGetPayload<{
  select: { id: true, code: true, name: true, parentId: true },
}>

// The Item type is customized to convert the checkoutDate from a Date object to a string.
// This is necessary because the frontend expects a string for display purposes, and this conversion
// is handled in the API layer. By modifying the type here, we ensure type safety across the application.
export type Item = Omit<Prisma.ItemGetPayload<{
  select: {
    id: true,
    title: true,
    requestedBy: true,
    itemType: { select: { id: true, name: true } },
    categories: { select: { id: true, name: true } },
    currentLoan: { select: { id: true, patronName: true, checkoutDate: true } },
  },
}>, 'currentLoan'> & {
  currentLoan: (Omit<Prisma.LoanGetPayload<{
    select: { id: true, patronName: true, checkoutDate: true },
  }>, 'checkoutDate'> & { checkoutDate: string }) | null
}

export type Snapshot = {
  itemTypes: ItemType[]
  categories: Category[]
  items: Item[]
}

export type ApiResponse = {
  ok: boolean
  message?: string
  snapshot?: Snapshot
}