"""
api/routes/__init__.py

Intentionally empty. Router assembly (mounting health/predict/ai routers
onto `api_router`) lives in a single place: backend/api/__init__.py.

(Previously this file contained a byte-for-byte duplicate of that
assembly code, which was never actually used by main.py and had drifted
into being confusing dead code.)
"""
