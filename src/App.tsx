import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Github } from 'lucide-react';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentViewer } from './components/DocumentViewer';
import { ChatArea } from './components/ChatArea';
import { DocumentService } from './utils/documentService';
import type { Document, Message } from './types/document';

export default function App() {
  const [document, setDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      const processedDoc = await DocumentService.processFile(file);
      setDocument(processedDoc);
      setMessages([]); // Reset messages when new document is uploaded
    } catch (error) {
      console.error('Error processing document:', error);
    }
  };

  const handleRemoveDocument = () => {
    setDocument(null);
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    if (!document || isGenerating) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setIsGenerating(true);
    try {
      const responseContent = await DocumentService.generateResponse(content, document.content);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="dark">
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <AnimatePresence mode="wait">
          {!document ? (
            <motion.div
              key="upload"
              className="flex-1 flex items-center justify-center"
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
                className="w-3/4 flex-shrink-0"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <DocumentViewer document={document} onRemove={handleRemoveDocument} />
              </motion.div>

              <motion.div
                key="chat"
                className="w-1/4 flex-shrink-0"
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
  );
}
