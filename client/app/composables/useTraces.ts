export function useTraces() {
  const {
    $traces: traces,
    $spans: spans,
    $clearAllTraces: clearAllTraces,
    $getSpansForTrace: getSpansForTrace,
  } = useNuxtApp()

  return {
    traces,
    spans,
    getSpansForTrace,
    clearAllTraces,
  }
}
