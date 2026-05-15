const {
  getPendingMeals,
  approveMeal,
  rejectMeal,
} = require("../models/admin.model");


// ======================================
// GET PENDING REQUESTS
// ======================================
const getPendingRequests =
  async (req, res) => {
    try {
      const meals =
        await getPendingMeals();

      return res.status(200).json({
        success: true,
        data: meals,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Internal server error",
      });
    }
  };


// ======================================
// APPROVE REQUEST
// ======================================
const approveRequest =
  async (req, res) => {
    try {
      const { id } = req.params;

      const meal =
        await approveMeal(id);

      return res.status(200).json({
        success: true,
        message:
          "Meal approved successfully",
        data: meal,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Internal server error",
      });
    }
  };


// ======================================
// REJECT REQUEST
// ======================================
const rejectRequest =
  async (req, res) => {
    try {
      const { id } = req.params;

      const meal =
        await rejectMeal(id);

      return res.status(200).json({
        success: true,
        message:
          "Meal rejected successfully",
        data: meal,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Internal server error",
      });
    }
  };

module.exports = {
  getPendingRequests,
  approveRequest,
  rejectRequest,
};