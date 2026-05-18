const {
    findPublicApprovedVisibleMeal,
    findExistingVote,
    createVote,
    getMealVotes,
  } = require("../models/vote.model");
  
  
  // =====================================
  // VOTE MEAL
  // =====================================
  const voteMeal = async (
    req,
    res
  ) => {
  
    try {
  
      const { mealId } =
        req.params;
  
      const visibleMeal =
        await findPublicApprovedVisibleMeal(
          mealId
        );
  
      if (!visibleMeal) {
  
        return res.status(404).json({
          success: false,
  
          message:
            "Meal not found",
        });
      }
  
      const {
        voteType,
        deviceId,
      } = req.body;
  
  
      // VALIDATION
      if (!voteType) {
  
        return res.status(400).json({
          success: false,
  
          message:
            "voteType is required",
        });
      }
  
  
      // VALID VOTE TYPES
      if (
        voteType !== "UP" &&
        voteType !== "DOWN"
      ) {
  
        return res.status(400).json({
          success: false,
  
          message:
            "Invalid vote type",
        });
      }
  
  
      // GET IP ADDRESS
      const ipAddress =
        req.headers[
          "x-forwarded-for"
        ] ||
        req.socket.remoteAddress;
  
  
      // CHECK EXISTING VOTE
      const alreadyVoted =
        await findExistingVote({
  
          mealId:
            Number(mealId),
  
          ipAddress,
  
          deviceId,
        });
  
  
      if (alreadyVoted) {
  
        return res.status(409).json({
          success: false,
  
          message:
            "You already voted for this meal",
        });
      }
  
  
      // CREATE VOTE
      await createVote({
  
        mealId:
          Number(mealId),
  
        voteType,
  
        ipAddress,
  
        deviceId,
      });
  
  
      // UPDATED COUNTS
      const votes =
        await getMealVotes(
          Number(mealId)
        );
  
  
      return res.status(201).json({
  
        success: true,
  
        message:
          "Vote submitted successfully",
  
        data: votes,
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
  
  
  // =====================================
  // GET TOTAL VOTES
  // =====================================
  const getTotalVotes = async (
    req,
    res
  ) => {
  
    try {
  
      const { mealId } =
        req.params;
  
      const visibleMeal =
        await findPublicApprovedVisibleMeal(
          mealId
        );
  
      if (!visibleMeal) {
  
        return res.status(404).json({
          success: false,
  
          message:
            "Meal not found",
        });
      }
  
      const votes =
        await getMealVotes(
          Number(mealId)
        );
  
      return res.status(200).json({
  
        success: true,
  
        data: votes,
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
    voteMeal,
    getTotalVotes,
  };