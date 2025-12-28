import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { Send } from 'lucide-react'
import { Button } from './ui/button'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export function ChatInput({ onSend, disabled = false, autoFocus = false }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  return (
    <motion.div
      className={`flex items-end gap-2 bg-card rounded-lg p-2 transition-all duration-300 ${
        isFocused ? 'ring-2 ring-primary/50 border-primary' : 'border border-border'
      }`}
      animate={{
        scale: isFocused ? 1.01 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Ask about your document..."
        className="flex-1 bg-transparent resize-none outline-none min-h-[36px] max-h-[200px] py-2 px-2 text-sm placeholder:text-muted-foreground/50"
        rows={1}
        disabled={disabled}
      />

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="h-9 w-9 flex-shrink-0 bg-primary hover:bg-primary/90 transition-all"
        >
          <motion.div
            animate={message.trim() ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Send className="h-4 w-4" />
          </motion.div>
        </Button>
      </motion.div>
    </motion.div>
  )
}
