"""External API adapters. Each returns Pydantic models, uses httpx +
hishel cache, has cache_ttl_seconds + rate_limit_per_minute, a Tenacity
retry, and translates HTTPStatusError to a domain exception (CLAUDE.md).
"""
