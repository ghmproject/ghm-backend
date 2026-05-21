-- Full-text indexes for fast admin restaurant / meal search
CREATE INDEX IF NOT EXISTS "restaurants_name_fts_idx"
  ON "restaurants" USING gin (to_tsvector('simple', "name"));

CREATE INDEX IF NOT EXISTS "restaurants_suburb_fts_idx"
  ON "restaurants" USING gin (to_tsvector('simple', COALESCE("suburb", '')));

CREATE INDEX IF NOT EXISTS "meals_dish_name_fts_idx"
  ON "meals" USING gin (to_tsvector('simple', "dishName"));
