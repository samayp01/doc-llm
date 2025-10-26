import type { Document } from '../types/document';

export class DocumentService {
  static async processFile(file: File): Promise<Document> {
    const content = await this.extractContent(file);
    
    return {
      id: crypto.randomUUID(),
      name: file.name,
      content,
      type: file.type,
      uploadedAt: new Date(),
      size: file.size,
      pageCount: this.estimatePageCount(content),
    };
  }

  private static async extractContent(file: File): Promise<string> {
    // TODO: Implement more robust content extraction based on file type
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      reader.readAsText(file);
    });
  }

  private static estimatePageCount(content: string): number {
    // Rough estimate: ~500 words per page
    const words = content.split(/\s+/).length;
    return Math.ceil(words / 500);
  }

  static generateResponse(query: string, documentContent: string): Promise<string> {
    // TODO: Simulate RAG processing
    return new Promise((resolve) => {
      setTimeout(() => {
        // TODO: Mock intelligent responses based on the query
        const responses = [
          `Based on the document, ${this.generateContextualAnswer(query, documentContent)}`,
          `The document indicates that ${this.generateContextualAnswer(query, documentContent)}`,
          `According to the information provided, ${this.generateContextualAnswer(query, documentContent)}`,
        ];
        
        resolve(responses[Math.floor(Math.random() * responses.length)]);
      }, 1000 + Math.random() * 1000);
    });
  }

  private static generateContextualAnswer(query: string, content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    const queryWords = query.toLowerCase().split(/\s+/);
    const relevantSentences = sentences.filter(sentence => {
      const sentenceLower = sentence.toLowerCase();
      return queryWords.some(word => word.length > 3 && sentenceLower.includes(word));
    });

    if (relevantSentences.length > 0) {
      const randomSentence = relevantSentences[Math.floor(Math.random() * relevantSentences.length)];
      return randomSentence.trim() + '.';
    }

    // Fallback response
    return 'the information in the document addresses this topic. Would you like me to elaborate on any specific aspect?';
  }
}
