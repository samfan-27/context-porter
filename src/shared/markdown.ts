import type { ConversationTurn } from './types';

type MarkdownInput = {
  title: string;
  url: string;
  capturedAt: string;
  site: string;
  rawText: string;
  turns?: ConversationTurn[];
};

export function buildMarkdown(input: MarkdownInput): string {
  const safeTitle = input.title.trim() || 'Untitled page';

  const turnSection =
    input.turns && input.turns.length > 0
      ? input.turns
          .map(turn => {
            const label = turn.role.toUpperCase();
            const body = turn.content || '_Empty turn._';
            return `### ${label}\n\n${body}`;
          })
          .join('\n\n')
      : input.rawText || '_No readable text was found on the page._';

  return [
    `# ${safeTitle}`,
    '',
    `- Site: ${input.site}`,
    `- Source: ${input.url}`,
    `- Captured at: ${input.capturedAt}`,
    '',
    '## Conversation snapshot',
    '',
    turnSection,
    '',
  ].join('\n');
}
