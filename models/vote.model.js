const prisma = require("../config/prisma");

const {
  publicApprovedMealWhere,
} = require("../utils/mealPublicFilter");


// =====================================
// FIND APPROVED, VISIBLE MEAL (PUBLIC)
// =====================================
const findPublicApprovedVisibleMeal = async (
  mealId
) => {
  return await prisma.meal.findFirst({
    where: {
      id: Number(mealId),

      ...publicApprovedMealWhere,
    },
  });
};


// =====================================
// FIND EXISTING VOTE
// =====================================
const findExistingVote = async ({
  mealId,
  ipAddress,
  deviceId,
}) => {

  return await prisma.vote.findFirst({
    where: {

      mealId,

      OR: [
        {
          ipAddress,
        },

        {
          deviceId,
        },
      ],
    },
  });
};


// =====================================
// CREATE VOTE
// =====================================
const createVote = async ({
  mealId,
  voteType,
  ipAddress,
  deviceId,
}) => {

  return await prisma.vote.create({
    data: {

      mealId,

      voteType,

      ipAddress,

      deviceId,
    },
  });
};


// =====================================
// GET MEAL VOTES
// =====================================
const getMealVotes = async (
  mealId
) => {

  const upVotes =
    await prisma.vote.count({
      where: {

        mealId,

        voteType: "UP",
      },
    });

  const downVotes =
    await prisma.vote.count({
      where: {

        mealId,

        voteType: "DOWN",
      },
    });

  return {

    upVotes,

    downVotes,

    totalVotes:
      upVotes + downVotes,

    score:
      upVotes - downVotes,
  };
};

module.exports = {
  findPublicApprovedVisibleMeal,
  findExistingVote,
  createVote,
  getMealVotes,
};