const prisma = require("../config/prisma");

const AUTO_HIDE_REPORT_THRESHOLD = 3;

// =======================================
// FIND MEAL BY ID
// =======================================
const findMealById = async (mealId) => {
  return await prisma.meal.findUnique({
    where: {
      id: Number(mealId),
    },
  });
};

// =======================================
// USER ALREADY REPORTED THIS MEAL?
// =======================================
const findUserReportForMeal = async (mealId, userId) => {
  return await prisma.report.findUnique({
    where: {
      mealId_userId: {
        mealId: Number(mealId),
        userId: Number(userId),
      },
    },
  });
};

// =======================================
// CREATE REPORT (auto-hide at threshold)
// =======================================
const createReport = async ({
  mealId,
  userId,
  reason,
}) => {
  const id = Number(mealId);
  const uid = Number(userId);

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.report.findUnique({
      where: {
        mealId_userId: {
          mealId: id,
          userId: uid,
        },
      },
    });

    if (existing) {
      const err = new Error("You have already reported this listing");
      err.code = "DUPLICATE_REPORT";
      throw err;
    }

    const report = await tx.report.create({
      data: {
        mealId: id,
        userId: uid,
        reason,
      },
    });

    const reportCount = await tx.report.count({
      where: {
        mealId: id,
      },
    });

    let mealAutoHidden = false;

    if (reportCount >= AUTO_HIDE_REPORT_THRESHOLD) {
      const mealRow = await tx.meal.findUnique({
        where: {
          id,
        },

        select: {
          hiddenAt: true,
        },
      });

      await tx.meal.update({
        where: {
          id,
        },

        data: {
          isHidden: true,

          hiddenAt:
            mealRow.hiddenAt ?? new Date(),
        },
      });

      mealAutoHidden =
        reportCount === AUTO_HIDE_REPORT_THRESHOLD;
    }

    return {
      report,

      reportCount,

      mealAutoHidden,
    };
  });
};

// =======================================
// GET ALL REPORTS
// =======================================
const getAllReports = async () => {
  return await prisma.report.findMany({
    orderBy: {
      createdAt: "desc",
    },

    include: {
      meal: {
        include: {
          restaurant: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
};

// =======================================
// GET REPORT COUNT
// =======================================
const getMealReportCount = async (mealId) => {
  return await prisma.report.count({
    where: {
      mealId: Number(mealId),
    },
  });
};

module.exports = {
  findMealById,
  findUserReportForMeal,
  createReport,
  getAllReports,
  getMealReportCount,
  AUTO_HIDE_REPORT_THRESHOLD,
};
