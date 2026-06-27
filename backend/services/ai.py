import httpx

DEEPSEEK_API_KEY = "sk-0e145e5272e147bb8e63b486ca265474"
DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-chat"


async def chat(
    messages: list[dict],
    temperature: float = 0.7,
) -> str:
    """Call DeepSeek chat completion. Returns the assistant reply text.

    Raises httpx.TimeoutException or httpx.HTTPStatusError on failure;
    callers decide how to handle (raise HTTP error vs. fail silently).
    """
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": messages,
                "temperature": temperature,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
