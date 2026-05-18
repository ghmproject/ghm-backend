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
// CREATE REPORT (auto-hide at threshold)
// =======================================
const createReport = async ({
  mealId,
  reason,
}) => {
  const id = Number(mealId);

  return await prisma.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: {
        mealId: id,
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
      const existing = await tx.meal.findUnique({
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
            existing.hiddenAt ?? new Date(),
        },
      });

      mealAutoHidden =
        reportCount ===
        AUTO_HIDE_REPORT_THRESHOLD;
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
  createReport,
  getAllReports,
  getMealReportCount,
  AUTO_HIDE_REPORT_THRESHOLD,
};
