const prisma = require("../config/prisma");

const updateUserName = async (userId, name) => {
  return prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { id: true, name: true, email: true, role: true },
  });
};

module.exports = { updateUserName };
