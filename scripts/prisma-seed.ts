import { PrismaClient, Prisma } from '../generated/prisma'
import { itemTypes, categories, items, loans } from '../data/seed'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Maps to store original ID to new DB-generated ID
  // We can't specify the ID when creating records, because the schema uses auto-increment.
  const itemTypeMap = new Map<number, number>();
  const categoryMap = new Map<number, number>();
  const itemMap = new Map<number, number>();
  const loanMap = new Map<number, number>();

  // 1. Clear existing data
  console.log('Clearing existing data...')
  await prisma.loan.deleteMany({})
  await prisma.item.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.itemType.deleteMany({})
  console.log('Existing data cleared.')

  // 2. Seed ItemTypes
  for (const itemType of itemTypes) {
    const createdItemType = await prisma.itemType.create({
      data: {
        code: itemType.code,
        name: itemType.name,
      },
    })
    itemTypeMap.set(itemType.id, createdItemType.id);
  }
  console.log(`Seeded ${itemTypes.length} ItemTypes.`)

  // 3. Seed Categories
  for (const category of categories) {
    const createdCategory = await prisma.category.create({
      data: {
        code: category.code,
        name: category.name,
        parentId: category.parentId ? categoryMap.get(category.parentId) : null,
      },
    })
    categoryMap.set(category.id, createdCategory.id);
  }
  console.log(`Seeded ${categories.length} Categories.`)

  // 4. Seed Items (without currentLoanId initially)
  for (const item of items) {
    const createdItem = await prisma.item.create({
      data: {
        title: item.title,
        itemTypeId: itemTypeMap.get(item.itemTypeId)!,
        requestedBy: item.requestedBy,
        metadata: item.metadata === null ? Prisma.JsonNull : item.metadata,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        categories: {
          connect: item.categories.map(cat => ({ id: categoryMap.get(cat.id)! })),
        },
      },
    })
    itemMap.set(item.id, createdItem.id);
  }
  console.log(`Seeded ${items.length} Items.`)

  // 5. Seed Loans
  for (const loan of loans) {
    const createdLoan = await prisma.loan.create({
      data: {
        itemId: itemMap.get(loan.itemId)!,
        patronName: loan.patronName,
        checkoutDate: loan.checkoutDate,
        returnedAt: loan.returnedAt,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
      },
    })
    loanMap.set(loan.id, createdLoan.id);
  }
  console.log(`Seeded ${loans.length} Loans.`)

  // 6. Update Items with currentLoanId (after loans are created)
  for (const item of items) {
    if (item.currentLoanId) {
      await prisma.item.update({
        where: { id: itemMap.get(item.id)! },
        data: { currentLoanId: loanMap.get(item.currentLoanId)! },
      })
    }
  }
  console.log('Updated items with currentLoanId.')

  console.log('Seeding finished.')
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
