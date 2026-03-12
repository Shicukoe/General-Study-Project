// ─── Constants ────────────────────────────────────────────────────────────────

export const DIMENSIONS_4X4 = [
  "Tangible assets",
  "Intangible assets",
  "Personal ability",
  "Organizational ability",
];

export const DIMENSIONS_8X8 = [
  "Physical resources",
  "Financial resources",
  "Brand/business reputation resources",
  "Technical resources",
  "Relationship resources",
  "Marketing resources",
  "Human resources",
  "Organizational resources",
];

export const EXAMPLE_4X4 = {
  mode: "4x4",
  labels: DIMENSIONS_4X4,
  matrix: [
    [0,   3.5, 2,   2  ],
    [3.4, 0,   3.4, 3.4],
    [2,   4,   0,   3  ],
    [3.5, 3.5, 2,   0  ],
  ],
};

export const EXAMPLE_8X8 = {
  mode: "8x8",
  labels: DIMENSIONS_8X8,
  matrix: [
    [0, 1, 3, 4, 3, 3, 2, 4],
    [4, 0, 4, 1, 1, 4, 4, 4],
    [1, 4, 0, 0, 4, 4, 4, 4],
    [3, 2, 4, 0, 4, 2, 1, 4],
    [4, 1, 4, 3, 0, 2, 4, 1],
    [4, 4, 3, 4, 3, 0, 1, 4],
    [1, 4, 4, 4, 2, 4, 0, 3],
    [4, 4, 3, 4, 0, 4, 4, 0],
  ],
};

/** Paper benchmark (16 experts): D, R, D+R, D-R for reflection against user results. */
export const PAPER_BENCHMARK_PR = {
  "4x4": {
    averageProminence: 19.7587,
    rows: [
      { label: "Tangible assets",        d: 9.4475,  r: 9.6947,  prominence: 19.1422, relation: -0.2472 },
      { label: "Intangible assets",      d: 10.3335, r: 10.6279, prominence: 20.9614, relation: -0.2944 },
      { label: "Personal ability",       d: 9.8365,  r: 9.4252,  prominence: 19.2617, relation: 0.4113 },
      { label: "Organizational ability", d: 9.8999,  r: 9.7695,  prominence: 19.6694, relation: 0.1303 },
    ],
  },
  "8x8": {
    averageProminence: 12.3567,
    rows: [
      { label: "Physical resources",                   d: 5.9824, r: 5.9836, prominence: 11.9660, relation: -0.0013 },
      { label: "Financial resources",                  d: 6.3171, r: 6.0216, prominence: 12.3386, relation: 0.2955 },
      { label: "Brand/business reputation resources",  d: 6.3151, r: 7.0720, prominence: 13.3871, relation: -0.7569 },
      { label: "Technical resources",                  d: 5.9329, r: 5.9017, prominence: 11.8346, relation: 0.0311 },
      { label: "Relationship resources",               d: 5.6906, r: 5.6769, prominence: 11.3676, relation: 0.0137 },
      { label: "Marketing resources",                  d: 6.3815, r: 6.3159, prominence: 12.6975, relation: 0.0656 },
      { label: "Human resources",                      d: 6.3668, r: 6.0129, prominence: 12.3796, relation: 0.3539 },
      { label: "Organizational resources",             d: 6.4405, r: 6.4422, prominence: 12.8827, relation: -0.0017 },
    ],
  },
};

/** Paper Table 10: DANP dimension weights and priority order. */
export const PAPER_DIMENSION_WEIGHTS = [
  { dimension: "Tangible assets",        weight: 0.2452, priority: 3 },
  { dimension: "Intangible assets",      weight: 0.2688, priority: 1 },
  { dimension: "Personal ability",       weight: 0.2387, priority: 4 },
  { dimension: "Organizational ability", weight: 0.2473, priority: 2 },
];

/** Paper Table 11: DANP indicator weights from the extreme (limit) supermatrix. */
export const PAPER_INDICATOR_WEIGHTS = [
  { indicator: "Physical resources",                  weight: 0.1221, priority: 4 },
  { indicator: "Financial resources",                 weight: 0.1231, priority: 3 },
  { indicator: "Brand/business reputation resources", weight: 0.0762, priority: 5 },
  { indicator: "Technical resources",                 weight: 0.0637, priority: 7 },
  { indicator: "Relationship resources",              weight: 0.0611, priority: 8 },
  { indicator: "Marketing resources",                 weight: 0.0678, priority: 6 },
  { indicator: "Human resources",                     weight: 0.2387, priority: 2 },
  { indicator: "Organizational resources",            weight: 0.2473, priority: 1 },
];

/** Indicator → dimension mapping used in Table 11. */
export const DIM_GROUPS = [
  { dim: "Tangible assets",        indicators: ["Physical resources"] },
  { dim: "Intangible assets",      indicators: ["Financial resources", "Brand/business reputation resources", "Technical resources", "Relationship resources", "Marketing resources"] },
  { dim: "Personal ability",       indicators: ["Human resources"] },
  { dim: "Organizational ability", indicators: ["Organizational resources"] },
];

/** Canonical indicator order for Table 11 columns and Figure 3 radar axis. */
export const INDICATOR_ORDER = DIM_GROUPS.flatMap((g) => g.indicators);

/** ScatterChart canvas dimensions and margins. */
export const CHART = { W: 670, H: 450, ML: 20, MT: 20, MR: 20, MB: 40 };

// ─── Exact arrow pairs for Figure 2 (8×8) ───────────────────────────────────

/** 7 black one-way arrows from paper Figure 2 with per-arc curve offsets (px). */
export const BLACK_PAIRS_8X8 = [
  { from: "Relationship resources",              to: "Brand/business reputation resources", curve: 130  },
  { from: "Technical resources",                 to: "Brand/business reputation resources", curve: 500  },
  { from: "Human resources",                     to: "Technical resources",                  curve: 50   },
  { from: "Financial resources",                 to: "Physical resources",                   curve: -40  },
  { from: "Financial resources",                 to: "Marketing resources",                  curve: 40   },
  { from: "Organizational resources",            to: "Technical resources",                  curve: -50  },
  { from: "Physical resources",                  to: "Brand/business reputation resources",  curve: 140  },
];

/** 11 red two-way arrows from paper Figure 2 with per-arc curve offsets (px). */
export const RED_PAIRS_8X8 = [
  // Inner cluster — 3 causes × 2 non-sink effects
  { from: "Human resources",                     to: "Physical resources",               curve:   15 },
  { from: "Human resources",                     to: "Organizational resources",          curve: -150 },
  { from: "Financial resources",                 to: "Physical resources",               curve:    0 },
  { from: "Financial resources",                 to: "Organizational resources",          curve: -100 },
  { from: "Marketing resources",                 to: "Physical resources",               curve:  -15 },
  { from: "Marketing resources",                 to: "Organizational resources",          curve:  -10 },
  // Brand (sink) ↔ causes — large sweeping curves
  { from: "Brand/business reputation resources", to: "Human resources",                  curve: -180 },
  { from: "Brand/business reputation resources", to: "Financial resources",              curve: -140 },
  { from: "Brand/business reputation resources", to: "Marketing resources",              curve:  200 },
  // Brand (sink) ↔ non-sink effects
  { from: "Brand/business reputation resources", to: "Physical resources",               curve: -220 },
  { from: "Brand/business reputation resources", to: "Organizational resources",          curve:  200 },
];
