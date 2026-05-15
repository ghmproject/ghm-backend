const prisma = require("../config/prisma");


// =======================================
// CREATE REPORT
// =======================================
const createReport = async ({
  mealId,
  reason,
}) => {

  return await prisma.report.create({
    data: {
      mealId,
      reason,
    },
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
const getMealReportCount = async (
  mealId
) => {

  return await prisma.report.count({
    where: {
      mealId: Number(mealId),
    },
  });
};

module.exports = {
  createReport,
  getAllReports,
  getMealReportCount,
};