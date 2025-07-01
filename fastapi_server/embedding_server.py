# -*- coding: utf-8 -*-
"""
Created on Mon Jun 30 20:01:59 2025

@author: pc
"""

# embedding_server.py

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI()
model = SentenceTransformer("jhgan/ko-sroberta-multitask")  # 한국어 + 다국어 지원

class Query(BaseModel):
    text: str

@app.post("/embed")
async def embed(query: Query):
    embedding = model.encode(query.text).tolist()
    return {"embedding": embedding}

#uvicorn embedding_server:app --reload --port 8000
