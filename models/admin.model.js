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
// First submission (only meal on restaurant) → delete meal + restaurant.
// Existing restaurant → delete meal only.
// ======================================
const rejectMeal = async (id) => {
  const mealId = Number(id);

  return await prisma.$transaction(async (tx) => {
    const meal = await tx.meal.findUnique({
      where: { id: mealId },
      select: { id: true, restaurantId: true },
    });

    if (!meal) {
      const err = new Error("Meal not found");
      err.code = "P2025";
      throw err;
    }

    await tx.hotDeal.deleteMany({ where: { mealId } });
    await tx.report.deleteMany({ where: { mealId } });
    await tx.vote.deleteMany({ where: { mealId } });

    const comments = await tx.comment.findMany({
      where: { mealId },
      select: { id: true },
    });
    const commentIds = comments.map((c) => c.id);

    if (commentIds.length > 0) {
      await tx.commentLike.deleteMany({
        where: { commentId: { in: commentIds } },
      });
      await tx.comment.deleteMany({
        where: { mealId, parentCommentId: { not: null } },
      });
      await tx.comment.deleteMany({ where: { mealId } });
    }

    await tx.meal.delete({ where: { id: mealId } });

    const remainingMeals = await tx.meal.count({
      where: { restaurantId: meal.restaurantId },
    });

    if (remainingMeals === 0) {
      await tx.restaurant.delete({
        where: { id: meal.restaurantId },
      });
    }

    return meal;
  });
};

// ======================================
// EXPORT MEALS (CSV template columns)
// ======================================
const getMealsForCsvExport = async () => {
  return await prisma.meal.findMany({
    where: {
      status: "APPROVED",
    },
    include: {
      restaurant: true,
    },
    orderBy: [
      { restaurant: { name: "asc" } },
      { dishName: "asc" },
    ],
  });
};

module.exports = {
  getPendingMeals,
  approveMeal,
  rejectMeal,
  getMealsForCsvExport,
};
