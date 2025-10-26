export interface Document {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadedAt: Date;
  size: number;
  pageCount?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
