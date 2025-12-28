import { motion } from 'motion/react'
import { FileText, X, FileType, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { PdfRenderer } from './PdfRenderer'
import type { Document, RetrievalResult } from '../types/document'

interface DocumentViewerProps {
  document: Document
  onRemove: () => void
  highlightedSource?: RetrievalResult | null
  isIndexing?: boolean
}

export function DocumentViewer({
  document,
  onRemove,
  highlightedSource,
  isIndexing,
}: DocumentViewerProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isPdf = document.type === 'application/pdf' && document.fileData

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-none px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.div
              className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            >
              <FileText className="h-4 w-4 text-primary" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm truncate">{document.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isIndexing && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Indexing...
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              <FileType className="h-3 w-3 mr-1" />
              {document.type.split('/').pop()?.toUpperCase() || 'DOC'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {formatFileSize(document.size)}
            </Badge>
            {document.pageCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {document.pageCount} pages
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isPdf ? (
          <PdfRenderer
            fileData={document.fileData!}
            highlightText={highlightedSource?.chunk.text}
          />
        ) : (
          <div className="h-full overflow-y-auto bg-zinc-950 p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="whitespace-pre-wrap font-mono text-[13px] leading-[1.6] text-zinc-300"
            >
              {document.content}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
