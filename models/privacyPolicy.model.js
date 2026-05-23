const prisma = require("../config/prisma");

const getPrivacyPolicy = async () => {
  return prisma.privacyPolicy.findFirst({
    orderBy: { id: "asc" },
    select: { id: true, content: true, updatedAt: true },
  });
};

const upsertPrivacyPolicy = async (content) => {
  const existing = await prisma.privacyPolicy.findFirst({
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (existing) {
    return prisma.privacyPolicy.update({
      where: { id: existing.id },
      data: { content },
      select: { id: true, content: true, updatedAt: true },
    });
  }

  return prisma.privacyPolicy.create({
    data: { content },
    select: { id: true, content: true, updatedAt: true },
  });
};

module.exports = { getPrivacyPolicy, upsertPrivacyPolicy };
