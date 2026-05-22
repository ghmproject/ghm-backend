const { parseCoordinates } = require("../utils/parseCoordinates");
const {
  getSuburbRankingRows,
  getRestaurantRankingRows,
  getRestaurantPopularityRow,
  ACTIVITY_WINDOW_DAYS,
} = require("../models/rankingSystem.model");

const SORT_KEYS = ["votes", "activity", "engagement", "popularity"];

const toNumber = (v) => {
  if (v == null) return 0;
  if (typeof v === "bigint") return Number(v);
  return Number(v);
};

const formatDistance = (meters) => {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

const buildSuburbRow = (raw) => {
  const upvotes = toNumber(raw.upvotes);
  const downvotes = toNumber(raw.downvotes);
  const voteScore = toNumber(raw.voteScore);
  const recentVotes = toNumber(raw.recentVotes);
  const recentComments = toNumber(raw.recentComments);
  const topLevelComments = toNumber(raw.topLevelComments);
  const replies = toNumber(raw.replies);
  const totalComments = toNumber(raw.totalComments);
  const commentLikes = toNumber(raw.commentLikes);
  const totalVoteEvents = upvotes + downvotes;

  const activityScore = recentVotes + recentComments;
  const engagementScore =
    totalComments * 2 +
    replies +
    commentLikes +
    Math.min(totalVoteEvents, 500);
  const popularityScore =
    voteScore * 3 + activityScore * 2 + engagementScore * 1;

  return {
    suburb: raw.suburb,
    restaurantCount: toNumber(raw.restaurantCount),
    mealCount: toNumber(raw.mealCount),
    votes: {
      upvotes,
      downvotes,
      netScore: voteScore,
      totalEvents: totalVoteEvents,
    },
    activity: {
      windowDays: ACTIVITY_WINDOW_DAYS,
      recentVotes,
      recentComments,
      score: activityScore,
    },
    engagement: {
      topLevelComments,
      replies,
      totalComments,
      commentLikes,
      score: engagementScore,
    },
    popularityScore,
    _sort: {
      votes: voteScore,
      activity: activityScore,
      engagement: engagementScore,
      popularity: popularityScore,
    },
  };
};

const { extractSuburbLabel } = require("../utils/extractSuburbLabel");

const buildRestaurantRow = (raw) => {
  const fullAddress = raw.suburb ?? "";
  return {
  restaurantId: raw.restaurantId,
  restaurantName: raw.restaurantName,
  dishName: raw.dishName,
  topMealId: raw.topMealId,
  suburb: extractSuburbLabel(fullAddress),
  address: fullAddress,
  price: raw.price,
  topMealPrice: raw.topMealPrice,
  cuisine: raw.cuisine,
  image: raw.image,
  latitude: raw.latitude,
  longitude: raw.longitude,
  distance: formatDistance(raw.distanceMeters),
  distanceMeters: raw.distanceMeters,
  mealCount: raw.mealCount,
  votes: {
    upvotes: raw.upvotes,
    downvotes: raw.downvotes,
    netScore: raw.voteScore,
    displayScore:
      raw.voteScore >= 0 ? `+${raw.voteScore}` : String(raw.voteScore),
  },
  activity: {
    windowDays: ACTIVITY_WINDOW_DAYS,
    recentVotes: raw.recentVotes,
    recentComments: raw.recentComments,
    score: raw.activityScore,
  },
  engagement: {
    topLevelComments: raw.topLevelComments,
    replies: raw.replies,
    totalComments: raw.totalComments,
    commentLikes: raw.commentLikes,
    score: raw.engagementScore,
  },
  popularityScore: raw.popularityScore,
  _sort: {
    votes: raw.voteScore,
    activity: raw.activityScore,
    engagement: raw.engagementScore,
    popularity: raw.popularityScore,
    distance:
      raw.distanceMeters != null ? raw.distanceMeters : Number.MAX_SAFE_INTEGER,
  },
  };
};

/**
 * GET /api/ranking/suburbs?sortBy=
 */
const getSuburbRankings = async (req, res) => {
  try {
    const sortByRaw = (req.query.sortBy || "popularity").toLowerCase();
    const sortBy = SORT_KEYS.includes(sortByRaw) ? sortByRaw : "popularity";

    const rawRows = await getSuburbRankingRows();
    const rows = rawRows.map(buildSuburbRow);
    rows.sort((a, b) => b._sort[sortBy] - a._sort[sortBy]);

    const data = rows.map(({ _sort, ...rest }, index) => ({
      rank: index + 1,
      ...rest,
    }));

    return res.status(200).json({
      success: true,
      sortBy,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to compute suburb rankings",
    });
  }
};

/**
 * GET /api/ranking/restaurants?sortBy=&suburb=&limit=&lat=&lng=&radiusKm=
 * Top cheap eats — one row per restaurant (meals aggregated).
 */
const getRestaurantRankings = async (req, res) => {
  try {
    const restaurantIdRaw = req.query.restaurantId;
    if (restaurantIdRaw != null && String(restaurantIdRaw).trim() !== "") {
      const rid = Number(restaurantIdRaw);
      if (!Number.isFinite(rid) || rid <= 0) {
        return res.status(400).json({
          success: false,
          message: "restaurantId must be a positive number",
        });
      }

      const raw = await getRestaurantPopularityRow(rid);
      if (!raw) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        });
      }

      const built = buildRestaurantRow(raw);
      const { _sort, ...data } = built;

      return res.status(200).json({
        success: true,
        data,
      });
    }

    const sortByRaw = (req.query.sortBy || "votes").toLowerCase();
    const sortBy = SORT_KEYS.includes(sortByRaw) ? sortByRaw : "votes";

    const suburb =
      typeof req.query.suburb === "string" && req.query.suburb.trim()
        ? req.query.suburb.trim()
        : null;

    const limitRaw = Number(req.query.limit);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), 50)
        : 10;

    let lat = null;
    let lng = null;

    if (req.query.lat != null && req.query.lng != null) {
      const parsed = parseCoordinates(req.query.lat, req.query.lng);
      if (!parsed.ok) {
        return res.status(parsed.status).json({
          success: false,
          message: parsed.message,
        });
      }
      lat = parsed.lat;
      lng = parsed.lng;
    }

    const radiusKm = req.query.radiusKm;

    const { rows, nearMe, radiusKm: appliedRadiusKm } =
      await getRestaurantRankingRows({
        suburb,
        lat,
        lng,
        radiusKm,
      });

    const ranked = rows.map((r) => buildRestaurantRow(r));

    // Highest score first (votes / activity / engagement / popularity).
    ranked.sort((a, b) => b._sort[sortBy] - a._sort[sortBy]);

    const sliced = ranked.slice(0, limit).map((row, index) => {
      const { _sort, ...rest } = row;
      return { ...rest, rank: index + 1 };
    });

    const contextLabel = nearMe
      ? "Near you"
      : suburb
        ? suburb
        : "All areas";

    return res.status(200).json({
      success: true,
      sortBy,
      limit,
      context: {
        label: contextLabel,
        suburb: suburb || null,
        nearMe,
        radiusKm: nearMe ? appliedRadiusKm : null,
      },
      count: sliced.length,
      data: sliced,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to compute restaurant rankings",
    });
  }
};

module.exports = {
  getSuburbRankings,
  getRestaurantRankings,
};
