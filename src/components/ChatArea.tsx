import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, BookOpen, RefreshCw } from 'lucide-react'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import type { Message, RetrievalResult } from '../types/document'

interface ChatAreaProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  isGenerating: boolean
  hasDocument: boolean
  documentName?: string
  onSourceClick?: (source: RetrievalResult) => void
  modelError?: string | null
  onRetry?: () => void
  isRetrying?: boolean
}

export function ChatArea({
  messages,
  onSendMessage,
  isGenerating,
  hasDocument,
  documentName,
  onSourceClick,
  modelError,
  onRetry,
  isRetrying,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const hasMessages = messages.length > 0

  if (!hasDocument) {
    return <EmptyState />
  }

  if (!hasMessages) {
    return (
      <WelcomeScreen
        onSendMessage={onSendMessage}
        isGenerating={isGenerating}
        documentName={documentName}
        modelError={modelError}
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    )
  }

  return (
    <motion.div
      className="h-full flex flex-col border-l border-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  index={index}
                  onSourceClick={onSourceClick}
                />
              ))}
            </AnimatePresence>
            {isGenerating && <GeneratingIndicator />}
            <div ref={messagesEndRef} />
          </motion.div>
        </div>
      </div>

      <div className="border-t border-border bg-card p-3">
        <ChatInput onSend={onSendMessage} disabled={isGenerating} />
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center p-6 border-l border-border">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="inline-flex h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center mx-auto mb-4"
          animate={{
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <BookOpen className="h-7 w-7 text-primary" />
        </motion.div>
        <h3 className="text-sm mb-2 text-muted-foreground">No Document</h3>
        <p className="text-xs text-muted-foreground">Upload a file to begin</p>
      </motion.div>
    </div>
  )
}

function WelcomeScreen({
  onSendMessage,
  isGenerating,
  documentName,
  modelError,
  onRetry,
  isRetrying,
}: {
  onSendMessage: (content: string) => void
  isGenerating: boolean
  documentName?: string
  modelError?: string | null
  onRetry?: () => void
  isRetrying?: boolean
}) {
  return (
    <div className="h-full flex flex-col border-l border-border">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          className="w-full space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.div
              className="inline-flex h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center mx-auto"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            >
              <Sparkles className="h-7 w-7 text-primary" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-lg mb-2">Ask Questions</h2>
              <p className="text-xs text-muted-foreground">Query your document with AI</p>
            </motion.div>

            {modelError && (
              <motion.div
                className="text-xs text-amber-500 bg-amber-500/10 rounded p-3 mt-2 space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p>AI chat unavailable: Models failed to load</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded text-amber-400 transition-colors mx-auto"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
                    {isRetrying ? 'Retrying...' : 'Retry'}
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>

      <div className="border-t border-border bg-card p-3">
        <ChatInput onSend={onSendMessage} disabled={isGenerating || !!modelError} autoFocus />
      </div>
    </div>
  )
}

function GeneratingIndicator() {
  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Sparkles className="h-4 w-4 text-primary" />
      </motion.div>
      <div className="flex-1 bg-card border border-border rounded-lg p-4">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
