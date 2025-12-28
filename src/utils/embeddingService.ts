import { env, pipeline } from '@xenova/transformers'
import { similarity } from 'ml-distance'
import type { DocumentChunk, RetrievalResult } from '../types/document'
import { EMBEDDING_MODEL, EMBEDDING_MAX_RETRIES } from '../config'

// Configure transformers.js - MUST be done before any pipeline calls
// Skip local model check - always fetch from HuggingFace Hub
env.allowLocalModels = false
// Disable browser cache to avoid stale/corrupted cached responses
env.useBrowserCache = false

type FeatureExtractionPipeline = Awaited<ReturnType<typeof pipeline<'feature-extraction'>>>

class EmbeddingService {
  private embedder: FeatureExtractionPipeline | null = null
  private isInitialized = false
  private initPromise: Promise<void> | null = null
  private loadAttempts = 0

  async initialize(onProgress?: (progress: number, text: string) => void): Promise<void> {
    if (this.isInitialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      onProgress?.(0, 'Loading embedding model...')

      while (this.loadAttempts < EMBEDDING_MAX_RETRIES) {
        try {
          this.loadAttempts++
          console.log(
            `[EmbeddingService] Loading model, attempt ${this.loadAttempts}/${EMBEDDING_MAX_RETRIES}`
          )

          this.embedder = await pipeline('feature-extraction', EMBEDDING_MODEL, {
            progress_callback: (data: any) => {
              if (data.status === 'progress' && data.progress !== undefined) {
                onProgress?.(data.progress / 100, `Loading: ${data.file || 'model'}`)
              } else if (data.status === 'ready') {
                onProgress?.(1, 'Embedding model ready')
              }
            },
          })

          this.isInitialized = true
          onProgress?.(1, 'Embedding model ready')
          console.log('[EmbeddingService] Model loaded successfully')
          return
        } catch (error) {
          console.error(`[EmbeddingService] Attempt ${this.loadAttempts} failed:`, error)

          if (this.loadAttempts >= EMBEDDING_MAX_RETRIES) {
            this.initPromise = null
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            // Check for common CDN/network errors
            if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('Unexpected token')) {
              throw new Error(
                'Model server returned an error page. This is usually a temporary network issue. Please refresh the page and try again.'
              )
            }
            throw new Error(
              `Failed to load embedding model after ${EMBEDDING_MAX_RETRIES} attempts: ${errorMessage}`
            )
          }

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000 * this.loadAttempts))
        }
      }
    })()

    return this.initPromise
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('Embedding model not initialized')
    }

    const output = await this.embedder(text, { pooling: 'mean', normalize: true })
    return Array.from(output.data as Float32Array)
  }

  async embedChunks(
    chunks: DocumentChunk[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<number, number[]>> {
    const embeddings = new Map<number, number[]>()

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await this.embedText(chunks[i].text)
      embeddings.set(chunks[i].id, embedding)
      onProgress?.(i + 1, chunks.length)
    }

    return embeddings
  }

  calculateSimilarity(a: number[], b: number[]): number {
    return similarity.cosine(a, b)
  }

  async findRelevantChunks(
    query: string,
    chunks: DocumentChunk[],
    chunkEmbeddings: Map<number, number[]>,
    topK: number = 3
  ): Promise<RetrievalResult[]> {
    const queryEmbedding = await this.embedText(query)

    const scored: RetrievalResult[] = chunks.map((chunk) => {
      const chunkEmbedding = chunkEmbeddings.get(chunk.id)
      if (!chunkEmbedding) {
        return { chunk, score: 0 }
      }
      const score = this.calculateSimilarity(queryEmbedding, chunkEmbedding)
      return { chunk, score }
    })

    scored.sort((a, b) => b.score - a.score)

    return scored.slice(0, topK)
  }

  isReady(): boolean {
    return this.isInitialized
  }

  reset(): void {
    this.embedder = null
    this.isInitialized = false
    this.initPromise = null
    this.loadAttempts = 0
  }
}

export const embeddingService = new EmbeddingService()
