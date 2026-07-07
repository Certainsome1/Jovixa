from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass

from app.core.config import settings


TOKEN_PATTERN = re.compile(r"[a-zA-Z][a-zA-Z0-9+#.-]{1,}")


@dataclass(frozen=True)
class EmbeddingResult:
    vector: list[float]
    provider: str
    dimensions: int


class EmbeddingProvider:
    provider_name = "base"

    def embed(self, text: str) -> EmbeddingResult:
        raise NotImplementedError


class HashingEmbeddingProvider(EmbeddingProvider):
    provider_name = "local-hashing"

    def __init__(self, dimensions: int = 384):
        self.dimensions = dimensions

    def embed(self, text: str) -> EmbeddingResult:
        vector = [0.0] * self.dimensions

        for token in tokenize(text):
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[index] += sign

        normalized = normalize_vector(vector)
        return EmbeddingResult(
            vector=normalized,
            provider=self.provider_name,
            dimensions=self.dimensions,
        )


def build_embedding_provider() -> EmbeddingProvider:
    return HashingEmbeddingProvider(dimensions=settings.EMBEDDING_DIMENSIONS)


def tokenize(text: str) -> list[str]:
    return [match.group(0).lower() for match in TOKEN_PATTERN.finditer(text or "")]


def normalize_vector(vector: list[float]) -> list[float]:
    magnitude = math.sqrt(sum(value * value for value in vector))
    if magnitude == 0:
        return vector
    return [value / magnitude for value in vector]


def cosine_similarity(first: list[float], second: list[float]) -> float:
    if not first or not second or len(first) != len(second):
        return 0.0

    return sum(left * right for left, right in zip(first, second))
