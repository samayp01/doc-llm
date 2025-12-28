import { describe, it, expect } from 'vitest'
import { similarity } from 'ml-distance'

describe('RAG Pipeline', () => {
  it('should process document through full pipeline', () => {
    // sample document
    const document = `
      Machine learning is a type of artificial intelligence.
      It allows computers to learn from data without explicit programming.
      Applications include image recognition and natural language processing.
    `.trim()

    const chunkSize = 100
    const chunks: { id: number; text: string }[] = []
    for (let i = 0; i < document.length; i += chunkSize) {
      chunks.push({
        id: chunks.length,
        text: document.slice(i, i + chunkSize).trim(),
      })
    }
    expect(chunks.length).toBeGreaterThan(0)

    const embed = (text: string): number[] => {
      const keywords = ['machine', 'learning', 'data', 'image', 'language']
      return keywords.map((w) => (text.toLowerCase().includes(w) ? 1 : 0))
    }

    const embeddings = new Map<number, number[]>()
    chunks.forEach((c) => embeddings.set(c.id, embed(c.text)))

    const query = 'What is machine learning?'
    const queryVec = embed(query)

    const results = chunks
      .map((chunk) => ({
        chunk,
        score: similarity.cosine(queryVec, embeddings.get(chunk.id)!),
      }))
      .sort((a, b) => b.score - a.score)

    expect(results[0]?.score).toBeGreaterThan(0)
    expect(results[0]?.chunk.text.toLowerCase()).toContain('machine')
  })
})
