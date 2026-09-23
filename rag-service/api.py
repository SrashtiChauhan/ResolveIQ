from fastapi import FastAPI
from pydantic import BaseModel

from retrieve import Retriever


app = FastAPI(title="ResolveIQ RAG Service")

retriever = Retriever()


class SearchRequest(BaseModel):
    query: str
    top_k: int = 3


@app.get("/health")
def health():
    return {
        "success": True,
        "service": "ResolveIQ RAG Service"
    }


@app.post("/retrieve")
def retrieve(request: SearchRequest):
    results = retriever.search(
        request.query,
        request.top_k
    )

    return {
        "success": True,
        "query": request.query,
        "results": results
    }