import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not configured")


class KnowledgeStore:
    def __init__(self):
        self.client = MongoClient(MONGODB_URI)

        self.db = self.client["test"]

        self.collection = self.db["knowledgedocuments"]

    def get_documents(self):
        documents = list(
            self.collection.find(
                {},
                {
                    "_id": 0
                }
            )
        )

        return documents

    def close(self):
        self.client.close()