import os
from pathlib import Path

from groq import Groq
from fastapi import HTTPException


# Try to load .env file if it exists
try:
    from dotenv import load_dotenv
    # Look for .env in parent directory (backend folder)
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass  

# Load configuration from environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# List of available models for interchange and fallback
AVAILABLE_MODELS = [
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    # Add your remaining 31 models here as you expand
]

# Initialize Groq client only if API key is available
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def generate_ollama_report(
    prompt: str,
    requested_model: str | None = None,
    timeout: float = 120.0,
) -> dict[str, str | bool]:
    """
    Generate a report using Groq's API with the specified model.
    Falls back to alternative models if the primary model is unavailable.
    
    Args:
        prompt: The prompt to send to the model
        requested_model: The requested model name (e.g., "llama-3.3-70b-versatile")
        timeout: Timeout for the request in seconds
    
    Returns:
        Dictionary with report, model info, and fallback status
    """
    
    # Check if API key is configured
    if not GROQ_API_KEY or not client:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY environment variable is not set. Please configure it in your .env file.",
        )
    
    # Use requested model or default
    selected_model = requested_model or GROQ_MODEL
    
    # Build list of models to try (primary first, then fallbacks)
    models_to_try = [selected_model]
    # Add other available models as fallbacks
    for model in AVAILABLE_MODELS:
        if model != selected_model:
            models_to_try.append(model)
    
    last_error = None
    
    # Try each model in sequence
    for attempt, model in enumerate(models_to_try):
        try:
            # Make request to Groq API
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=model,
            )
            
            response_text = chat_completion.choices[0].message.content
            
            return {
                "report": response_text.strip(),
                "model_requested": requested_model or GROQ_MODEL,
                "model_used": model,
                "used_fallback_model": attempt > 0,
            }
        
        except HTTPException:
            # If it's already an HTTPException, re-raise immediately
            raise
        except Exception as exc:
            last_error = exc
            # Continue to next model if available
            if attempt < len(models_to_try) - 1:
                continue
    
    # All models failed - convert last error to HTTPException
    error_msg = str(last_error) if last_error else "Unknown error"
    
    if "401" in error_msg or "Unauthorized" in error_msg:
        raise HTTPException(
            status_code=401,
            detail="Invalid Groq API key. Please check your GROQ_API_KEY environment variable.",
        )
    elif "rate_limit" in error_msg.lower() or "429" in error_msg:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later.",
        )
    elif "connection" in error_msg.lower() or "connect" in error_msg.lower():
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Groq API. Check your internet connection.",
        )
    elif "timeout" in error_msg.lower():
        raise HTTPException(
            status_code=504,
            detail="Request to Groq API timed out. Try again in a moment.",
        )
    else:
        raise HTTPException(
            status_code=500,
            detail=f"All available models failed. Last error: {error_msg}",
        )
