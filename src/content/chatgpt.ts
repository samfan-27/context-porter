import { extractTextFromSelectors } from '../shared/dom';
import type { SiteAdapter } from '../shared/types';

export const chatgptAdapter: SiteAdapter = {
  site: 'chatgpt',
  hostnames: ['chatgpt.com', 'chat.openai.com'],
  selectors: [
    '[data-message-author-role]',
    'main',
  ],
};

export function extractChatgptText(doc: Document): string {
  return extractTextFromSelectors(doc, chatgptAdapter.selectors);
}
