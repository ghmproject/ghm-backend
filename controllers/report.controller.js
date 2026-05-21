const {
  findMealById,
  findUserReportForMeal,
  createReport,
  getAllReports,
} = require("../models/report.model");

// =======================================
// MY REPORT STATUS FOR A MEAL
// =======================================
const getMyReportStatusController = async (req, res) => {
  try {
    const mealId = Number(req.params.mealId);
    const userId = Number(req.user?.id);

    if (!Number.isFinite(userId)) {
      return res.status(401).json({
        success: false,
        message: "Sign in required",
        hasReported: false,
      });
    }

    if (!Number.isFinite(mealId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mealId",
      });
    }

    const existing = await findUserReportForMeal(mealId, userId);

    return res.status(200).json({
      success: true,
      hasReported: Boolean(existing),
      data: existing,
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
// CREATE REPORT
// =======================================
const createReportController = async (req, res) => {
  try {
    const { mealId, reason } = req.body;
    const userId = Number(req.user?.id);

    if (!Number.isFinite(userId)) {
      return res.status(401).json({
        success: false,
        message: "Sign in required to report a listing",
      });
    }

    if (!mealId) {
      return res.status(400).json({
        success: false,
        message: "mealId is required",
      });
    }

    if (!reason || !String(reason).trim()) {
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

    const { report, reportCount, mealAutoHidden } = await createReport({
      mealId,
      userId,
      reason: String(reason).trim(),
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

    if (error.code === "DUPLICATE_REPORT" || error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "You have already reported this listing",
        hasReported: true,
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid listing or session. Sign out, sign in again, then retry.",
      });
    }

    console.error("createReport error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message || "Internal server error",
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
  getMyReportStatusController,
  createReportController,
  getReportsController,
};
