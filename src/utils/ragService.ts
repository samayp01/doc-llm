import { embeddingService } from './embeddingService'
import { llmService } from './llmService'
import type { Document, RetrievalResult } from '../types/document'
import { RAG_MAX_SOURCES, RAG_RELEVANCE_THRESHOLD } from '../config'

export interface RAGResponse {
  answer: string
  sources: RetrievalResult[]
}

class RAGService {
  private documentEmbeddings: Map<number, number[]> = new Map()
  private currentDocument: Document | null = null

  async indexDocument(
    document: Document,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<void> {
    if (!document.chunks || document.chunks.length === 0) {
      throw new Error('Document has no chunks to index')
    }

    this.currentDocument = document

    // Embed all chunks
    this.documentEmbeddings = await embeddingService.embedChunks(
      document.chunks,
      (current, total) => {
        onProgress?.('Indexing document', current / total)
      }
    )
  }

  async query(question: string, maxSources: number = RAG_MAX_SOURCES): Promise<RAGResponse> {
    if (!this.currentDocument?.chunks) {
      throw new Error('No document indexed')
    }

    const lowerQuestion = question.toLowerCase()

    // Detect question types that need special handling
    const isResultsQuestion =
      lowerQuestion.includes('result') ||
      lowerQuestion.includes('finding') ||
      lowerQuestion.includes('conclusion') ||
      lowerQuestion.includes('success') ||
      lowerQuestion.includes('accuracy') ||
      lowerQuestion.includes('performance') ||
      lowerQuestion.includes('outcome') ||
      lowerQuestion.includes('percent') ||
      lowerQuestion.includes('%') ||
      lowerQuestion.includes('final')

    const isMetadataQuestion =
      lowerQuestion.includes('title') ||
      lowerQuestion.includes('author') ||
      lowerQuestion.includes('abstract') ||
      lowerQuestion.includes('written by') ||
      lowerQuestion.includes('who wrote') ||
      lowerQuestion.includes('what is this') ||
      lowerQuestion.includes('what is the paper')

    // Find relevant chunks - get more for better coverage
    const allRelevantChunks = await embeddingService.findRelevantChunks(
      question,
      this.currentDocument.chunks,
      this.documentEmbeddings,
      maxSources + 2
    )

    // Use lower threshold to include more potentially relevant chunks
    const relevantChunks = allRelevantChunks.filter((r) => r.score > RAG_RELEVANCE_THRESHOLD)

    // Take the best chunks
    let sourcesToUse =
      relevantChunks.length > 0
        ? relevantChunks.slice(0, maxSources)
        : allRelevantChunks.slice(0, 3)

    // For results/conclusions questions, also include chunks from end of document
    if (isResultsQuestion && this.currentDocument.chunks.length > 3) {
      const lastChunks = this.currentDocument.chunks.slice(-3)
      const abstractChunks = this.currentDocument.chunks.slice(0, 2)

      // Add abstract chunks (often contain summary of results)
      for (const chunk of abstractChunks) {
        if (!sourcesToUse.some((s) => s.chunk.id === chunk.id)) {
          sourcesToUse.push({ chunk, score: 0.8 })
        }
      }

      // Add conclusion chunks
      for (const chunk of lastChunks) {
        if (!sourcesToUse.some((s) => s.chunk.id === chunk.id)) {
          sourcesToUse.push({ chunk, score: 0.75 })
        }
      }
    }

    // For metadata questions, prioritize first chunks (title, abstract, authors)
    if (isMetadataQuestion && this.currentDocument.chunks.length > 0) {
      const firstChunks = this.currentDocument.chunks.slice(0, 2)
      // Replace sources with first chunks for metadata questions - they have the answer
      sourcesToUse = firstChunks.map((chunk) => ({ chunk, score: 0.95 }))
    }

    // Limit total sources to maxSources and sort by document position
    sourcesToUse = sourcesToUse.slice(0, maxSources)
    const sortedSources = [...sourcesToUse].sort((a, b) => a.chunk.startPos - b.chunk.startPos)

    // Only use the top source for context to reduce confusion
    // The LLM works better with focused context rather than a pool of text
    const topSource = sortedSources[0]
    const context = topSource ? topSource.chunk.text : ''

    // Build prompt with document name for context
    const prompt = this.buildPrompt(question, context, this.currentDocument.name)

    // Log for debugging
    console.log('[RAGService] Context being sent to LLM:')
    console.log('--- CONTEXT START ---')
    console.log(context)
    console.log('--- CONTEXT END ---')
    console.log('[RAGService] Question:', question)

    // Generate response
    const answer = await llmService.generateResponse(prompt)

    return {
      answer,
      sources: sourcesToUse,
    }
  }

  private buildPrompt(question: string, context: string, _documentName: string): string {
    return `You are a document assistant. Below is text extracted directly from the user's document.

Document text:
${context}

User question: ${question}

Answer confidently and directly based on the document text above. Do not say "I don't have information" - the answer is in the text.`
  }

  clearIndex(): void {
    this.documentEmbeddings.clear()
    this.currentDocument = null
  }

  isDocumentIndexed(): boolean {
    return this.documentEmbeddings.size > 0
  }
}

export const ragService = new RAGService()
