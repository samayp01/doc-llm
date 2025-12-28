<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.4-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/WebGPU-Enabled-green?style=flat-square" alt="WebGPU" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
</p>

<h1 align="center">DocLLM</h1>

<p align="center">
  <strong>A private, browser-based PDF viewer with RAG-powered document Q&A.</strong>
  <br />
  All AI processing happens locally in your browser. Your documents never leave your device.
</p>

---

## Overview

DocLLM lets you upload PDFs and ask questions about them using AI completely offline. It combines a modern PDF viewer with a Retrieval-Augmented Generation (RAG) pipeline that runs entirely in your browser using WebGPU acceleration.

**Key Features:**
- **100% Private** — Documents are processed locally; nothing is sent to any server
- **Offline-Capable** — Works without internet after initial model download
- **GPU-Accelerated** — Uses WebGPU for fast LLM inference
- **Source Citations** — Every answer includes clickable references to the source text
- **PDF Highlighting** — Click a citation to highlight and scroll to that section

---

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────▶│   Chunking   │────▶│  Embedding  │────▶│   Index     │
│    PDF      │     │  (800 char)  │     │ (MiniLM-L6) │     │  (Vector)   │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
                                                                   │
┌─────────────┐     ┌──────────────┐     ┌─────────────┐           │
│   Answer    │◀────│     LLM      │◀────│  Retrieval  │◀──────────┘
│  + Sources  │     │ (Llama 3.2)  │     │   (Top-K)   │
└─────────────┘     └──────────────┘     └─────────────┘
```

1. **Upload** — Drop a PDF or text file
2. **Chunk** — Document is split into overlapping 800-character segments
3. **Embed** — Each chunk is converted to a 384-dimensional vector
4. **Index** — Vectors are stored in memory for fast similarity search
5. **Query** — Your question is embedded and matched against chunks
6. **Generate** — Top matches are passed to the LLM for answer generation

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI framework |
| **Styling** | Tailwind CSS + Radix UI | Design system |
| **Build** | Vite | Bundler & dev server |
| **PDF** | PDF.js | Rendering & text extraction |
| **Embeddings** | Transformers.js | Browser-side vector embeddings |
| **LLM** | WebLLM (MLC-AI) | GPU-accelerated inference |
| **Similarity** | ml-distance | Cosine similarity calculation |
| **Testing** | Vitest | Unit & integration tests |

**Models:**
- **Embeddings:** `Xenova/all-MiniLM-L6-v2` (~80MB, 384 dimensions)
- **LLM:** `Llama-3.2-1B-Instruct-q4f16_1-MLC` (~700MB, 4-bit quantized)

---

## Requirements

- **Browser:** Chrome 113+ or Edge 113+ (WebGPU required)
- **GPU:** Any modern discrete or integrated GPU
- **RAM:** 4GB+ available
- **Storage:** ~1GB for model cache

---

## Getting Started

### Installation

```bash
git clone https://github.com/yourusername/docllm.git
cd docllm
npm install
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

Outputs to `dist/` directory.

### Docker

```bash
docker build -t docllm .
docker run -p 3000:3000 docllm
```

---

## Architecture

### RAG Pipeline

The RAG service (`ragService.ts`) orchestrates the entire flow:

1. **Indexing Phase**
   - Receives chunked document from DocumentService
   - Embeds all chunks via EmbeddingService
   - Stores vectors in a Map for O(1) lookup

2. **Query Phase**
   - Embeds the user's question
   - Computes cosine similarity against all chunks
   - Filters by relevance threshold
   - Applies smart heuristics:
     - Results questions → include abstract + conclusion
     - Metadata questions → prioritize first chunks
   - Passes top chunk to LLM with prompt
   - Returns answer + source references

### Service Layer

```
┌─────────────────────────────────────────────────────────┐
│                        App.tsx                          │
│                   (State Management)                    │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ ragService    │   │ documentSvc   │   │ Components    │
│ (orchestrator)│   │ (PDF + chunk) │   │ (UI layer)    │
└───────────────┘   └───────────────┘   └───────────────┘
        │
        ├──────────────────┐
        ▼                  ▼
┌───────────────┐   ┌───────────────┐
│ embeddingSvc  │   │ llmService    │
│ (vectors)     │   │ (inference)   │
└───────────────┘   └───────────────┘
```

---

## Privacy

DocLLM is designed with privacy as a core principle:

- **No telemetry** — Zero analytics or tracking
- **No server** — All processing is client-side
- **No storage** — Documents are not persisted
- **No network** — After model download, works offline

Your documents never leave your browser.

---

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Model download | 30-60s | One-time, cached |
| Document indexing | 1-3s | Depends on length |
| Query response | 2-5s | GPU-dependent |
| PDF rendering | <1s | All pages |

---

## Limitations

- **WebGPU Required** — Only works in Chrome/Edge 113+
- **Memory Usage** — Large documents may consume significant RAM
- **Model Size** — ~1GB download on first run
- **Single Document** — One document at a time (for now)

---

## License

MIT

---
