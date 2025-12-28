import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Github } from 'lucide-react'
import { DocumentUpload } from './components/DocumentUpload'
import { DocumentViewer } from './components/DocumentViewer'
import { ChatArea } from './components/ChatArea'
import { DocumentService } from './utils/documentService'
import type { Document, Message, RetrievalResult } from './types/document'

export default function App() {
  const [document, setDocument] = useState<Document | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)
  const [highlightedSource, setHighlightedSource] = useState<RetrievalResult | null>(null)
  const [modelsReady, setModelsReady] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleFileUpload = async (file: File) => {
    console.log('[App] handleFileUpload called with:', file.name, file.type)

    try {
      console.log('[App] Processing file...')
      const processedDoc = await DocumentService.processFile(file)
      console.log('[App] File processed successfully, setting document state')

      // set doc state for pdf viewer
      setDocument(processedDoc)
      setMessages([])
      setHighlightedSource(null)
      setModelError(null)
      console.log('[App] Document state set, viewer should now be visible')

      if (processedDoc.chunks && processedDoc.chunks.length > 0) {
        console.log('[App] Will initialize models in background...')
        setIsIndexing(true)

        setTimeout(async () => {
          try {
            console.log('[App] Starting model initialization...')
            const { embeddingService } = await import('./utils/embeddingService')
            const { ragService } = await import('./utils/ragService')

            if (!embeddingService.isReady()) {
              console.log('[App] Initializing embedding service...')
              await embeddingService.initialize()
            }

            console.log('[App] Indexing document...')
            await ragService.indexDocument(processedDoc)
            setModelsReady(true)
            console.log('[App] Models ready')
          } catch (e) {
            console.error('[App] Failed to initialize models:', e)
            setModelError(e instanceof Error ? e.message : 'Failed to load AI models')
          } finally {
            setIsIndexing(false)
          }
        }, 100)
      }
    } catch (error) {
      console.error('[App] Error processing document:', error)
      setIsIndexing(false)
    }
  }

  const handleRemoveDocument = async () => {
    setDocument(null)
    setMessages([])
    setHighlightedSource(null)
    setModelError(null)

    try {
      const { ragService } = await import('./utils/ragService')
      ragService.clearIndex()
    } catch (e) {}
  }

  const handleSendMessage = async (content: string) => {
    if (!document || isGenerating) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsGenerating(true)

    try {
      if (!modelsReady) {
        throw new Error(
          'AI models are not loaded. The document viewer works, but chat requires the models to load successfully.'
        )
      }

      const { ragService } = await import('./utils/ragService')
      const { llmService } = await import('./utils/llmService')

      // init llm
      if (!llmService.isReady()) {
        await llmService.initialize()
      }

      const response = await ragService.query(content, 3)

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error generating response:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSourceClick = useCallback((source: RetrievalResult) => {
    setHighlightedSource(source)
  }, [])

  const handleRetryModels = async () => {
    if (!document || isRetrying) return

    setIsRetrying(true)
    setModelError(null)

    try {
      // reset services
      const { embeddingService } = await import('./utils/embeddingService')
      const { llmService } = await import('./utils/llmService')
      const { ragService } = await import('./utils/ragService')

      embeddingService.reset()
      llmService.reset()
      ragService.clearIndex()

      // re initialize
      console.log('[App] Retrying model initialization...')
      await embeddingService.initialize()
      await ragService.indexDocument(document)
      setModelsReady(true)
      console.log('[App] Models ready after retry')
    } catch (e) {
      console.error('[App] Retry failed:', e)
      setModelError(e instanceof Error ? e.message : 'Failed to load AI models')
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="dark">
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <AnimatePresence mode="wait">
          {!document ? (
            <motion.div
              key="upload"
              className="flex-1 flex flex-col items-center justify-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <DocumentUpload onUpload={handleFileUpload} />
            </motion.div>
          ) : (
            <>
              <motion.div
                key="viewer"
                className="w-3/4 h-full flex-shrink-0 overflow-hidden"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <DocumentViewer
                  document={document}
                  onRemove={handleRemoveDocument}
                  highlightedSource={highlightedSource}
                  isIndexing={isIndexing}
                />
              </motion.div>

              <motion.div
                key="chat"
                className="w-1/4 h-full flex-shrink-0 overflow-hidden"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
              >
                <ChatArea
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isGenerating={isGenerating}
                  hasDocument={!!document}
                  documentName={document?.name}
                  onSourceClick={handleSourceClick}
                  modelError={modelError}
                  onRetry={handleRetryModels}
                  isRetrying={isRetrying}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!document && (
            <motion.a
              href="https://github.com/samayp01/DocLLM"
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 1, type: 'spring', damping: 15, stiffness: 200 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="h-5 w-5 text-foreground" />
            </motion.a>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
