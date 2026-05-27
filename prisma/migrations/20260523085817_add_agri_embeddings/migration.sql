-- CreateTable
CREATE TABLE "AgriEmbedding" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,

    CONSTRAINT "AgriEmbedding_pkey" PRIMARY KEY ("id")
);
