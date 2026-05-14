import { extractTextFromSelectors } from '../shared/dom';
import type { SiteAdapter } from '../shared/types';

export const claudeAdapter: SiteAdapter = {
  site: 'claude',
  hostnames: ['claude.ai'],
  selectors: [
    '[data-testid="conversation-turn"]',
    'main',
  ],
};

export function extractClaudeText(doc: Document): string {
  return extractTextFromSelectors(doc, claudeAdapter.selectors);
}
