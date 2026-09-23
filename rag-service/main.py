from rag_store import KnowledgeStore
from chunker import chunk_text
from embedder import Embedder


def main():
    store = KnowledgeStore()
    documents = store.get_documents()

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

    store.close()

    print(f"\nTotal chunks: {len(all_chunks)}")

    texts = [chunk["text"] for chunk in all_chunks]

    embedder = Embedder()
    embeddings = embedder.encode(texts)

    print(f"\nEmbedding shape: {embeddings.shape}")
    print(f"Number of embeddings: {len(embeddings)}")
    print(f"Dimensions per embedding: {embeddings.shape[1]}")

    print("\nFirst embedding:")
    print(embeddings[0])


if __name__ == "__main__":
    main()