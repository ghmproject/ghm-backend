const prisma = require("../config/prisma");


// ==============================
// FIND USER BY EMAIL
// ==============================
const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
};


// ==============================
// COUNT USERS
// ==============================
const countUsers = async () => {
  return await prisma.user.count();
};


// ==============================
// CREATE USER
// ==============================
const createUser = async ({
  email,
  name,
  role,
}) => {
  return await prisma.user.create({
    data: {
      email,
      name,
      role,
    },
  });
};


// ==============================
// UPDATE MAGIC TOKEN
// ==============================
const updateMagicToken = async (
  userId,
  magicToken
) => {
  return await prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      magicToken,
    },
  });
};


// ==============================
// FIND USER BY TOKEN
// ==============================
const findUserByToken = async (
  id,
  token
) => {
  return await prisma.user.findFirst({
    where: {
      id,
      magicToken: token,
    },
  });
};


// ==============================
// REMOVE MAGIC TOKEN
// ==============================
const removeMagicToken = async (
  userId
) => {
  return await prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      magicToken: null,
    },
  });
};

module.exports = {
  findUserByEmail,
  countUsers,
  createUser,
  updateMagicToken,
  findUserByToken,
  removeMagicToken,
};