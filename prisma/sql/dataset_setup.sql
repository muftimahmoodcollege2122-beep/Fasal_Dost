-- Dataset setup. Appended to the scan migration by scripts/partitionize-migration.mjs.
-- 1) pgvector extension must exist before dataset_samples is created (script prepends it).
-- 2) Approximate nearest-neighbour index for similarity matching (cosine).
CREATE INDEX IF NOT EXISTS dataset_samples_embedding_hnsw
  ON dataset_samples USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- 3) Nearest labeled samples for a query embedding (use for the "own data" recognizer).
CREATE OR REPLACE FUNCTION match_dataset_samples(q vector(512), k int DEFAULT 10, only_crop text DEFAULT NULL)
RETURNS TABLE (id uuid, "diseaseId" text, "cropId" text, distance float4) LANGUAGE sql STABLE AS $$
  SELECT s.id, s."diseaseId", s."cropId", (s.embedding <=> q)::float4
  FROM dataset_samples s
  WHERE s.embedding IS NOT NULL AND (only_crop IS NULL OR s."cropId" = only_crop)
  ORDER BY s.embedding <=> q
  LIMIT k
$$;
