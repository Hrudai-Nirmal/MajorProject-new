import os
from pathlib import Path
from dotenv import load_dotenv

# Explicit path (not just load_dotenv()'s cwd-relative search) so this works
# whether the process is started from repo root, backend/, or scripts/.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Embeddings stay on Gemini — embedContent has open free-tier quota even
# though generateContent is billing-gated (Google AI Pro doesn't cover API billing).
EMBEDDING_MODEL = "models/gemini-embedding-001"
EMBEDDING_DIM = 768  # truncated from native 3072 via outputDimensionality (pgvector index cap is 2000 dims)

# Generation moved to Groq (free developer tier, no billing account needed).
GROQ_GENERATION_MODEL = "llama-3.3-70b-versatile"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in environment (.env)")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set in environment (.env)")
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in environment (.env)")
