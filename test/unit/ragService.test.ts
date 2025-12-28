import { describe, it, expect } from 'vitest'

describe('ragService', () => {
  describe('source filtering', () => {
    const filterByThreshold = (
      sources: { score: number }[],
      threshold: number
    ): { score: number }[] => {
      return sources.filter((s) => s.score > threshold)
    }

    it('should filter sources below threshold', () => {
      const sources = [{ score: 0.8 }, { score: 0.5 }, { score: 0.1 }, { score: 0.9 }]
      const filtered = filterByThreshold(sources, 0.15)
      // 0.1 is below threshold, so only 3 remain
      expect(filtered).toHaveLength(3)
    })

    it('should exclude sources at or below threshold', () => {
      const sources = [{ score: 0.15 }, { score: 0.1 }, { score: 0.2 }]
      const filtered = filterByThreshold(sources, 0.15)
      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.score).toBe(0.2)
    })
  })

  describe('source sorting', () => {
    it('should sort sources by document position', () => {
      const sources = [
        { chunk: { startPos: 500 }, score: 0.8 },
        { chunk: { startPos: 100 }, score: 0.9 },
        { chunk: { startPos: 300 }, score: 0.7 },
      ]

      const sorted = [...sources].sort((a, b) => a.chunk.startPos - b.chunk.startPos)

      expect(sorted[0]?.chunk.startPos).toBe(100)
      expect(sorted[1]?.chunk.startPos).toBe(300)
      expect(sorted[2]?.chunk.startPos).toBe(500)
    })
  })
})
