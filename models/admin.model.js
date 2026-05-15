const prisma = require("../config/prisma");

// ======================================
// GET PENDING MEALS
// ======================================
const getPendingMeals = async () => {
  return await prisma.meal.findMany({
    where: {
      status: "PENDING",
    },

    include: {
      restaurant: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

// ======================================
// APPROVE MEAL
// ======================================
const approveMeal = async (id) => {
  return await prisma.meal.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "APPROVED",
    },
  });
};

// ======================================
// REJECT MEAL
// ======================================
const rejectMeal = async (id) => {
  return await prisma.meal.delete({
    where: {
      id: Number(id),
    },
  });
};

module.exports = {
  getPendingMeals,
  approveMeal,
  rejectMeal,
};
