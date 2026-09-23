from rag_store import KnowledgeStore
from chunker import chunk_text
from embedder import Embedder
from vector_store import VectorStore


def main():
    store = KnowledgeStore()
    documents = store.get_documents()
    store.close()

    all_chunks = []

    for document in documents:
        content = document.get("content", "")
        chunks = chunk_text(content)

        for index, chunk in enumerate(chunks):
            all_chunks.append({
                "documentId": document["documentId"],
                "title": document["title"],
                "type": document["type"],
                "chunkIndex": index,
                "text": chunk,
            })

    texts = [chunk["text"] for chunk in all_chunks]

    embedder = Embedder()
    embeddings = embedder.encode(texts)

    vector_store = VectorStore(dimension=384)
    vector_store.add(embeddings, all_chunks)

    vector_store.save()

    print("\n=== FAISS INDEX BUILT ===")
    print(f"Chunks indexed: {vector_store.count()}")
    print("Index file: index.faiss")
    print("Metadata file: metadata.json")


if __name__ == "__main__":
    main()