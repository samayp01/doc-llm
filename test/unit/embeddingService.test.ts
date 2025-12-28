import { describe, it, expect, vi, beforeEach } from 'vitest'
import { similarity } from 'ml-distance'

// Mock only the transformers library (external dependency)
vi.mock('@xenova/transformers', () => ({
  env: {
    allowLocalModels: false,
    useBrowserCache: false,
  },
  pipeline: vi.fn(),
}))

describe('embeddingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('cosine similarity (using ml-distance)', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [1, 0, 0]
      const result = similarity.cosine(vec, vec)
      expect(result).toBeCloseTo(1, 5)
    })

    it('should return 0 for orthogonal vectors', () => {
      const vecA = [1, 0, 0]
      const vecB = [0, 1, 0]
      const result = similarity.cosine(vecA, vecB)
      expect(result).toBeCloseTo(0, 5)
    })

    it('should return -1 for opposite vectors', () => {
      const vecA = [1, 0, 0]
      const vecB = [-1, 0, 0]
      const result = similarity.cosine(vecA, vecB)
      expect(result).toBeCloseTo(-1, 5)
    })

    it('should handle normalized vectors correctly', () => {
      const vecA = [0.6, 0.8, 0]
      const vecB = [0.8, 0.6, 0]
      const result = similarity.cosine(vecA, vecB)
      expect(result).toBeGreaterThan(0.9)
      expect(result).toBeLessThan(1)
    })

    it('should score similar content higher', () => {
      const queryVec = [0.5, 0.5, 0.5]
      const similarChunkVec = [0.6, 0.5, 0.4]
      const dissimilarChunkVec = [-0.5, -0.5, 0.5]

      const similarScore = similarity.cosine(queryVec, similarChunkVec)
      const dissimilarScore = similarity.cosine(queryVec, dissimilarChunkVec)

      expect(similarScore).toBeGreaterThan(dissimilarScore)
    })
  })
})
