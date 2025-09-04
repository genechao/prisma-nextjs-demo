-- CreateTable
CREATE TABLE "public"."category" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item_type" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "item_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item" (
    "id" SERIAL NOT NULL,
    "item_type_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "requested_by" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loan" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "patron_name" TEXT NOT NULL,
    "checkout_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ItemToCategory" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ItemToCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_code_key" ON "public"."category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "item_type_code_key" ON "public"."item_type"("code");

-- CreateIndex
CREATE INDEX "_ItemToCategory_B_index" ON "public"."_ItemToCategory"("B");

-- AddForeignKey
ALTER TABLE "public"."category" ADD CONSTRAINT "category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."item" ADD CONSTRAINT "item_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "public"."item_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."loan" ADD CONSTRAINT "loan_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."_ItemToCategory" ADD CONSTRAINT "_ItemToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ItemToCategory" ADD CONSTRAINT "_ItemToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
