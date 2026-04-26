# PlantItEatIt API

Backend API for [PlantItEatIt](https://plantiteatit.com) — a GPS-aware food gardening iOS app by Hatch Apps.

## Stack
- Node.js / Express
- PostgreSQL (Render managed)
- Deployed on Render

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/species` | GPS-filtered plant species list |
| GET | `/api/species/:id` | Single species detail |
| GET | `/api/veggies` | Vegetable-specific query with wildlife data |
| GET | `/api/veggies/search` | Search by common or scientific name |
| GET | `/api/veggies/:id/pests` | Pest calendar for a species |
| GET | `/api/climate` | Elevation + climate data from Open-Meteo |

## Query Parameters

### `/api/species`
- `county` — 5-digit county FIPS (required)
- `zone` — USDA hardiness zone e.g. `7b`
- `elevation` — elevation in feet
- `category` — filter by plant category
- `native_only` — `true` to show native species only
- `limit` — max results (default 150)

### `/api/climate`
- `lat` — latitude (required)
- `lng` — longitude (required)

## Setup

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL in .env
```

## Database

```bash
# Run schema (requires psql)
npm run db:schema

# Ingest USDA species data
npm run ingest

# Resolve plant images
npm run images
```

## Development

```bash
npm run dev
```
