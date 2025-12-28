// Document chunking configuration
export const CHUNK_SIZE = 800
export const CHUNK_OVERLAP = 150
export const MAX_CHUNKS = 1000

// Embedding configuration
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
export const EMBEDDING_MAX_RETRIES = 3

// LLM configuration
export const LLM_MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
export const LLM_TEMPERATURE = 0.1
export const LLM_MAX_TOKENS = 300

// RAG configuration
export const RAG_MAX_SOURCES = 2
export const RAG_RELEVANCE_THRESHOLD = 0.15
