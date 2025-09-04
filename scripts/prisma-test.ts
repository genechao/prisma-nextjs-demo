import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Create an Item with a new ItemType and a new Category in a single nested write
  const created = await prisma.item.create({
    data: {
      title: 'The Great Gatsby',
      itemType: { create: { code: 'book', name: 'Book' } },
      categories: { create: [{ code: 'fiction', name: 'Fiction' }] },
    },
    include: { itemType: true, categories: true },
  })
  console.log('Created item:')
  console.dir(created, { depth: null })

  // Query all items
  let allItems = await prisma.item.findMany({
    include: { itemType: true, categories: true },
  })
  console.log('Queried all items:')
  console.dir(allItems, { depth: null })

  // Update the created item to set requestedBy
  const updated = await prisma.item.update({
    where: { id: created.id },
    data: { requestedBy: 'Dorothy' },
    include: { itemType: true, categories: true },
  })
  console.log('Updated item:')
  console.dir(updated, { depth: null })

  // Create a Loan for the created item (atomic: create Loan then set Item.currentLoanId)
  const createdLoan = await prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: { itemId: created.id, patronName: 'Elliot' },
    })

    const updated = await tx.item.updateMany({
      where: { id: created.id, currentLoanId: null },
      data: { currentLoanId: loan.id },
    })

    if (updated.count === 0) {
      // Another client grabbed the item concurrently
      throw new Error('Item already loaned')
    }

    return loan
  })
  console.log('Created loan:')
  console.dir(createdLoan, { depth: null })

  // Query all items
  allItems = await prisma.item.findMany({
    include: { itemType: true, categories: true, loans: true },
  })
  console.log('Queried all items:')
  console.dir(allItems, { depth: null })

  // Cleanup: delete the created loan, then the item and its related itemType and category in one transaction
  await prisma.$transaction([
    prisma.loan.delete({ where: { id: createdLoan.id } }),
    prisma.item.delete({ where: { id: created.id } }),
    prisma.itemType.delete({ where: { id: created.itemType.id } }),
    prisma.category.delete({ where: { id: created.categories[0].id } }),
  ])
  console.log('Cleanup completed')

  // Query all items
  allItems = await prisma.item.findMany({
    include: { itemType: true, categories: true },
  })
  console.log('Queried all items:')
  console.dir(allItems, { depth: null })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })