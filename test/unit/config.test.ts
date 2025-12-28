import { describe, it, expect } from 'vitest'
import {
  CHUNK_SIZE,
  CHUNK_OVERLAP,
  EMBEDDING_MODEL,
  EMBEDDING_MAX_RETRIES,
  LLM_MODEL_ID,
  LLM_TEMPERATURE,
  LLM_MAX_TOKENS,
  RAG_MAX_SOURCES,
  RAG_RELEVANCE_THRESHOLD,
} from '../../src/config'

describe('config', () => {
  describe('chunking constants', () => {
    it('should have valid CHUNK_SIZE', () => {
      expect(CHUNK_SIZE).toBeGreaterThan(0)
      expect(typeof CHUNK_SIZE).toBe('number')
    })

    it('should have CHUNK_OVERLAP less than CHUNK_SIZE', () => {
      expect(CHUNK_OVERLAP).toBeLessThan(CHUNK_SIZE)
      expect(CHUNK_OVERLAP).toBeGreaterThanOrEqual(0)
    })
  })

  describe('embedding constants', () => {
    it('should have valid EMBEDDING_MODEL', () => {
      expect(EMBEDDING_MODEL).toBeTruthy()
      expect(typeof EMBEDDING_MODEL).toBe('string')
    })

    it('should have valid EMBEDDING_MAX_RETRIES', () => {
      expect(EMBEDDING_MAX_RETRIES).toBeGreaterThan(0)
      expect(EMBEDDING_MAX_RETRIES).toBeLessThanOrEqual(10)
    })
  })

  describe('LLM constants', () => {
    it('should have valid LLM_MODEL_ID', () => {
      expect(LLM_MODEL_ID).toBeTruthy()
      expect(typeof LLM_MODEL_ID).toBe('string')
    })

    it('should have valid LLM_TEMPERATURE', () => {
      expect(LLM_TEMPERATURE).toBeGreaterThanOrEqual(0)
      expect(LLM_TEMPERATURE).toBeLessThanOrEqual(2)
    })

    it('should have valid LLM_MAX_TOKENS', () => {
      expect(LLM_MAX_TOKENS).toBeGreaterThan(0)
    })
  })

  describe('RAG constants', () => {
    it('should have valid RAG_MAX_SOURCES', () => {
      expect(RAG_MAX_SOURCES).toBeGreaterThan(0)
    })

    it('should have valid RAG_RELEVANCE_THRESHOLD', () => {
      expect(RAG_RELEVANCE_THRESHOLD).toBeGreaterThanOrEqual(0)
      expect(RAG_RELEVANCE_THRESHOLD).toBeLessThanOrEqual(1)
    })
  })
})
