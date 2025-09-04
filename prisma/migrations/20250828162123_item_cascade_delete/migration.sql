-- DropForeignKey
ALTER TABLE "public"."loan" DROP CONSTRAINT "loan_item_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."loan" ADD CONSTRAINT "loan_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
