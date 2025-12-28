import { forwardRef } from 'react'
import { motion } from 'motion/react'
import { User, Sparkles } from 'lucide-react'
import type { Message, RetrievalResult } from '../types/document'

interface ChatMessageProps {
  message: Message
  index: number
  onSourceClick?: (source: RetrievalResult) => void
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message, index, onSourceClick }, ref) => {
    const isUser = message.role === 'user'
    const hasSources = message.sources && message.sources.length > 0

    return (
      <motion.div
        ref={ref}
        className="flex items-start gap-2 hover:bg-secondary/30 -mx-2 px-2 py-2 rounded transition-colors"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.4,
          delay: index * 0.05,
          ease: [0.22, 1, 0.36, 1],
        }}
        layout
      >
        <motion.div
          className={`h-6 w-6 rounded flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
          }`}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300,
            delay: index * 0.05,
          }}
        >
          {isUser ? <User className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
        </motion.div>

        <div className="flex-1 min-w-0 pt-0.5">
          <motion.p
            className="text-xs leading-relaxed whitespace-pre-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
          >
            {message.content}
          </motion.p>

          {hasSources && (
            <motion.div
              className="mt-2 flex items-center gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.4, duration: 0.3 }}
            >
              {message.sources!.map((source, i) => (
                <motion.button
                  key={source.chunk.id}
                  onClick={() => onSourceClick?.(source)}
                  className="text-[10px] text-primary hover:text-primary/80 cursor-pointer transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={`${Math.round(source.score * 100)}% match: ${source.chunk.text.slice(0, 100)}...`}
                >
                  [{i + 1}]
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }
)

ChatMessage.displayName = 'ChatMessage'
