import * as pdfjsLib from 'pdfjs-dist'
import type { Document, DocumentChunk } from '../types/document'
import { CHUNK_SIZE, CHUNK_OVERLAP, MAX_CHUNKS } from '../config'

// Use unpkg CDN for the worker - it has the latest versions
const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
console.log('[DocumentService] Setting PDF.js worker URL:', workerUrl, '- v2')
console.log('[DocumentService] PDF.js version:', pdfjsLib.version)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export class DocumentService {
  static async processFile(file: File): Promise<Document> {
    console.log('[DocumentService] processFile started:', file.name, file.type, file.size)

    try {
      const originalData = await file.arrayBuffer()
      console.log('[DocumentService] Original data read, size:', originalData.byteLength)

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      console.log('[DocumentService] isPdf:', isPdf)

      // for pdfs, create separate copies for text extraction and rendering to feed to PDF.js
      const dataForExtraction = isPdf ? originalData.slice(0) : originalData
      const dataForRendering = isPdf ? originalData.slice(0) : undefined

      console.log('[DocumentService] dataForExtraction size:', dataForExtraction.byteLength)
      console.log('[DocumentService] dataForRendering size:', dataForRendering?.byteLength ?? 'N/A')

      const { content, pageCount } = await this.extractContent(file, dataForExtraction)
      console.log(
        '[DocumentService] Content extracted, length:',
        content.length,
        'pages:',
        pageCount
      )

      const chunks = this.chunkText(content)
      console.log('[DocumentService] Chunks created:', chunks.length)

      if (dataForRendering) {
        console.log(
          '[DocumentService] dataForRendering after extraction, size:',
          dataForRendering.byteLength
        )
      }

      const doc: Document = {
        id: crypto.randomUUID(),
        name: file.name,
        content,
        type: isPdf ? 'application/pdf' : file.type,
        uploadedAt: new Date(),
        size: file.size,
        pageCount,
        chunks,
        fileData: dataForRendering,
      }

      console.log(
        '[DocumentService] Document created successfully:',
        doc.id,
        'fileData size:',
        doc.fileData?.byteLength ?? 'N/A'
      )
      return doc
    } catch (error) {
      console.error('[DocumentService] processFile error:', error)
      throw error
    }
  }

  private static async extractContent(
    file: File,
    fileData: ArrayBuffer
  ): Promise<{ content: string; pageCount: number }> {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    if (isPdf) {
      return this.extractPdfContent(fileData)
    }

    // For text files, markdown, etc. - use modern File API
    const content = await file.text()

    return {
      content,
      pageCount: Math.ceil(content.split(/\s+/).length / 500),
    }
  }

  private static async extractPdfContent(
    arrayBuffer: ArrayBuffer
  ): Promise<{ content: string; pageCount: number }> {
    console.log('[DocumentService] extractPdfContent started')

    try {
      console.log('[DocumentService] ArrayBuffer size:', arrayBuffer.byteLength)

      // Create a copy of the ArrayBuffer for text extraction
      const bufferCopy = arrayBuffer.slice(0)

      console.log('[DocumentService] Loading PDF document...')
      const pdf = await pdfjsLib.getDocument({ data: bufferCopy }).promise
      console.log('[DocumentService] PDF loaded, pages:', pdf.numPages)

      const textParts: string[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ')
        textParts.push(pageText)
        console.log(
          `[DocumentService] Page ${i}/${pdf.numPages} extracted, chars:`,
          pageText.length
        )
      }

      const content = textParts.join('\n\n')
      console.log('[DocumentService] PDF extraction complete, total chars:', content.length)

      return {
        content,
        pageCount: pdf.numPages,
      }
    } catch (error) {
      console.error('[DocumentService] extractPdfContent error:', error)
      throw error
    }
  }

  static chunkText(text: string): DocumentChunk[] {
    console.log('[DocumentService] chunkText started, text length:', text.length)
    const chunks: DocumentChunk[] = []
    let startPos = 0
    let chunkId = 0

    while (startPos < text.length && chunkId < MAX_CHUNKS) {
      let endPos = startPos + CHUNK_SIZE

      // Try to end at a sentence boundary
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

    console.log('[DocumentService] chunkText complete, chunks:', chunks.length)
    return chunks
  }
}
