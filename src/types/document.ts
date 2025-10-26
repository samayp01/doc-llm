export interface Document {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadedAt: Date;
  size: number;
  pageCount: number;
  chunks?: DocumentChunk[];
}

export interface DocumentChunk {
  id: number;
  text: string;
  startPos: number;
  endPos: number;
  score?: number;
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
}