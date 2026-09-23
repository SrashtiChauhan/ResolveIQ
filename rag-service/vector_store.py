import faiss
import json
import numpy as np


class VectorStore:
    def __init__(self, dimension=384):
        self.index = faiss.IndexFlatIP(dimension)
        self.metadata = []

    def add(self, embeddings, metadata):
        embeddings = np.asarray(embeddings, dtype="float32")

        self.index.add(embeddings)
        self.metadata.extend(metadata)

    def save(self, index_path="index.faiss", metadata_path="metadata.json"):
        faiss.write_index(self.index, index_path)

        with open(metadata_path, "w", encoding="utf-8") as file:
            json.dump(self.metadata, file, indent=2)

    def count(self):
        return self.index.ntotal