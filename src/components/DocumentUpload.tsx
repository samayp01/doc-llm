import { useCallback } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, File } from 'lucide-react';
import { Button } from './ui/button';

interface DocumentUploadProps {
  onUpload: (file: File) => void;
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && isValidFileType(file)) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFileType(file)) {
      onUpload(file);
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.txt') || file.name.endsWith('.md');
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        className="w-full max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors bg-card/30"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <motion.div
            className="inline-flex h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center mx-auto mb-6"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Upload className="h-10 w-10 text-primary" />
          </motion.div>

          <h2 className="text-2xl mb-3">Upload a Document</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Drop your PDF, TXT, DOCX, or Markdown file here, or click to browse. Start asking
            questions about your document instantly.
          </p>

          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.txt,.docx,.md"
            onChange={handleFileInput}
          />

          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Choose File
            </label>
          </Button>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Supported formats:</p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <File className="h-3 w-3" />
                PDF
              </div>
              <div className="flex items-center gap-1">
                <File className="h-3 w-3" />
                TXT
              </div>
              <div className="flex items-center gap-1">
                <File className="h-3 w-3" />
                DOCX
              </div>
              <div className="flex items-center gap-1">
                <File className="h-3 w-3" />
                MD
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
