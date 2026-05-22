-- AlterTable
ALTER TABLE "community_post_comments" ADD COLUMN "parentCommentId" TEXT,
ADD COLUMN "likesCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "community_post_comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_post_comment_likes_commentId_userId_key" ON "community_post_comment_likes"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "community_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_comment_likes" ADD CONSTRAINT "community_post_comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "community_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_comment_likes" ADD CONSTRAINT "community_post_comment_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
