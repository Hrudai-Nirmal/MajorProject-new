from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

_client: Client | None = None


def get_client() -> Client:
    """Server-side Supabase client using the service_role key.
    Never expose this key to the frontend — the Next.js app should use the
    anon/publishable key directly against Supabase for read-only queries,
    and go through this FastAPI backend for anything that needs write access
    or an LLM call.
    """
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _client
