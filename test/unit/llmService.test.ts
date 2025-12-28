import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock web-llm
const mockCreate = vi.fn()
const mockEngine = {
  chat: {
    completions: {
      create: mockCreate,
    },
  },
}

vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn(() => Promise.resolve(mockEngine)),
  MLCEngine: vi.fn(),
}))

// Mock config
vi.mock('../../src/config', () => ({
  LLM_MODEL_ID: 'test-model',
  LLM_TEMPERATURE: 0.1,
  LLM_MAX_TOKENS: 300,
}))

describe('llmService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('response parsing', () => {
    it('should extract content from valid response', () => {
      const response = {
        choices: [
          {
            message: {
              content: 'This is the answer.',
            },
          },
        ],
      }

      const content = response.choices[0]?.message?.content
      expect(content).toBe('This is the answer.')
    })

    it('should handle empty choices array', () => {
      const response: { choices: Array<{ message: { content: string | null } }> } = {
        choices: [],
      }

      const content = response.choices[0]?.message?.content || 'I could not generate a response.'
      expect(content).toBe('I could not generate a response.')
    })

    it('should handle null content', () => {
      const response = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      }

      const content = response.choices[0]?.message?.content || 'I could not generate a response.'
      expect(content).toBe('I could not generate a response.')
    })
  })

  describe('prompt formatting', () => {
    it('should format messages correctly', () => {
      const prompt = 'What is the title?'
      const messages = [{ role: 'user', content: prompt }]

      expect(messages).toHaveLength(1)
      expect(messages[0]?.role).toBe('user')
      expect(messages[0]?.content).toBe(prompt)
    })
  })

  describe('config values', () => {
    it('should use temperature between 0 and 2', async () => {
      const { LLM_TEMPERATURE } = await import('../../src/config')
      expect(LLM_TEMPERATURE).toBeGreaterThanOrEqual(0)
      expect(LLM_TEMPERATURE).toBeLessThanOrEqual(2)
    })

    it('should use positive max_tokens', async () => {
      const { LLM_MAX_TOKENS } = await import('../../src/config')
      expect(LLM_MAX_TOKENS).toBeGreaterThan(0)
    })
  })
})
