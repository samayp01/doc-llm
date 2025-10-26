import { MLCEngine, CreateMLCEngine } from "@mlc-ai/web-llm";

class LLMService {
  private engine: MLCEngine | null = null;
  private isInitialized: boolean = false;

  async initialize(onProgress?: (progress: number, text: string) => void): Promise<void> {
    if (this.isInitialized) return;

    this.engine = await CreateMLCEngine(
      process.env.MODEL_ID || 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
      { initProgressCallback: (report) => {
          if (onProgress) {
            onProgress(report.progress || 0, report.text || '');
          }
        },
      }
    );

    this.isInitialized = true;
  }

  async generateResponse(prompt: string, onToken?: (token: string) => void): Promise<string> {
    if (!this.engine) {
      throw new Error("Model not initialized.");
    }
    
    const response = await this.engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 512,
    });
    
    return response.choices[0]?.message?.content || '';
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}