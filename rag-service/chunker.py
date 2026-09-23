def chunk_text(text, max_words=80):
    """
    Split text into small word-based chunks.

    For the current prototype, knowledge documents
    are short, so most documents will remain one chunk.
    """

    words = text.split()

    if len(words) <= max_words:
        return [text.strip()]

    chunks = []

    for start in range(0, len(words), max_words):
        chunk = " ".join(words[start:start + max_words]).strip()

        if chunk:
            chunks.append(chunk)

    return chunks