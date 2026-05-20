const prisma = require("../config/prisma");
const { getDistance } = require("geolib");
const { publicApprovedMealWhere } = require("../utils/mealPublicFilter");

/** Activity window for "recent" votes and comments (days). */
const ACTIVITY_WINDOW_DAYS = 14;

/** Default "near me" radius (km) — matches UI "within 2km". */
const DEFAULT_NEAR_RADIUS_KM = 2;

const emptyMealMetrics = () => ({
  upvotes: 0,
  downvotes: 0,
  recentVotes: 0,
  topLevelComments: 0,
  replies: 0,
  recentComments: 0,
  commentLikes: 0,
});

const computeScores = (m) => {
  const upvotes = m.upvotes;
  const downvotes = m.downvotes;
  const voteScore = upvotes - downvotes;
  const totalComments = m.topLevelComments + m.replies;
  const totalVoteEvents = upvotes + downvotes;
  const activityScore = m.recentVotes + m.recentComments;
  const engagementScore =
    totalComments * 2 +
    m.replies +
    m.commentLikes +
    Math.min(totalVoteEvents, 500);
  const popularityScore =
    voteScore * 3 + activityScore * 2 + engagementScore * 1;

  return {
    upvotes,
    downvotes,
    voteScore,
    totalComments,
    totalVoteEvents,
    activityScore,
    engagementScore,
    popularityScore,
  };
};

const loadPublicMeals = async (suburbFilter) => {
  const where = {
    ...publicApprovedMealWhere,
    ...(suburbFilter
      ? {
          restaurant: {
            suburb: {
              equals: suburbFilter,
              mode: "insensitive",
            },
          },
        }
      : {}),
  };

  return prisma.meal.findMany({
    where,
    select: {
      id: true,
      dishName: true,
      price: true,
      cuisine: true,
      restaurantId: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          suburb: true,
          latitude: true,
          longitude: true,
          image: true,
        },
      },
    },
  });
};

const attachVoteAndCommentMetrics = async (meals) => {
  if (meals.length === 0) {
    return { meals, metricsByMealId: new Map() };
  }

  const mealIds = meals.map((m) => m.id);
  const activityCutoff = new Date(
    Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const [votes, comments] = await Promise.all([
    prisma.vote.findMany({
      where: { mealId: { in: mealIds } },
      select: { mealId: true, voteType: true, createdAt: true },
    }),
    prisma.comment.findMany({
      where: { mealId: { in: mealIds }, isHidden: false },
      select: {
        id: true,
        mealId: true,
        parentCommentId: true,
        createdAt: true,
      },
    }),
  ]);

  const commentIds = comments.map((c) => c.id);
  const likeGroups =
    commentIds.length === 0
      ? []
      : await prisma.commentLike.groupBy({
          by: ["commentId"],
          where: { commentId: { in: commentIds } },
          _count: { _all: true },
        });

  const likesByCommentId = new Map(
    likeGroups.map((g) => [g.commentId, g._count._all])
  );

  const metricsByMealId = new Map(
    mealIds.map((id) => [id, emptyMealMetrics()])
  );

  for (const v of votes) {
    const agg = metricsByMealId.get(v.mealId);
    if (!agg) continue;
    if (v.voteType === "UP") agg.upvotes += 1;
    else if (v.voteType === "DOWN") agg.downvotes += 1;
    if (v.createdAt >= activityCutoff) agg.recentVotes += 1;
  }

  for (const c of comments) {
    const agg = metricsByMealId.get(c.mealId);
    if (!agg) continue;
    if (c.parentCommentId == null) agg.topLevelComments += 1;
    else agg.replies += 1;
    if (c.createdAt >= activityCutoff) agg.recentComments += 1;
    agg.commentLikes += likesByCommentId.get(c.id) || 0;
  }

  return { meals, metricsByMealId, activityCutoff };
};

/**
 * Suburb popularity (aggregate all meals in each suburb).
 */
const getSuburbRankingRows = async () => {
  const meals = await loadPublicMeals(null);
  const { metricsByMealId } = await attachVoteAndCommentMetrics(meals);

  const bySuburb = new Map();

  const ensure = (suburb) => {
    if (!bySuburb.has(suburb)) {
      bySuburb.set(suburb, {
        restaurantIds: new Set(),
        mealCount: 0,
        ...emptyMealMetrics(),
      });
    }
    return bySuburb.get(suburb);
  };

  for (const meal of meals) {
    const suburb = meal.restaurant.suburb;
    const agg = ensure(suburb);
    agg.restaurantIds.add(meal.restaurantId);
    agg.mealCount += 1;

    const m = metricsByMealId.get(meal.id);
    agg.upvotes += m.upvotes;
    agg.downvotes += m.downvotes;
    agg.recentVotes += m.recentVotes;
    agg.topLevelComments += m.topLevelComments;
    agg.replies += m.replies;
    agg.recentComments += m.recentComments;
    agg.commentLikes += m.commentLikes;
  }

  const rows = [];
  for (const [suburb, agg] of bySuburb) {
    const totalComments = agg.topLevelComments + agg.replies;
    const voteScore = agg.upvotes - agg.downvotes;
    rows.push({
      suburb,
      restaurantCount: agg.restaurantIds.size,
      mealCount: agg.mealCount,
      upvotes: agg.upvotes,
      downvotes: agg.downvotes,
      voteScore,
      recentVotes: agg.recentVotes,
      topLevelComments: agg.topLevelComments,
      replies: agg.replies,
      totalComments,
      recentComments: agg.recentComments,
      commentLikes: agg.commentLikes,
    });
  }

  return rows;
};

/**
 * One row per restaurant: aggregate all meal votes/comments, pick top dish by meal popularity.
 */
const aggregateMealsByRestaurant = (meals, metricsByMealId) => {
  const byRestaurant = new Map();

  for (const meal of meals) {
    const m = metricsByMealId.get(meal.id);
    const mealScores = computeScores(m);
    const rid = meal.restaurantId;

    if (!byRestaurant.has(rid)) {
      byRestaurant.set(rid, {
        restaurantId: rid,
        restaurantName: meal.restaurant.name,
        suburb: meal.restaurant.suburb,
        image: meal.restaurant.image,
        latitude: meal.restaurant.latitude,
        longitude: meal.restaurant.longitude,
        distanceMeters: meal.distanceMeters ?? null,
        mealCount: 0,
        ...emptyMealMetrics(),
        popularityScore: 0,
        activityScore: 0,
        engagementScore: 0,
        lowestPrice: null,
        topMeal: null,
      });
    }

    const agg = byRestaurant.get(rid);
    agg.mealCount += 1;
    agg.upvotes += m.upvotes;
    agg.downvotes += m.downvotes;
    agg.recentVotes += m.recentVotes;
    agg.topLevelComments += m.topLevelComments;
    agg.replies += m.replies;
    agg.recentComments += m.recentComments;
    agg.commentLikes += m.commentLikes;

    agg.popularityScore += mealScores.popularityScore;
    agg.activityScore += mealScores.activityScore;
    agg.engagementScore += mealScores.engagementScore;

    if (agg.lowestPrice == null || meal.price < agg.lowestPrice) {
      agg.lowestPrice = meal.price;
    }

    if (
      !agg.topMeal ||
      mealScores.popularityScore > agg.topMeal.popularityScore
    ) {
      agg.topMeal = {
        mealId: meal.id,
        dishName: meal.dishName,
        price: meal.price,
        cuisine: meal.cuisine,
        popularityScore: mealScores.popularityScore,
      };
    }
  }

  const rows = [];

  for (const agg of byRestaurant.values()) {
    const totalComments = agg.topLevelComments + agg.replies;
    const voteScore = agg.upvotes - agg.downvotes;

    rows.push({
      restaurantId: agg.restaurantId,
      restaurantName: agg.restaurantName,
      suburb: agg.suburb,
      image: agg.image,
      latitude: agg.latitude,
      longitude: agg.longitude,
      distanceMeters: agg.distanceMeters,
      mealCount: agg.mealCount,
      dishName: agg.topMeal?.dishName ?? null,
      topMealId: agg.topMeal?.mealId ?? null,
      cuisine: agg.topMeal?.cuisine ?? null,
      price: agg.lowestPrice,
      topMealPrice: agg.topMeal?.price ?? null,
      upvotes: agg.upvotes,
      downvotes: agg.downvotes,
      voteScore,
      recentVotes: agg.recentVotes,
      recentComments: agg.recentComments,
      topLevelComments: agg.topLevelComments,
      replies: agg.replies,
      totalComments,
      commentLikes: agg.commentLikes,
      activityScore: agg.activityScore,
      engagementScore: agg.engagementScore,
      popularityScore: agg.popularityScore,
    });
  }

  return rows;
};

/**
 * Restaurant leaderboard (one row per restaurant).
 * Optional suburb filter; optional near-me via lat/lng + radiusKm.
 */
const getRestaurantRankingRows = async ({ suburb, lat, lng, radiusKm }) => {
  let meals = await loadPublicMeals(suburb || null);
  const { metricsByMealId } = await attachVoteAndCommentMetrics(meals);

  let nearMe = false;
  let radiusMeters = null;

  if (lat != null && lng != null) {
    const origin = { latitude: lat, longitude: lng };
    const km = Number(radiusKm);
    const useKm =
      Number.isFinite(km) && km > 0 ? km : DEFAULT_NEAR_RADIUS_KM;
    radiusMeters = useKm * 1000;
    nearMe = true;

    meals = meals
      .filter(
        (m) =>
          m.restaurant.latitude != null && m.restaurant.longitude != null
      )
      .map((m) => ({
        ...m,
        distanceMeters: getDistance(origin, {
          latitude: m.restaurant.latitude,
          longitude: m.restaurant.longitude,
        }),
      }))
      .filter((m) => m.distanceMeters <= radiusMeters);
  }

  const rows = aggregateMealsByRestaurant(meals, metricsByMealId);

  return {
    rows,
    nearMe,
    radiusKm: nearMe ? radiusMeters / 1000 : null,
    suburb,
  };
};

module.exports = {
  getSuburbRankingRows,
  getRestaurantRankingRows,
  ACTIVITY_WINDOW_DAYS,
  DEFAULT_NEAR_RADIUS_KM,
  computeScores,
};
