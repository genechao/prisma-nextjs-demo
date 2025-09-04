/*
  Warnings:

  - A unique constraint covering the columns `[current_loan_id]` on the table `item` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."item" ADD COLUMN     "current_loan_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."loan" ADD COLUMN     "returned_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE UNIQUE INDEX "item_current_loan_id_key" ON "public"."item"("current_loan_id");

-- AddForeignKey
ALTER TABLE "public"."item" ADD CONSTRAINT "item_current_loan_id_fkey" FOREIGN KEY ("current_loan_id") REFERENCES "public"."loan"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
