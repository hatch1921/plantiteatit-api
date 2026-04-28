/**
 * PlantItEatIt — Expanded Food Plant Characteristics Seeder v2
 * Covers full edible plant spectrum: vegetables, herbs, fruits, berries,
 * edible flowers, grains, nuts, medicinal herbs, vines
 *
 * Usage: node scripts/seed-food-plants-v2.js
 */

require('dotenv').config();
const pool = require('../db/pool');

// Each entry matches by common name pattern and/or scientific name pattern
// Data sourced from USDA, university extension services, and seed company guides
const PLANT_GROUPS = [

  // ── TOMATOES ──────────────────────────────────────────────────────────────
  {
    match: { common: ['%tomato%'], scientific: ['%lycopersicon%', '%solanum lycopersicum%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:60, frost_free_days_max:85, elevation_min_ft:0, elevation_max_ft:7000, precip_min_in:12, precip_max_in:60, temp_min_f:32 }
  },

  // ── PEPPERS / CHILES ──────────────────────────────────────────────────────
  {
    match: { common: ['%pepper%','%chile%','%chili%','%capsicum%','%aji%'], scientific: ['%capsicum%'] },
    data: { category:'Vegetable', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:70, frost_free_days_max:90, elevation_min_ft:0, elevation_max_ft:7500, precip_min_in:12, precip_max_in:50, temp_min_f:32 }
  },

  // ── SQUASH / ZUCCHINI / PUMPKIN ───────────────────────────────────────────
  {
    match: { common: ['%squash%','%zucchini%','%pumpkin%','%gourd%'], scientific: ['%cucurbita%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:50, frost_free_days_max:110, elevation_min_ft:0, elevation_max_ft:7000, precip_min_in:12, precip_max_in:50, temp_min_f:32 }
  },

  // ── CUCUMBERS ─────────────────────────────────────────────────────────────
  {
    match: { common: ['%cucumber%'], scientific: ['%cucumis sativus%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:50, frost_free_days_max:70, elevation_min_ft:0, elevation_max_ft:6500, precip_min_in:12, precip_max_in:50, temp_min_f:32 }
  },

  // ── MELONS ────────────────────────────────────────────────────────────────
  {
    match: { common: ['%watermelon%','%cantaloupe%','%melon%','%honeydew%'], scientific: ['%citrullus%','%cucumis melo%'] },
    data: { category:'Fruit', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:80, frost_free_days_max:110, elevation_min_ft:0, elevation_max_ft:6000, precip_min_in:12, precip_max_in:50, temp_min_f:32 }
  },

  // ── BEANS ─────────────────────────────────────────────────────────────────
  {
    match: { common: ['%bean%'], scientific: ['%phaseolus%','%vigna%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:50, frost_free_days_max:70, elevation_min_ft:0, elevation_max_ft:7500, precip_min_in:12, precip_max_in:50, temp_min_f:32 }
  },

  // ── PEAS ──────────────────────────────────────────────────────────────────
  {
    match: { common: ['%pea%'], scientific: ['%pisum%','%lathyrus%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:45, frost_free_days_max:70, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:12, precip_max_in:50, temp_min_f:28 }
  },

  // ── GARLIC ────────────────────────────────────────────────────────────────
  {
    match: { common: ['%garlic%'], scientific: ['%allium sativum%'] },
    data: { category:'Vegetable', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:8, precip_max_in:50, temp_min_f:-20 }
  },

  // ── ONIONS / LEEKS / SHALLOTS ─────────────────────────────────────────────
  {
    match: { common: ['%onion%','%leek%','%shallot%','%chive%','%scallion%'], scientific: ['%allium%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:90, frost_free_days_max:120, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:10, precip_max_in:50, temp_min_f:-20 }
  },

  // ── LETTUCE ───────────────────────────────────────────────────────────────
  {
    match: { common: ['%lettuce%'], scientific: ['%lactuca%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:45, frost_free_days_max:60, elevation_min_ft:0, elevation_max_ft:8500, precip_min_in:12, precip_max_in:50, temp_min_f:20 }
  },

  // ── SPINACH ───────────────────────────────────────────────────────────────
  {
    match: { common: ['%spinach%'], scientific: ['%spinacia%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:40, frost_free_days_max:50, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:12, precip_max_in:50, temp_min_f:20 }
  },

  // ── KALE / COLLARDS ───────────────────────────────────────────────────────
  {
    match: { common: ['%kale%','%collard%','%chard%'], scientific: ['%brassica oleracea%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:55, frost_free_days_max:75, elevation_min_ft:0, elevation_max_ft:8500, precip_min_in:12, precip_max_in:50, temp_min_f:10 }
  },

  // ── BROCCOLI / CAULIFLOWER / CABBAGE ──────────────────────────────────────
  {
    match: { common: ['%broccoli%','%cauliflower%','%cabbage%','%kohlrabi%','%brussels%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:60, frost_free_days_max:80, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:12, precip_max_in:50, temp_min_f:20 }
  },

  // ── CARROTS ───────────────────────────────────────────────────────────────
  {
    match: { common: ['%carrot%'], scientific: ['%daucus carota%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:70, frost_free_days_max:80, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:12, precip_max_in:50, temp_min_f:20 }
  },

  // ── BEETS / TURNIPS / PARSNIPS ────────────────────────────────────────────
  {
    match: { common: ['%beet%','%turnip%','%parsnip%','%rutabaga%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:50, frost_free_days_max:70, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:12, precip_max_in:50, temp_min_f:20 }
  },

  // ── RADISHES ──────────────────────────────────────────────────────────────
  {
    match: { common: ['%radish%'], scientific: ['%raphanus%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:22, frost_free_days_max:35, elevation_min_ft:0, elevation_max_ft:8500, precip_min_in:10, precip_max_in:50, temp_min_f:25 }
  },

  // ── POTATOES ──────────────────────────────────────────────────────────────
  {
    match: { common: ['%potato%'], scientific: ['%solanum tuberosum%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:70, frost_free_days_max:120, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:14, precip_max_in:50, temp_min_f:28 }
  },

  // ── SWEET POTATO ──────────────────────────────────────────────────────────
  {
    match: { common: ['%sweet potato%'], scientific: ['%ipomoea batatas%'] },
    data: { category:'Vegetable', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:100, frost_free_days_max:150, elevation_min_ft:0, elevation_max_ft:6000, precip_min_in:12, precip_max_in:50, temp_min_f:32 }
  },

  // ── CORN ──────────────────────────────────────────────────────────────────
  {
    match: { common: ['%corn%','%maize%'], scientific: ['%zea mays%'] },
    data: { category:'Vegetable', drought_tolerance:'Medium', moisture_use:'High', frost_free_days_min:60, frost_free_days_max:100, elevation_min_ft:0, elevation_max_ft:7500, precip_min_in:12, precip_max_in:60, temp_min_f:32 }
  },

  // ── EGGPLANT ──────────────────────────────────────────────────────────────
  {
    match: { common: ['%eggplant%','%aubergine%'], scientific: ['%solanum melongena%'] },
    data: { category:'Vegetable', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:100, frost_free_days_max:140, elevation_min_ft:0, elevation_max_ft:6500, precip_min_in:12, precip_max_in:50, temp_min_f:32 }
  },

  // ── ARTICHOKE ─────────────────────────────────────────────────────────────
  {
    match: { common: ['%artichoke%'], scientific: ['%cynara%'] },
    data: { category:'Vegetable', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:180, frost_free_days_max:365, elevation_min_ft:0, elevation_max_ft:6000, precip_min_in:12, precip_max_in:50, temp_min_f:25 }
  },

  // ── ASPARAGUS ─────────────────────────────────────────────────────────────
  {
    match: { common: ['%asparagus%'], scientific: ['%asparagus officinalis%'] },
    data: { category:'Vegetable', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:10, precip_max_in:50, temp_min_f:-30 }
  },

  // ── CELERY / CELERIAC ─────────────────────────────────────────────────────
  {
    match: { common: ['%celery%','%celeriac%'], scientific: ['%apium%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:100, frost_free_days_max:130, elevation_min_ft:0, elevation_max_ft:7000, precip_min_in:14, precip_max_in:60, temp_min_f:25 }
  },

  // ── FENNEL ────────────────────────────────────────────────────────────────
  {
    match: { common: ['%fennel%'], scientific: ['%foeniculum%'] },
    data: { category:'Herb', drought_tolerance:'Medium', moisture_use:'Low', frost_free_days_min:60, frost_free_days_max:90, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:10, precip_max_in:50, temp_min_f:20 }
  },

  // ── SUNFLOWERS ────────────────────────────────────────────────────────────
  {
    match: { common: ['%sunflower%'], scientific: ['%helianthus annuus%','%helianthus%'] },
    data: { category:'Vegetable', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:70, frost_free_days_max:100, elevation_min_ft:0, elevation_max_ft:8500, precip_min_in:8, precip_max_in:50, temp_min_f:32 }
  },

  // ── BASIL ─────────────────────────────────────────────────────────────────
  {
    match: { common: ['%basil%'], scientific: ['%ocimum%'] },
    data: { category:'Herb', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:60, frost_free_days_max:90, elevation_min_ft:0, elevation_max_ft:7500, precip_min_in:10, precip_max_in:50, temp_min_f:32 }
  },

  // ── ROSEMARY ──────────────────────────────────────────────────────────────
  {
    match: { common: ['%rosemary%'], scientific: ['%salvia rosmarinus%','%rosmarinus%'] },
    data: { category:'Herb', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:8, precip_max_in:50, temp_min_f:10 }
  },

  // ── THYME ─────────────────────────────────────────────────────────────────
  {
    match: { common: ['%thyme%'], scientific: ['%thymus%'] },
    data: { category:'Herb', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:8, precip_max_in:50, temp_min_f:-20 }
  },

  // ── OREGANO ───────────────────────────────────────────────────────────────
  {
    match: { common: ['%oregano%'], scientific: ['%origanum%'] },
    data: { category:'Herb', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:8, precip_max_in:50, temp_min_f:-10 }
  },

  // ── MINT ──────────────────────────────────────────────────────────────────
  {
    match: { common: ['%mint%','%spearmint%','%peppermint%'], scientific: ['%mentha%'] },
    data: { category:'Herb', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:10, precip_max_in:60, temp_min_f:-30 }
  },

  // ── SAGE ──────────────────────────────────────────────────────────────────
  {
    match: { common: ['%culinary sage%','%garden sage%'], scientific: ['%salvia officinalis%'] },
    data: { category:'Herb', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:8, precip_max_in:50, temp_min_f:-20 }
  },

  // ── CILANTRO / CORIANDER ──────────────────────────────────────────────────
  {
    match: { common: ['%cilantro%','%coriander%'], scientific: ['%coriandrum%'] },
    data: { category:'Herb', drought_tolerance:'Medium', moisture_use:'Low', frost_free_days_min:45, frost_free_days_max:55, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:10, precip_max_in:40, temp_min_f:28 }
  },

  // ── PARSLEY ───────────────────────────────────────────────────────────────
  {
    match: { common: ['%parsley%'], scientific: ['%petroselinum%'] },
    data: { category:'Herb', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:70, frost_free_days_max:90, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:10, precip_max_in:50, temp_min_f:20 }
  },

  // ── DILL ──────────────────────────────────────────────────────────────────
  {
    match: { common: ['%dill%'], scientific: ['%anethum%'] },
    data: { category:'Herb', drought_tolerance:'Medium', moisture_use:'Low', frost_free_days_min:40, frost_free_days_max:60, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:10, precip_max_in:50, temp_min_f:25 }
  },

  // ── CHIVES ────────────────────────────────────────────────────────────────
  {
    match: { common: ['%chives%'], scientific: ['%allium schoenoprasum%'] },
    data: { category:'Herb', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:8, precip_max_in:50, temp_min_f:-30 }
  },

  // ── LAVENDER ──────────────────────────────────────────────────────────────
  {
    match: { common: ['%lavender%'], scientific: ['%lavandula%'] },
    data: { category:'Herb', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:8, precip_max_in:40, temp_min_f:-10 }
  },

  // ── LEMON BALM ────────────────────────────────────────────────────────────
  {
    match: { common: ['%lemon balm%'], scientific: ['%melissa officinalis%'] },
    data: { category:'Herb', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:10, precip_max_in:50, temp_min_f:-20 }
  },

  // ── STEVIA ────────────────────────────────────────────────────────────────
  {
    match: { common: ['%stevia%'], scientific: ['%stevia rebaudiana%'] },
    data: { category:'Herb', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:120, frost_free_days_max:180, elevation_min_ft:0, elevation_max_ft:6000, precip_min_in:12, precip_max_in:50, temp_min_f:32 }
  },

  // ── CHAMOMILE ─────────────────────────────────────────────────────────────
  {
    match: { common: ['%chamomile%'], scientific: ['%matricaria%','%chamaemelum%'] },
    data: { category:'Herb', drought_tolerance:'Medium', moisture_use:'Low', frost_free_days_min:45, frost_free_days_max:65, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:8, precip_max_in:50, temp_min_f:20 }
  },

  // ── ECHINACEA ─────────────────────────────────────────────────────────────
  {
    match: { common: ['%echinacea%','%coneflower%'], scientific: ['%echinacea%'] },
    data: { category:'Herb', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:8, precip_max_in:50, temp_min_f:-30 }
  },

  // ── EDIBLE FLOWERS ────────────────────────────────────────────────────────
  {
    match: { common: ['%nasturtium%'], scientific: ['%tropaeolum%'] },
    data: { category:'Edible Flower', drought_tolerance:'Medium', moisture_use:'Low', frost_free_days_min:50, frost_free_days_max:70, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:8, precip_max_in:50, temp_min_f:32 }
  },
  {
    match: { common: ['%borage%'], scientific: ['%borago%'] },
    data: { category:'Edible Flower', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:50, frost_free_days_max:70, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:8, precip_max_in:50, temp_min_f:25 }
  },
  {
    match: { common: ['%calendula%','%pot marigold%'], scientific: ['%calendula%'] },
    data: { category:'Edible Flower', drought_tolerance:'Medium', moisture_use:'Low', frost_free_days_min:45, frost_free_days_max:60, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:8, precip_max_in:50, temp_min_f:25 }
  },
  {
    match: { common: ['%elderberry%','%elderflower%'], scientific: ['%sambucus%'] },
    data: { category:'Edible Flower', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:10, precip_max_in:50, temp_min_f:-30 }
  },
  {
    match: { common: ['%violet%','%pansy%'], scientific: ['%viola%'] },
    data: { category:'Edible Flower', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:45, frost_free_days_max:65, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:10, precip_max_in:50, temp_min_f:10 }
  },

  // ── STRAWBERRIES ──────────────────────────────────────────────────────────
  {
    match: { common: ['%strawberry%'], scientific: ['%fragaria%'] },
    data: { category:'Fruit', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:12, precip_max_in:60, temp_min_f:-30 }
  },

  // ── BLUEBERRIES ───────────────────────────────────────────────────────────
  {
    match: { common: ['%blueberry%'], scientific: ['%vaccinium%'] },
    data: { category:'Fruit', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:14, precip_max_in:60, temp_min_f:-30 }
  },

  // ── RASPBERRIES / BLACKBERRIES ────────────────────────────────────────────
  {
    match: { common: ['%raspberry%','%blackberry%'], scientific: ['%rubus%'] },
    data: { category:'Fruit', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:12, precip_max_in:60, temp_min_f:-30 }
  },

  // ── GRAPES ────────────────────────────────────────────────────────────────
  {
    match: { common: ['%grape%'], scientific: ['%vitis%'] },
    data: { category:'Fruit', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:150, frost_free_days_max:250, elevation_min_ft:0, elevation_max_ft:7500, precip_min_in:8, precip_max_in:50, temp_min_f:-20 }
  },

  // ── APPLE ─────────────────────────────────────────────────────────────────
  {
    match: { common: ['%apple%'], scientific: ['%malus%'] },
    data: { category:'Fruit', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:12, precip_max_in:60, temp_min_f:-30 }
  },

  // ── PEACH / NECTARINE ─────────────────────────────────────────────────────
  {
    match: { common: ['%peach%','%nectarine%'], scientific: ['%prunus persica%'] },
    data: { category:'Fruit', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:180, frost_free_days_max:240, elevation_min_ft:0, elevation_max_ft:7000, precip_min_in:12, precip_max_in:50, temp_min_f:10 }
  },

  // ── PEAR ──────────────────────────────────────────────────────────────────
  {
    match: { common: ['%pear%'], scientific: ['%pyrus%'] },
    data: { category:'Fruit', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:7500, precip_min_in:12, precip_max_in:60, temp_min_f:-20 }
  },

  // ── PLUM / CHERRY ─────────────────────────────────────────────────────────
  {
    match: { common: ['%plum%','%cherry%'], scientific: ['%prunus%'] },
    data: { category:'Fruit', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:12, precip_max_in:60, temp_min_f:-30 }
  },

  // ── FIG ───────────────────────────────────────────────────────────────────
  {
    match: { common: ['%fig%'], scientific: ['%ficus carica%'] },
    data: { category:'Fruit', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:200, frost_free_days_max:365, elevation_min_ft:0, elevation_max_ft:5500, precip_min_in:8, precip_max_in:50, temp_min_f:15 }
  },

  // ── POMEGRANATE ───────────────────────────────────────────────────────────
  {
    match: { common: ['%pomegranate%'], scientific: ['%punica%'] },
    data: { category:'Fruit', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:200, frost_free_days_max:365, elevation_min_ft:0, elevation_max_ft:5500, precip_min_in:8, precip_max_in:50, temp_min_f:18 }
  },

  // ── CITRUS ────────────────────────────────────────────────────────────────
  {
    match: { common: ['%lemon%','%lime%','%orange%','%grapefruit%','%citrus%'], scientific: ['%citrus%'] },
    data: { category:'Fruit', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:300, frost_free_days_max:365, elevation_min_ft:0, elevation_max_ft:4500, precip_min_in:10, precip_max_in:60, temp_min_f:28 }
  },

  // ── PECAN / WALNUT ────────────────────────────────────────────────────────
  {
    match: { common: ['%pecan%'], scientific: ['%carya illinoinensis%'] },
    data: { category:'Nut', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:180, frost_free_days_max:280, elevation_min_ft:0, elevation_max_ft:5500, precip_min_in:12, precip_max_in:60, temp_min_f:0 }
  },
  {
    match: { common: ['%walnut%'], scientific: ['%juglans%'] },
    data: { category:'Nut', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:7500, precip_min_in:12, precip_max_in:60, temp_min_f:-20 }
  },
  {
    match: { common: ['%almond%'], scientific: ['%prunus dulcis%'] },
    data: { category:'Nut', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:180, frost_free_days_max:250, elevation_min_ft:0, elevation_max_ft:5000, precip_min_in:8, precip_max_in:50, temp_min_f:15 }
  },
  {
    match: { common: ['%pistachio%'], scientific: ['%pistacia%'] },
    data: { category:'Nut', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:200, frost_free_days_max:300, elevation_min_ft:0, elevation_max_ft:5000, precip_min_in:6, precip_max_in:40, temp_min_f:10 }
  },
  {
    match: { common: ['%hazelnut%','%filbert%'], scientific: ['%corylus%'] },
    data: { category:'Nut', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:7000, precip_min_in:12, precip_max_in:60, temp_min_f:-20 }
  },

  // ── GRAINS ────────────────────────────────────────────────────────────────
  {
    match: { common: ['%wheat%'], scientific: ['%triticum%'] },
    data: { category:'Grain', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:90, frost_free_days_max:130, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:10, precip_max_in:50, temp_min_f:-30 }
  },
  {
    match: { common: ['%amaranth%'], scientific: ['%amaranthus%'] },
    data: { category:'Grain', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:90, frost_free_days_max:150, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:8, precip_max_in:50, temp_min_f:32 }
  },
  {
    match: { common: ['%quinoa%'], scientific: ['%chenopodium quinoa%'] },
    data: { category:'Grain', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:90, frost_free_days_max:120, elevation_min_ft:2000, elevation_max_ft:12000, precip_min_in:8, precip_max_in:50, temp_min_f:25 }
  },
  {
    match: { common: ['%sorghum%'], scientific: ['%sorghum%'] },
    data: { category:'Grain', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:90, frost_free_days_max:120, elevation_min_ft:0, elevation_max_ft:7000, precip_min_in:8, precip_max_in:50, temp_min_f:32 }
  },

  // ── HOPS ──────────────────────────────────────────────────────────────────
  {
    match: { common: ['%hops%','%hop%'], scientific: ['%humulus%'] },
    data: { category:'Vine', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:0, frost_free_days_max:999, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:12, precip_max_in:60, temp_min_f:-30 }
  },

  // ── PASSION FRUIT ─────────────────────────────────────────────────────────
  {
    match: { common: ['%passion fruit%','%passionflower%'], scientific: ['%passiflora%'] },
    data: { category:'Fruit', drought_tolerance:'Medium', moisture_use:'Medium', frost_free_days_min:240, frost_free_days_max:365, elevation_min_ft:0, elevation_max_ft:5000, precip_min_in:12, precip_max_in:60, temp_min_f:28 }
  },

  // ── KIWI ──────────────────────────────────────────────────────────────────
  {
    match: { common: ['%kiwi%'], scientific: ['%actinidia%'] },
    data: { category:'Fruit', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:180, frost_free_days_max:240, elevation_min_ft:0, elevation_max_ft:6000, precip_min_in:14, precip_max_in:60, temp_min_f:10 }
  },

  // ── OKRA ──────────────────────────────────────────────────────────────────
  {
    match: { common: ['%okra%'], scientific: ['%abelmoschus%'] },
    data: { category:'Vegetable', drought_tolerance:'High', moisture_use:'Low', frost_free_days_min:60, frost_free_days_max:80, elevation_min_ft:0, elevation_max_ft:6000, precip_min_in:8, precip_max_in:50, temp_min_f:32 }
  },

  // ── ARUGULA ───────────────────────────────────────────────────────────────
  {
    match: { common: ['%arugula%','%rocket%'], scientific: ['%eruca%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'Medium', frost_free_days_min:35, frost_free_days_max:50, elevation_min_ft:0, elevation_max_ft:8500, precip_min_in:10, precip_max_in:50, temp_min_f:20 }
  },

  // ── LENTILS ───────────────────────────────────────────────────────────────
  {
    match: { common: ['%lentil%'], scientific: ['%lens culinaris%'] },
    data: { category:'Vegetable', drought_tolerance:'Medium', moisture_use:'Low', frost_free_days_min:80, frost_free_days_max:110, elevation_min_ft:0, elevation_max_ft:8000, precip_min_in:8, precip_max_in:50, temp_min_f:25 }
  },

  // ── MINER'S LETTUCE ───────────────────────────────────────────────────────
  {
    match: { common: ['%miner%lettuce%','%claytonia%'], scientific: ['%claytonia%'] },
    data: { category:'Vegetable', drought_tolerance:'Low', moisture_use:'High', frost_free_days_min:45, frost_free_days_max:60, elevation_min_ft:0, elevation_max_ft:9000, precip_min_in:10, precip_max_in:50, temp_min_f:20 }
  },

];

async function seedByPattern(match, data) {
  let matched = 0;

  const buildQuery = (patterns, field) => {
    if (!patterns || patterns.length === 0) return null;
    return patterns.map(p => `${field} ILIKE '${p.replace(/'/g, "''")}'`).join(' OR ');
  };

  const conditions = [];
  if (match.common && match.common.length > 0) conditions.push(`(${buildQuery(match.common, 'common_name')})`);
  if (match.scientific && match.scientific.length > 0) conditions.push(`(${buildQuery(match.scientific, 'scientific_name')})`);
  if (conditions.length === 0) return 0;

  const { rows } = await pool.query(`
    SELECT id, usda_symbol, common_name FROM species
    WHERE ${conditions.join(' OR ')}
  `);

  for (const sp of rows) {
    await pool.query(`
      UPDATE species SET
        drought_tolerance = COALESCE(drought_tolerance, $1),
        moisture_use = COALESCE(moisture_use, $2),
        frost_free_days_min = COALESCE(frost_free_days_min, $3),
        frost_free_days_max = COALESCE(frost_free_days_max, $4),
        elevation_min_ft = COALESCE(elevation_min_ft, $5),
        elevation_max_ft = COALESCE(elevation_max_ft, $6),
        precip_min_in = COALESCE(precip_min_in, $7),
        precip_max_in = COALESCE(precip_max_in, $8),
        temp_min_f = COALESCE(temp_min_f, $9)
      WHERE id = $10
    `, [
      data.drought_tolerance, data.moisture_use,
      data.frost_free_days_min, data.frost_free_days_max,
      data.elevation_min_ft, data.elevation_max_ft,
      data.precip_min_in, data.precip_max_in,
      data.temp_min_f, sp.id
    ]);
    matched++;
  }

  return matched;
}

async function main() {
  console.log('PlantItEatIt — Expanded Food Plant Seeder v2');
  console.log('=============================================');
  console.log(`Processing ${PLANT_GROUPS.length} plant groups...\n`);

  let totalUpdated = 0;

  for (const group of PLANT_GROUPS) {
    const count = await seedByPattern(group.match, group.data);
    const label = group.match.common ? group.match.common[0] : group.match.scientific[0];
    console.log(`  ${label.replace(/%/g, '')}: ${count} species updated`);
    totalUpdated += count;
  }

  // Count total enriched species now
  const { rows } = await pool.query(`
    SELECT COUNT(*) as total FROM species WHERE frost_free_days_min IS NOT NULL
  `);

  console.log(`\n✓ Done`);
  console.log(`  Species updated this run: ${totalUpdated}`);
  console.log(`  Total enriched species in database: ${rows[0].total}`);

  await pool.end();
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
