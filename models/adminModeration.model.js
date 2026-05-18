const prisma = require("../config/prisma");

// ======================================
// REPORTED / HIDDEN LISTINGS (ADMIN)
// ======================================
const getReportedOrHiddenMeals = async () => {
  return await prisma.meal.findMany({
    where: {
      OR: [
        {
          isHidden: true,
        },

        {
          reports: {
            some: {},
          },
        },
      ],
    },

    include: {
      restaurant: true,

      reports: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },

    orderBy: [
      {
        isHidden: "desc",
      },

      {
        hiddenAt: "desc",
      },

      {
        id: "desc",
      },
    ],
  });
};

// ======================================
// RESTORE LISTING AFTER REVIEW
// ======================================
const restoreMealVisibility = async (mealId) => {
  return await prisma.meal.update({
    where: {
      id: Number(mealId),
    },

    data: {
      isHidden: false,

      hiddenAt: null,
    },
  });
};

// ======================================
// SOFT-REJECT LISTING (MODERATION)
// ======================================
const softRejectReportedListing = async (mealId) => {
  return await prisma.meal.update({
    where: {
      id: Number(mealId),
    },

    data: {
      status: "REJECTED",

      isHidden: false,

      hiddenAt: null,
    },
  });
};

module.exports = {
  getReportedOrHiddenMeals,
  restoreMealVisibility,
  softRejectReportedListing,
};
