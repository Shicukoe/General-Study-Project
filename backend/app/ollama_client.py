import os

import httpx
from fastapi import HTTPException

MODEL_PRIORITY = ["llama3.2", "llama3.1", "llama3", "qwen2.5", "mistral", "phi3"]


def _normalize_model_name(name: str) -> str:
    return name.split(":")[0].strip().lower()


def _select_ollama_model(requested_model: str, available_models: list[str]) -> str | None:
    if not available_models:
        return None

    requested_full = requested_model.strip().lower()
    requested_base = _normalize_model_name(requested_model)

    # 1) Full name exact match (e.g. llama3.2:latest)
    for model in available_models:
        if model.strip().lower() == requested_full:
            return model

    # 2) Base-name match ignoring tags (e.g. llama3.2)
    for model in available_models:
        if _normalize_model_name(model) == requested_base:
            return model

    # 3) Preferred fallback list
    by_base = {}
    for model in available_models:
        by_base.setdefault(_normalize_model_name(model), model)
    for candidate in MODEL_PRIORITY:
        if candidate in by_base:
            return by_base[candidate]

    # 4) Last resort: first available model
    return available_models[0]


async def generate_ollama_report(
    prompt: str,
    requested_model: str | None = None,
    timeout: float = 120.0,
) -> dict[str, str | bool]:
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
    resolved_requested_model = requested_model or os.getenv("OLLAMA_MODEL", "llama3.2")

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            tags_resp = await client.get(f"{ollama_host}/api/tags")
            tags_resp.raise_for_status()
            available_models = [
                model.get("name", "")
                for model in tags_resp.json().get("models", [])
                if model.get("name")
            ]

            selected_model = _select_ollama_model(resolved_requested_model, available_models)
            if not selected_model:
                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Ollama is running but no models are installed. "
                        f"Install one with: ollama pull {resolved_requested_model}"
                    ),
                )

            resp = await client.post(
                f"{ollama_host}/api/generate",
                json={"model": selected_model, "prompt": prompt, "stream": False},
            )
            resp.raise_for_status()

            return {
                "report": resp.json().get("response", "").strip(),
                "model_requested": resolved_requested_model,
                "model_used": selected_model,
                "used_fallback_model": selected_model != resolved_requested_model,
            }
    except HTTPException:
        raise
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Cannot connect to Ollama at {ollama_host}. "
                "Make sure Ollama is running: open a terminal and run 'ollama serve', "
                f"then ensure a model is available with 'ollama pull {resolved_requested_model}'."
            ),
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Ollama request timed out. The model may still be loading. Try again in a moment.",
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Ollama returned an error: {exc.response.text}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(exc)}")
