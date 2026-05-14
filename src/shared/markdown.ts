type MarkdownInput = {
  title: string;
  url: string;
  capturedAt: string;
  rawText: string;
  site: string;
};

export function buildMarkdown(input: MarkdownInput): string {
  const safeTitle = input.title.trim() || 'Untitled page';

  return [
    `# ${safeTitle}`,
    '',
    `- Site: ${input.site}`,
    `- Source: ${input.url}`,
    `- Captured at: ${input.capturedAt}`,
    '',
    '## Conversation snapshot',
    '',
    input.rawText || '_No readable text was found on the page._',
    '',
  ].join('\n');
}
