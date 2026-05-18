const {
  findMealById,
  createReport,
  getAllReports,
} = require("../models/report.model");

// =======================================
// CREATE REPORT
// =======================================
const createReportController = async (req, res) => {
  try {
    const { mealId, reason } = req.body;

    if (!mealId) {
      return res.status(400).json({
        success: false,
        message: "mealId is required",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "reason is required",
      });
    }

    const meal = await findMealById(mealId);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "Meal not found",
      });
    }

    const { report, reportCount, mealAutoHidden } =
      await createReport({
        mealId,
        reason,
      });

    return res.status(201).json({
      success: true,
      message: "Listing reported successfully",
      data: report,
      reportCount,
      mealAutoHidden,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =======================================
// GET ALL REPORTS
// =======================================
const getReportsController = async (req, res) => {
  try {
    const reports = await getAllReports();

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createReportController,
  getReportsController,
};
