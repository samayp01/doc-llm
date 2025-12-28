import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm'
import { LLM_MODEL_ID, LLM_TEMPERATURE, LLM_MAX_TOKENS } from '../config'

// Extend Navigator type for WebGPU
declare global {
  interface Navigator {
    gpu?: {
      requestAdapter(): Promise<unknown>
    }
  }
}

class LLMService {
  private engine: MLCEngine | null = null
  private isInitialized = false
  private initPromise: Promise<void> | null = null

  async initialize(onProgress?: (progress: number, text: string) => void): Promise<void> {
    if (this.isInitialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      onProgress?.(0, 'Checking WebGPU support...')

      // Check for WebGPU support
      if (!navigator.gpu) {
        throw new Error(
          'WebGPU is not supported in this browser. Please use Chrome 113+ or Edge 113+.'
        )
      }

      try {
        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) {
          throw new Error('No WebGPU adapter found. Your GPU may not be supported.')
        }
      } catch (e) {
        throw new Error('WebGPU initialization failed. Please ensure your browser supports WebGPU.')
      }

      onProgress?.(0.1, 'Loading LLM...')
      console.log(`[LLMService] Loading model: ${LLM_MODEL_ID}`)

      try {
        this.engine = await CreateMLCEngine(LLM_MODEL_ID, {
          initProgressCallback: (report) => {
            const progress = Math.max(0.1, report.progress || 0)
            onProgress?.(progress, report.text || 'Loading...')
          },
        })

        this.isInitialized = true
        onProgress?.(1, 'LLM ready')
        console.log(`[LLMService] Model loaded successfully`)
      } catch (error) {
        this.initPromise = null
        console.error(`[LLMService] Failed to load model:`, error)
        throw error
      }
    })()

    return this.initPromise
  }

  reset(): void {
    this.engine = null
    this.isInitialized = false
    this.initPromise = null
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!this.engine) {
      throw new Error('LLM not initialized. Call initialize() first.')
    }

    const response = await this.engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: LLM_TEMPERATURE,
      max_tokens: LLM_MAX_TOKENS,
    })

    return response.choices[0]?.message?.content || 'I could not generate a response.'
  }

  isReady(): boolean {
    return this.isInitialized
  }
}

export const llmService = new LLMService()
