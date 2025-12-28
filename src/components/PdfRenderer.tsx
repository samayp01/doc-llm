import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'
import { Button } from './ui/button'

// Ensure worker is set
const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

interface PdfRendererProps {
  fileData: ArrayBuffer
  highlightText?: string
  onPageChange?: (page: number, total: number) => void
}

export function PdfRenderer({ fileData, highlightText, onPageChange }: PdfRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renderingProgress, setRenderingProgress] = useState(0)

  // Load the PDF document
  useEffect(() => {
    let cancelled = false

    const loadPdf = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if fileData is valid
        if (!fileData || fileData.byteLength === 0) {
          throw new Error('Invalid or empty PDF data')
        }

        console.log('[PdfRenderer] Loading PDF, fileData size:', fileData.byteLength)

        // Create a copy of the ArrayBuffer to avoid consumption issues
        const dataCopy = new Uint8Array(fileData).slice().buffer
        console.log('[PdfRenderer] Created buffer copy, size:', dataCopy.byteLength)

        const loadingTask = pdfjsLib.getDocument({ data: dataCopy })
        const pdf = await loadingTask.promise

        if (cancelled) return

        console.log('[PdfRenderer] PDF loaded successfully, pages:', pdf.numPages)
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
        setIsLoading(false)
      } catch (err) {
        if (cancelled) return
        console.error('[PdfRenderer] Error loading PDF:', err)
        setError(err instanceof Error ? err.message : 'Failed to load PDF')
        setIsLoading(false)
      }
    }

    loadPdf()

    return () => {
      cancelled = true
    }
  }, [fileData])

  // Render all pages when PDF is loaded
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return

    let cancelled = false

    const renderAllPages = async () => {
      const container = containerRef.current
      if (!container) return

      // Clear previous content
      container.innerHTML = ''

      // Use device pixel ratio for sharp rendering
      const pixelRatio = window.devicePixelRatio || 1

      console.log(
        '[PdfRenderer] Rendering',
        totalPages,
        'pages at scale',
        scale,
        'pixelRatio',
        pixelRatio
      )

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (cancelled) break

        try {
          const page = await pdfDoc.getPage(pageNum)
          const viewport = page.getViewport({ scale })

          // Create canvas for this page with high DPI
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) continue

          // Set actual size in memory (scaled for DPI)
          canvas.width = viewport.width * pixelRatio
          canvas.height = viewport.height * pixelRatio

          // Set display size (CSS pixels)
          canvas.style.width = `${viewport.width}px`
          canvas.style.height = `${viewport.height}px`

          // Scale context to match DPI
          context.scale(pixelRatio, pixelRatio)

          // Create page wrapper with relative positioning for text layer
          const pageWrapper = document.createElement('div')
          pageWrapper.className =
            'pdf-page mb-4 shadow-lg rounded-lg overflow-hidden bg-white relative'
          pageWrapper.dataset.page = String(pageNum)
          pageWrapper.style.width = `${viewport.width}px`
          pageWrapper.style.height = `${viewport.height}px`

          pageWrapper.appendChild(canvas)

          // Create text layer for selection
          const textLayerDiv = document.createElement('div')
          textLayerDiv.className = 'absolute top-0 left-0 w-full h-full overflow-hidden opacity-25'
          textLayerDiv.style.pointerEvents = 'all'
          pageWrapper.appendChild(textLayerDiv)

          container.appendChild(pageWrapper)

          // Render the canvas
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise

          // Render text layer for selection
          const textContent = await page.getTextContent()
          const textItems = textContent.items as Array<{
            str: string
            transform: number[]
            width: number
            height: number
          }>

          textItems.forEach((item) => {
            if (!item.str.trim()) return

            const tx = item.transform
            const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1])
            const x = tx[4] * scale
            const y = (viewport.height / scale - tx[5]) * scale - fontSize * scale
            const width = item.width * scale
            const height = fontSize * scale

            const span = document.createElement('span')
            span.textContent = item.str
            // Store position data for highlighting
            span.dataset.x = String(x)
            span.dataset.y = String(y)
            span.dataset.w = String(width || fontSize * item.str.length * 0.6)
            span.dataset.h = String(height)
            span.style.cssText = `
              position: absolute;
              left: ${x}px;
              top: ${y}px;
              font-size: ${fontSize * scale}px;
              font-family: sans-serif;
              color: transparent;
              white-space: pre;
              transform-origin: left bottom;
              user-select: text;
              cursor: text;
            `
            textLayerDiv.appendChild(span)
          })

          setRenderingProgress(Math.round((pageNum / totalPages) * 100))
          console.log(`[PdfRenderer] Rendered page ${pageNum}/${totalPages}`)
        } catch (err) {
          console.error(`[PdfRenderer] Error rendering page ${pageNum}:`, err)
        }
      }

      if (!cancelled) {
        setRenderingProgress(100)
      }
    }

    renderAllPages()

    return () => {
      cancelled = true
    }
  }, [pdfDoc, totalPages, scale])

  // Track scroll position to update current page
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || totalPages === 0) return

    const handleScroll = () => {
      const pages = containerRef.current?.querySelectorAll('.pdf-page')
      if (!pages || pages.length === 0) return

      const containerRect = scrollContainer.getBoundingClientRect()
      const containerMiddle = containerRect.top + containerRect.height / 3

      let visiblePage = 1
      pages.forEach((page) => {
        const rect = page.getBoundingClientRect()
        if (rect.top <= containerMiddle && rect.bottom > containerRect.top) {
          visiblePage = parseInt(page.getAttribute('data-page') || '1')
        }
      })

      setCurrentPage(visiblePage)
      onPageChange?.(visiblePage, totalPages)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    // Initial check
    handleScroll()

    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [totalPages, onPageChange])

  // Highlight and scroll to text when highlightText changes
  useEffect(() => {
    if (!highlightText || !containerRef.current) return

    // Clear previous highlights
    const prevHighlights = containerRef.current.querySelectorAll('.highlight-overlay')
    prevHighlights.forEach((el: Element) => el.remove())

    // Get unique significant words from the source text (first ~50 chars for precise matching)
    const sourceStart = highlightText
      .slice(0, 80)
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
    const searchWords = [...new Set(sourceStart.split(/\s+/).filter((w) => w.length > 4))].slice(
      0,
      5
    )

    if (searchWords.length === 0) return

    // Find the page and spans that best match
    const pages = containerRef.current.querySelectorAll('.pdf-page')
    let bestMatch: { page: Element; spans: HTMLElement[]; score: number } | null = null

    for (const page of pages) {
      const allSpans = Array.from(page.querySelectorAll('span')) as HTMLElement[]

      // Build page text and find best matching region
      for (let startIdx = 0; startIdx < allSpans.length; startIdx++) {
        // Look at a window of consecutive spans (roughly a sentence)
        const windowSize = Math.min(15, allSpans.length - startIdx)
        const windowSpans = allSpans.slice(startIdx, startIdx + windowSize)
        const windowText = windowSpans
          .map((s) => s.textContent || '')
          .join(' ')
          .toLowerCase()

        // Count how many search words appear in this window
        const matchCount = searchWords.filter((w) => windowText.includes(w)).length

        if (matchCount >= 2 && (!bestMatch || matchCount > bestMatch.score)) {
          // Find which spans in the window actually contain matches
          const matchingSpans = windowSpans.filter((span) => {
            const text = (span.textContent || '').toLowerCase()
            return searchWords.some((w) => text.includes(w))
          })

          if (matchingSpans.length > 0) {
            bestMatch = { page, spans: matchingSpans.slice(0, 8), score: matchCount }
          }
        }
      }

      // If we found a good match on this page, stop searching
      if (bestMatch && bestMatch.score >= 3) break
    }

    if (bestMatch && scrollContainerRef.current) {
      const { page, spans } = bestMatch
      const highlightElements: HTMLElement[] = []
      const animationIntervals: number[] = []

      spans.forEach((span) => {
        const pageWrapper = span.closest('.pdf-page') as HTMLElement
        if (!pageWrapper) return

        // Use stored position data
        const x = parseFloat(span.dataset.x || '0')
        const y = parseFloat(span.dataset.y || '0')
        const w = parseFloat(span.dataset.w || '50')
        const h = parseFloat(span.dataset.h || '12')

        const highlight = document.createElement('div')
        highlight.className = 'highlight-overlay'
        highlight.style.cssText = `
          position: absolute;
          left: ${x - 2}px;
          top: ${y - 2}px;
          width: ${w + 4}px;
          height: ${h + 4}px;
          background-color: rgba(251, 191, 36, 0.6);
          pointer-events: none;
          z-index: 10;
          border-radius: 3px;
        `

        pageWrapper.appendChild(highlight)
        highlightElements.push(highlight)

        // Animate
        let opacity = 0.6
        let increasing = false
        const animateHighlight = () => {
          if (increasing) {
            opacity += 0.04
            if (opacity >= 0.6) increasing = false
          } else {
            opacity -= 0.04
            if (opacity <= 0.25) increasing = true
          }
          highlight.style.backgroundColor = `rgba(251, 191, 36, ${opacity})`
        }
        const interval = window.setInterval(animateHighlight, 50)
        animationIntervals.push(interval)
      })

      // Scroll to the matched page
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top
      const pageTop = page.getBoundingClientRect().top
      const firstHighlightY = highlightElements[0] ? parseFloat(highlightElements[0].style.top) : 0
      const scrollOffset =
        scrollContainerRef.current.scrollTop + (pageTop - containerTop) + firstHighlightY - 120
      scrollContainerRef.current.scrollTo({ top: scrollOffset, behavior: 'smooth' })

      // Remove highlights after 4 seconds
      setTimeout(() => {
        animationIntervals.forEach((interval) => clearInterval(interval))
        highlightElements.forEach((el) => el.remove())
      }, 4000)
    }
  }, [highlightText])

  const goToPage = (page: number) => {
    const scrollContainer = scrollContainerRef.current
    const pageElement = containerRef.current?.querySelector(`[data-page="${page}"]`) as HTMLElement
    if (scrollContainer && pageElement) {
      // Calculate the offset within the scroll container
      const containerTop = scrollContainer.getBoundingClientRect().top
      const pageTop = pageElement.getBoundingClientRect().top
      const scrollOffset = scrollContainer.scrollTop + (pageTop - containerTop) - 16 // 16px padding
      scrollContainer.scrollTo({ top: scrollOffset, behavior: 'smooth' })
    }
  }

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3))
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5))

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-muted-foreground text-sm">Loading PDF...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
        <div className="text-destructive text-sm">Failed to load PDF</div>
        <div className="text-muted-foreground text-xs">{error}</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* PDF Controls */}
      <div className="flex-none flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {renderingProgress < 100 && (
            <span className="text-xs text-muted-foreground">Rendering {renderingProgress}%</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={zoomIn}
            disabled={scale >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Pages Container */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto bg-zinc-800 p-4">
        <div ref={containerRef} className="flex flex-col items-center gap-4" />
      </div>
    </div>
  )
}
