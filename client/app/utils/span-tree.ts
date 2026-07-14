import type { Span } from '~~/types'

export interface SpanRowNode {
  span: Span
  depth: number
  offsetPercent: number
  widthPercent: number
  children: SpanRowNode[]

  showChildren: boolean
}
export function spanListToTree(spans: Span[]): SpanRowNode[] {
  const spanMap = new Map<string, Span>()
  const childrenMap = new Map<string | null, Span[]>()

  // 1. Build maps for easy parent/child lookup without structural mutation
  for (const span of spans) {
    spanMap.set(span.span_id, span)
    const parentId = span.parent_span_id
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, [])
    }
    childrenMap.get(parentId)!.push(span)
  }

  // 2. Identify and sort root spans
  const rootSpans = spans.filter(span => !span.parent_span_id || !spanMap.has(span.parent_span_id))
  rootSpans.sort((a, b) => a.start_time - b.start_time)

  // 3. Compute trace bounds for percentage calculations
  const traceStart = rootSpans?.[0]?.start_time || 0
  const traceEnd = spans.reduce((max, s) => Math.max(max, s.end_time), 0)
  const traceDuration = Math.max(traceEnd - traceStart, 1)

  const roots: SpanRowNode[] = []

  // 4. Depth-First Traversal to build the nested immutable tree nodes
  function traverse(span: Span, depth: number): SpanRowNode {
    const offsetPercent = ((span.start_time - traceStart) / traceDuration) * 100
    const widthPercent = (span.duration / traceDuration) * 100

    // Get child spans and sort them by start time
    const childSpans = childrenMap.get(span.span_id) || []
    childSpans.sort((a, b) => a.start_time - b.start_time)

    // Recursively process child spans into NewSpanTreeNode objects
    const childrenNodes: SpanRowNode[] = []
    for (const child of childSpans) {
      childrenNodes.push(traverse(child, depth + 1))
    }

    // Return the completely formed, immutable tree node
    return {
      span: { ...span }, // Shallow clone the span data to prevent external mutation
      depth,
      offsetPercent: Math.max(0, offsetPercent),
      widthPercent: Math.max(0.5, widthPercent),
      children: childrenNodes,
      showChildren: true,
    }
  }

  // 5. Build the tree structure starting from the roots
  for (const rootSpan of rootSpans) {
    roots.push(traverse(rootSpan, 0))
  }

  return roots
}
