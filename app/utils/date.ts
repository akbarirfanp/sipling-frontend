export function formatDate(dateStr: string): string {
  if (!dateStr)
    return '-'

  const date = new Date(dateStr)
  return date.toLocaleString('en-EN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
