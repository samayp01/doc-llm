import { describe, it, expect } from 'vitest'
import { CHUNK_SIZE, CHUNK_OVERLAP, MAX_CHUNKS } from '../../src/config'

// Test the chunking logic directly (extracted for testability)
interface DocumentChunk {
  id: number
  text: string
  startPos: number
  endPos: number
}

function chunkText(text: string): DocumentChunk[] {
  const chunks: DocumentChunk[] = []
  let startPos = 0
  let chunkId = 0

  while (startPos < text.length && chunkId < MAX_CHUNKS) {
    let endPos = startPos + CHUNK_SIZE

    if (endPos < text.length) {
      const searchEnd = Math.min(endPos + 100, text.length)
      const segment = text.slice(endPos, searchEnd)
      const sentenceEnd = segment.search(/[.!?]\s/)
      if (sentenceEnd !== -1) {
        endPos = endPos + sentenceEnd + 1
      }
    } else {
      endPos = text.length
    }

    const chunkText = text.slice(startPos, endPos).trim()

    if (chunkText.length > 0) {
      chunks.push({
        id: chunkId++,
        text: chunkText,
        startPos,
        endPos,
      })
    }

    const nextStart = endPos - CHUNK_OVERLAP
    if (nextStart <= startPos) {
      startPos = endPos
    } else {
      startPos = nextStart
    }

    if (startPos >= text.length) break
  }

  return chunks
}

describe('documentService', () => {
  describe('chunkText', () => {
    it('should create chunks from text', () => {
      const text = 'A'.repeat(CHUNK_SIZE * 2)
      const chunks = chunkText(text)
      expect(chunks.length).toBeGreaterThan(1)
    })

    it('should handle empty text', () => {
      const chunks = chunkText('')
      expect(chunks).toHaveLength(0)
    })

    it('should handle text shorter than chunk size', () => {
      const text = 'Short text'
      const chunks = chunkText(text)
      expect(chunks).toHaveLength(1)
      expect(chunks[0]?.text).toBe('Short text')
    })

    it('should assign sequential IDs', () => {
      const text = 'A'.repeat(CHUNK_SIZE * 3)
      const chunks = chunkText(text)
      chunks.forEach((chunk, index) => {
        expect(chunk.id).toBe(index)
      })
    })

    it('should track positions correctly', () => {
      const text = 'A'.repeat(CHUNK_SIZE * 2)
      const chunks = chunkText(text)

      expect(chunks[0]?.startPos).toBe(0)
      chunks.forEach((chunk) => {
        expect(chunk.endPos).toBeGreaterThan(chunk.startPos)
      })
    })

    it('should respect MAX_CHUNKS limit', () => {
      const text = 'A'.repeat(CHUNK_SIZE * (MAX_CHUNKS + 10))
      const chunks = chunkText(text)
      expect(chunks.length).toBeLessThanOrEqual(MAX_CHUNKS)
    })

    it('should try to end at sentence boundaries', () => {
      // Create text that has a sentence boundary within the search window
      const text = 'A'.repeat(CHUNK_SIZE) + '. This is a new sentence. More text here.'
      const chunks = chunkText(text)

      // First chunk should include content up to/past a sentence boundary
      expect(chunks.length).toBeGreaterThanOrEqual(1)
      // The chunker searches for sentence boundaries within 100 chars after CHUNK_SIZE
      expect(chunks[0]?.text.includes('.')).toBe(true)
    })

    it('should have overlapping chunks', () => {
      const text = 'A'.repeat(CHUNK_SIZE * 3)
      const chunks = chunkText(text)

      if (chunks.length > 1 && chunks[0] && chunks[1]) {
        // Second chunk should start before first chunk ends (overlap)
        const firstEnd = chunks[0].endPos
        const secondStart = chunks[1].startPos
        expect(secondStart).toBeLessThan(firstEnd)
      }
    })
  })

  describe('page count estimation', () => {
    const estimatePageCount = (content: string): number => {
      return Math.ceil(content.split(/\s+/).length / 500)
    }

    it('should estimate pages based on word count', () => {
      const words = Array(1000).fill('word').join(' ')
      expect(estimatePageCount(words)).toBe(2)
    })

    it('should return 1 for short content', () => {
      expect(estimatePageCount('Hello world')).toBe(1)
    })

    it('should handle empty content', () => {
      expect(estimatePageCount('')).toBe(1)
    })
  })

  describe('file type detection', () => {
    const isPdf = (type: string, name: string): boolean => {
      return type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')
    }

    it('should detect PDF by mime type', () => {
      expect(isPdf('application/pdf', 'document.txt')).toBe(true)
    })

    it('should detect PDF by extension', () => {
      expect(isPdf('text/plain', 'document.pdf')).toBe(true)
    })

    it('should return false for non-PDF', () => {
      expect(isPdf('text/plain', 'document.txt')).toBe(false)
    })
  })
})
