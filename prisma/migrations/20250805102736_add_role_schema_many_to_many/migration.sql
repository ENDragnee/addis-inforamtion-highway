-- CreateTable
CREATE TABLE "_DataSchemaToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DataSchemaToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DataSchemaToRole_B_index" ON "_DataSchemaToRole"("B");

-- AddForeignKey
ALTER TABLE "_DataSchemaToRole" ADD CONSTRAINT "_DataSchemaToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "DataSchema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DataSchemaToRole" ADD CONSTRAINT "_DataSchemaToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
