import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import type { Chat } from '../types/chat'

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
}

export function ChatSidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: ChatSidebarProps) {
  return (
    <aside className="w-64 bg-[#1a1d29] border-r border-border flex flex-col h-screen">
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewChat}
          className="w-full bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02]"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
          >
            {chats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectChat(chat.id)}
                className={`
                  group flex items-center gap-2 px-3 py-2.5 rounded cursor-pointer
                  transition-all duration-200 mb-1
                  ${
                    currentChatId === chat.id
                      ? 'bg-primary/20 text-white scale-[1.02]'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:scale-[1.01]'
                  }
                `}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{chat.title || 'Untitled'}</span>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1, opacity: 1 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteChat(chat.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </ScrollArea>
    </aside>
  )
}
