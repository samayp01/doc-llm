import { forwardRef } from 'react';
import { motion } from 'motion/react';
import { User, Sparkles } from 'lucide-react';
import type { Message } from '../types/document';

interface ChatMessageProps {
  message: Message;
  index: number;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message, index }, ref) => {
    const isUser = message.role === 'user';

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
          ease: [0.22, 1, 0.36, 1]
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
            delay: index * 0.05
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
        </div>
      </motion.div>
    );
  }
);

ChatMessage.displayName = 'ChatMessage';

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
