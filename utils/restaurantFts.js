const prisma = require("../config/prisma");

const MIN_SEARCH_LEN = 2;
const DEFAULT_LIMIT = 20;

const normalizeSearchQuery = (q) => String(q ?? "").trim();

/**
 * Fast meal + restaurant search (GIN tsvector indexes + ILIKE fallback).
 */
const searchMealsByFts = async (query, limit = DEFAULT_LIMIT) => {
  const q = normalizeSearchQuery(query);
  if (q.length < MIN_SEARCH_LEN) {
    return [];
  }

  const pattern = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const take = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), 50);

  const rows = await prisma.$queryRaw`
    SELECT
      m.id,
      m."dishName",
      m.price,
      m.image,
      m."isFeatured",
      m."featuredUntil",
      m."restaurantId",
      r.name AS "restaurantName",
      r.suburb,
      GREATEST(
        ts_rank(to_tsvector('simple', r.name), plainto_tsquery('simple', ${q})),
        ts_rank(to_tsvector('simple', m."dishName"), plainto_tsquery('simple', ${q})),
        ts_rank(to_tsvector('simple', COALESCE(r.suburb, '')), plainto_tsquery('simple', ${q}))
      ) AS rank
    FROM meals m
    INNER JOIN restaurants r ON r.id = m."restaurantId"
    WHERE m.status = 'APPROVED'
      AND m."isHidden" = false
      AND (
        to_tsvector('simple', r.name) @@ plainto_tsquery('simple', ${q})
        OR to_tsvector('simple', m."dishName") @@ plainto_tsquery('simple', ${q})
        OR to_tsvector('simple', COALESCE(r.suburb, '')) @@ plainto_tsquery('simple', ${q})
        OR r.name ILIKE ${pattern}
        OR m."dishName" ILIKE ${pattern}
      )
    ORDER BY rank DESC, m."createdAt" DESC
    LIMIT ${take}
  `;

  return rows.map((row) => ({
    id: Number(row.id),
    dishName: row.dishName,
    price: Number(row.price),
    image: row.image,
    isFeatured: Boolean(row.isFeatured),
    featuredUntil: row.featuredUntil,
    restaurantId: Number(row.restaurantId),
    restaurant: {
      id: Number(row.restaurantId),
      name: row.restaurantName,
      suburb: row.suburb,
    },
  }));
};

module.exports = {
  searchMealsByFts,
  normalizeSearchQuery,
  MIN_SEARCH_LEN,
};
