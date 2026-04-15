export const DEFAULT_DOCUMENT_TITLE = 'Evolutionary Web Book Engine';

export function getWebBookDocumentTitle(topic?: string | null): string {
  const normalizedTopic = typeof topic === 'string' ? topic.trim() : '';
  return normalizedTopic || DEFAULT_DOCUMENT_TITLE;
}
