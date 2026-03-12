import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Relative imports within app package
from .dematel import normalize_matrix, total_influence_matrix, prominence_relation, simplify_matrix
from .danp import compute_danp_weights
from .schemas import MatrixInput, GapAnalysisInput, InterpretDanpInput
from .ollama_client import generate_ollama_report
from .utils import validate_matrix

# ─── Expert benchmark from the paper (16 practitioners) ──────────────────────
PAPER_DATA = {
    "4x4": {
        "top_causes":  ["Personal ability", "Organizational ability"],
        "top_effects": ["Intangible assets", "Tangible assets"],
        "note": "Expert consensus of 16 practitioners — paper Table 4",
    },
    "8x8": {
        "top_causes":  ["Marketing resources", "Human resources", "Financial resources"],
        "top_effects": ["Brand/business reputation resources", "Physical resources", "Organizational resources"],
        "note": "Expert consensus of 16 practitioners — paper Table 8",
    },
}

# Known grouping from the reference model for 8 indicators.
INDICATOR_TO_DIMENSION = {
    "physical resources": 0,                      # Tangible assets
    "financial resources": 1,                     # Intangible assets
    "brand/business reputation resources": 1,
    "technical resources": 1,
    "relationship resources": 1,
    "marketing resources": 1,
    "human resources": 2,                         # Personal ability
    "organizational resources": 3,                # Organizational ability
}

DIMENSION_LABEL_ORDER = [
    "tangible assets",
    "intangible assets",
    "personal ability",
    "organizational ability",
]

EVALUATION_DATA = {
    "Tangible assets": {
        "Physical resources": [
            "Area-effectiveness",
            "Perfect equipment sets",
            "Location/store base",
            "Planar configuration and thematic feature/design"
        ],
        "Financial resources": [
            "Sound financial structure",
            "Abundant investment funds",
            "Payback time-estimated investment costs and returns"
        ]
    },
    "Intangible assets": {
        "Brand/business reputation resources": [
            "Registered trademark",
            "Customers’ brand loyalty",
            "Client contract/cooperation contract-cooperative store",
            "Company’s entire image/brand popularity"
        ],
        "Technical resources": [
            "License and technological exchange",
            "Product innovation and research and development ability",
            "Database—the establishment of consumers’ database",
            "Patents—delicacies, equipment, and service workflow"
        ],
        "Relationship resources": [
            "Horizontal alliances",
            "Client internalization—to internalize customers",
            "Stable supply chains"
        ],
        "Marketing resources": [
            "Marketing and planning",
            "Brand development plan",
            "Information technology and multimedia",
            "Ability of familiarizing and discovering potential markets"
        ]
    },
    "Personal ability": {
        "Human resources": [
            "Personnel allocation and training",
            "Special skills—license of chef, language ability, supervision",
            "Management ability/leadership",
            "Social networks/communication ability"
        ]
    },
    "Organizational ability": {
        "Organizational resources": [
            "Organizational culture",
            "Administration and procurement",
            "Organization and memory learning",
            "Cross-organization cooperation networks",
            "Degree of profession for the organizational operation"
        ]
    }
}

# Flat helper for easy lookup by Indicator name
INDICATOR_TO_FACTORS = {
    indicator: factors
    for dimension in EVALUATION_DATA.values()
    for indicator, factors in dimension.items()
}


def _infer_dimension_mapping(labels: list[str]) -> list[int]:
    normalized = [label.strip().lower() for label in labels]

    # 8x8 indicator model from the paper.
    if len(labels) == 8 and all(label in INDICATOR_TO_DIMENSION for label in normalized):
        return [INDICATOR_TO_DIMENSION[label] for label in normalized]

    # 4x4 dimension model from the paper.
    if len(labels) == 4 and all(label in DIMENSION_LABEL_ORDER for label in normalized):
        order_lookup = {label: idx for idx, label in enumerate(DIMENSION_LABEL_ORDER)}
        return [order_lookup[label] for label in normalized]

    # Fallback: single cluster if no known mapping is available.
    return [0] * len(labels)

app = FastAPI(title="Hospitality Innovation DSS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/analyze")
def analyze(data: MatrixInput):
    try:
        A = np.array(data.matrix)
        validate_matrix(A)

        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        T_simplified = simplify_matrix(T)

        d, r, prominence, relation = prominence_relation(T)

        dimension_mapping = data.dimension_mapping if data.dimension_mapping is not None else _infer_dimension_mapping(data.labels)
        danp = compute_danp_weights(T, dimension_mapping=dimension_mapping, return_details=True)
        weights = danp["weights"]

        # NEW: Generate text-based insights        
        if (np.any(np.isnan(d)) or np.any(np.isinf(d)) or
            np.any(np.isnan(r)) or np.any(np.isinf(r)) or
            np.any(np.isnan(prominence)) or np.any(np.isinf(prominence)) or
            np.any(np.isnan(relation)) or np.any(np.isinf(relation)) or
            np.any(np.isnan(weights)) or np.any(np.isinf(weights)) or
            np.any(np.isnan(danp["unweighted_supermatrix"])) or np.any(np.isinf(danp["unweighted_supermatrix"])) or
            np.any(np.isnan(danp["weighted_supermatrix"])) or np.any(np.isinf(danp["weighted_supermatrix"])) or
            np.any(np.isnan(danp["limit_matrix"])) or np.any(np.isinf(danp["limit_matrix"]))):
            raise ValueError("Calculation resulted in invalid values.")

        ranking = sorted(
            zip(data.labels, weights),
            key=lambda x: x[1],
            reverse=True
        )

        return {
            "total_influence_matrix": T.tolist(),
            "simplified_total_influence_matrix": T_simplified.tolist(),
            "d": d.tolist(),
            "r": r.tolist(),
            "prominence": prominence.tolist(),
            "relation": relation.tolist(),
            "weights": weights.tolist(),
            "ranking": ranking,
            "dimension_mapping": danp["dimension_mapping"].tolist(),
            "unweighted_supermatrix": danp["unweighted_supermatrix"].tolist(),
            "weighted_supermatrix": danp["weighted_supermatrix"].tolist(),
            "limit_matrix": danp["limit_matrix"].tolist(),
            "dimension_matrix": danp["dimension_matrix"].tolist(),
            "normalized_dimension_matrix": danp["normalized_dimension_matrix"].tolist(),
            "danp_iterations": int(danp["iterations"]),
}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/gap-analysis")
async def gap_analysis(data: GapAnalysisInput):
    paper = PAPER_DATA.get(data.mode)
    if not paper:
        raise HTTPException(status_code=400, detail=f"Unsupported mode: {data.mode}. Use '4x4' or '8x8'.")

    # Derive user's top causes / effects from D-R values
    paired = list(zip(data.labels, data.prominence, data.relation))
    causes_sorted = sorted([(l, p, r) for l, p, r in paired if r > 0],  key=lambda x: -x[2])
    effects_sorted = sorted([(l, p, r) for l, p, r in paired if r <= 0], key=lambda x:  x[2])
    prom_sorted    = sorted(paired, key=lambda x: -x[1])

    user_top_causes    = [l for l, _, _ in causes_sorted[:3]]
    user_top_effects   = [l for l, _, _ in effects_sorted[:3]]
    user_top_prom      = prom_sorted[0][0] if prom_sorted else "N/A"

    paper_causes  = paper["top_causes"]
    paper_effects = paper["top_effects"]

    paper_causes_lower = [c.lower() for c in paper_causes]
    matching_causes  = [c for c in user_top_causes if c.lower() in paper_causes_lower]
    differing_causes = [c for c in user_top_causes if c.lower() not in paper_causes_lower]

    prompt = (
        f"You are an expert business analyst specializing in DEMATEL methodology for restaurant management research.\n\n"
        f"A user performed a DEMATEL analysis on {data.mode} factors ({', '.join(data.labels)}).\n\n"
        f"USER'S ANALYSIS:\n"
        f"- Top causing factors (D-R > 0, highest first): {', '.join(user_top_causes) if user_top_causes else 'None'}\n"
        f"- Top receiving factors (most negative D-R first): {', '.join(user_top_effects) if user_top_effects else 'None'}\n"
        f"- Highest centrality factor (D+R): {user_top_prom}\n\n"
        f"EXPERT BENCHMARK ({paper['note']}):\n"
        f"- Paper's top causes: {', '.join(paper_causes)}\n"
        f"- Paper's top effects: {', '.join(paper_effects)}\n\n"
        f"COMPARISON:\n"
        f"- Causes matching the expert benchmark: {', '.join(matching_causes) if matching_causes else 'None'}\n"
        f"- Causes differing from the expert benchmark: {', '.join(differing_causes) if differing_causes else 'None'}\n\n"
        f"Write a concise 3-4 sentence strategic insight report. Compare the user's results with the expert benchmark, "
        f"explain what any differences imply for business strategy, and give one specific actionable recommendation."
    )

    return await generate_ollama_report(prompt=prompt, timeout=90.0)


# ─── /interpret-danp ─────────────────────────────────────────────────────────

@app.post("/interpret-danp")
async def interpret_danp(data: InterpretDanpInput):
    """
    Generate a strategic interpretation report for the top-4 DANP indicators
    using an Ollama LLM.  Accepts the full ranking list and maps each top
    indicator to its evaluation factors from INDICATOR_TO_FACTORS.
    """

    # ── 1. Identify top 4 indicators ─────────────────────────────────────
    ranked = sorted(data.ranking, key=lambda x: float(x[1]), reverse=True)
    top4 = ranked[:4]

    # ── 2. Map each indicator to its evaluation factors ───────────────────
    top4_detail = []
    for indicator, weight in top4:
        raw_weight = float(weight)
        factors = INDICATOR_TO_FACTORS.get(indicator, [])
        # Case-insensitive fallback
        if not factors:
            factors = next(
                (v for k, v in INDICATOR_TO_FACTORS.items()
                 if k.lower() == indicator.lower()),
                ["(no sub-factors available)"],
            )
        top4_detail.append({
            "indicator": indicator,
            "weight": raw_weight,
            "factors": factors,
        })

    # ── 3. Build the LLM prompt ───────────────────────────────────────────
    indicator_list_str = "\n".join(
        f"  {i+1}. {d['indicator']} (weight = {d['weight']:.4f})"
        for i, d in enumerate(top4_detail)
    )

    sections_str = "\n\n".join(
        f"{i+1}. {d['indicator']}\n"
        f"   Evaluation factors: {', '.join(d['factors'])}\n"
        f"   Weight: {d['weight']:.4f}"
        for i, d in enumerate(top4_detail)
    )

    prompt = (
        "You are an expert hospitality consultant specialising in affiliated restaurant "
        "development and business model innovation.\n\n"
        "Based on the user's DANP analysis results for an affiliated restaurant business model, "
        "the following four indicators carry the highest strategic weight:\n\n"
        f"{indicator_list_str}\n\n"
        "Your task:\n"
        "Write a formal, academic-yet-practical strategic interpretation report. "
        "Begin with the header exactly as written:\n"
        "\"Based on your business model about the expected affiliated restaurant development...\"\n\n"
        "Then write one introductory paragraph explaining why these four indicators were selected "
        "and what their combined prominence implies for the business.\n\n"
        "Then, for each of the four indicators listed below, write a numbered section with:\n"
        "  - A brief explanation of what the indicator represents in the context of affiliated restaurants.\n"
        "  - A sentence that explicitly references at least two of its evaluation factors "
        "and explains how they drive competitive advantage.\n"
        "  - One concrete, actionable strategic recommendation for restaurant operators.\n\n"
        "Use the formal, referenced tone of MCDM research papers (cf. Sections 4.2.1–4.2.3 of "
        "'Integrating the MCDM Method to Explore the Business Model Innovation for Affiliated "
        "Restaurants', 2022).  Avoid bullet-only responses — use coherent prose paragraphs.\n\n"
        f"{sections_str}"
    )

    # ── 4. Call Ollama ────────────────────────────────────────────────────
    ollama_result = await generate_ollama_report(
        prompt=prompt,
        requested_model=data.model,
        timeout=120.0,
    )

    return {
        "report": ollama_result["report"],
        "top4": top4_detail,
        "model_requested": ollama_result["model_requested"],
        "model_used": ollama_result["model_used"],
        "used_fallback_model": ollama_result["used_fallback_model"],
    }

