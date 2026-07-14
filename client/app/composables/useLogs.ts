export function useLogs() {
  const { $logs: logs, $clearAllLogs: clearAllLogs } = useNuxtApp()

  return {
    logs,
    clearAllLogs,
  }
}
