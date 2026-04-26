-- PlantItEatIt PostgreSQL Schema
-- Run once on Render managed PostgreSQL
-- psql $DATABASE_URL -f db/schema.sql

-- ─── SPECIES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS species (
  id                    SERIAL PRIMARY KEY,
  usda_symbol           VARCHAR(10) UNIQUE NOT NULL,
  scientific_name       VARCHAR(255) NOT NULL,
  common_name           VARCHAR(255),
  family                VARCHAR(100),
  category              VARCHAR(50),
  duration              VARCHAR(50),
  growth_habit          VARCHAR(100),
  native_status         VARCHAR(20),
  drought_tolerance     VARCHAR(20),
  moisture_use          VARCHAR(20),
  shade_tolerance       VARCHAR(20),
  frost_free_days_min   INT,
  frost_free_days_max   INT,
  precip_min_in         DECIMAL(6,2),
  precip_max_in         DECIMAL(6,2),
  temp_min_f            DECIMAL(5,1),
  elevation_min_ft      INT,
  elevation_max_ft      INT,
  bloom_period          VARCHAR(100),
  active_growth_period  VARCHAR(100),
  toxicity              VARCHAR(50),
  wildlife_value        TEXT,
  image_url             TEXT,
  image_source          VARCHAR(20),
  image_license         VARCHAR(50),
  image_attribution     TEXT,
  last_image_check      TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- ─── COUNTY DISTRIBUTION ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS species_counties (
  id            SERIAL PRIMARY KEY,
  species_id    INT REFERENCES species(id) ON DELETE CASCADE,
  state_fips    CHAR(2) NOT NULL,
  county_fips   CHAR(5) NOT NULL,
  native_status VARCHAR(10)
);

-- ─── HARDINESS ZONES ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS species_zones (
  id           SERIAL PRIMARY KEY,
  species_id   INT REFERENCES species(id) ON DELETE CASCADE,
  zone_min     VARCHAR(5),
  zone_max     VARCHAR(5),
  zone_min_num DECIMAL(3,1),
  zone_max_num DECIMAL(3,1)
);

-- ─── VEGETABLE EXTENDED DATA ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS species_veggies (
  id                      SERIAL PRIMARY KEY,
  species_id              INT REFERENCES species(id) ON DELETE CASCADE,
  days_to_maturity_min    INT,
  days_to_maturity_max    INT,
  spacing_inches          INT,
  row_spacing_inches      INT,
  mature_height_inches    INT,
  spread_inches           INT,
  yield_per_plant         TEXT,
  succession_planting     BOOLEAN DEFAULT FALSE,
  succession_interval_days INT,
  start_indoors           BOOLEAN DEFAULT FALSE,
  weeks_before_last_frost INT,
  direct_sow              BOOLEAN DEFAULT TRUE,
  frost_hardy             BOOLEAN DEFAULT FALSE,
  soil_ph_min             DECIMAL(3,1),
  soil_ph_max             DECIMAL(3,1),
  needs_amended_soil      BOOLEAN DEFAULT FALSE,
  soil_notes              TEXT,
  deer_risk               VARCHAR(10) DEFAULT 'Unknown',
  rabbit_risk             VARCHAR(10) DEFAULT 'Unknown',
  javelina_risk           VARCHAR(10) DEFAULT 'Unknown',
  squirrel_risk           VARCHAR(10) DEFAULT 'Unknown',
  bird_risk               VARCHAR(10) DEFAULT 'Unknown',
  wildlife_notes          TEXT,
  typically_sold_as       VARCHAR(20) DEFAULT 'both',
  lowes_search_term       TEXT,
  seed_search_term        TEXT,
  lowes_product_id        TEXT,
  lowes_product_name      TEXT,
  lowes_product_price     DECIMAL(8,2),
  lowes_affiliate_url     TEXT,
  lowes_product_cached_at TIMESTAMP,
  burpee_product_id       TEXT,
  burpee_product_name     TEXT,
  burpee_affiliate_url    TEXT,
  burpee_product_cached_at TIMESTAMP
);

-- ─── PEST DATA ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS species_pests (
  id              SERIAL PRIMARY KEY,
  species_id      INT REFERENCES species(id) ON DELETE CASCADE,
  pest_name       VARCHAR(100),
  region_code     VARCHAR(20),
  active_months   INT[],
  severity        VARCHAR(10),
  organic_control TEXT,
  notes           TEXT
);

-- ─── INGESTION LOG ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ingestion_log (
  id                  SERIAL PRIMARY KEY,
  run_type            VARCHAR(50),
  species_processed   INT DEFAULT 0,
  species_updated     INT DEFAULT 0,
  errors              INT DEFAULT 0,
  started_at          TIMESTAMP,
  completed_at        TIMESTAMP,
  notes               TEXT
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_species_symbol      ON species(usda_symbol);
CREATE INDEX IF NOT EXISTS idx_species_category    ON species(category);
CREATE INDEX IF NOT EXISTS idx_species_native      ON species(native_status);
CREATE INDEX IF NOT EXISTS idx_species_elevation   ON species(elevation_min_ft, elevation_max_ft);
CREATE INDEX IF NOT EXISTS idx_species_temp        ON species(temp_min_f);
CREATE INDEX IF NOT EXISTS idx_counties_fips       ON species_counties(county_fips);
CREATE INDEX IF NOT EXISTS idx_counties_species    ON species_counties(species_id);
CREATE INDEX IF NOT EXISTS idx_zones_species       ON species_zones(species_id);
CREATE INDEX IF NOT EXISTS idx_zones_num           ON species_zones(zone_min_num, zone_max_num);
CREATE INDEX IF NOT EXISTS idx_veggies_species     ON species_veggies(species_id);
CREATE INDEX IF NOT EXISTS idx_pests_species       ON species_pests(species_id);
CREATE INDEX IF NOT EXISTS idx_pests_region        ON species_pests(region_code);
