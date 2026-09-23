import faiss
import json
import numpy as np
from embedder import Embedder


class Retriever:
    def __init__(
        self,
        index_path="index.faiss",
        metadata_path="metadata.json"
    ):
        self.index = faiss.read_index(index_path)

        with open(metadata_path, "r", encoding="utf-8") as file:
            self.metadata = json.load(file)

        self.embedder = Embedder()

    def search(self, query, top_k=3):
        query_embedding = self.embedder.encode([query])
        query_embedding = np.asarray(
            query_embedding,
            dtype="float32"
        )

        scores, indices = self.index.search(
            query_embedding,
            top_k
        )

        results = []

        for score, index in zip(scores[0], indices[0]):
            if index == -1:
                continue

            result = self.metadata[index].copy()
            result["score"] = float(score)

            results.append(result)

        return results


if __name__ == "__main__":
    retriever = Retriever()

    query = "My order was cancelled but I was already charged. Can I get my money back?"

    results = retriever.search(query, top_k=3)

    print("\n=== QUERY ===")
    print(query)

    print("\n=== RETRIEVED RESULTS ===")

    for result in results:
        print(f"\nDocument: {result['documentId']}")
        print(f"Title: {result['title']}")
        print(f"Score: {result['score']:.4f}")
        print(f"Text: {result['text']}")