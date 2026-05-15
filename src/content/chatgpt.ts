import { getTextFromSelectors, normalizeWhitespace } from '../shared/dom';
import type { Role, SiteAdapter } from '../shared/types';

function resolveChatgptRole(turnRoot: Element): Role {
  const role = turnRoot.getAttribute('data-message-author-role');

  if (role === 'user' || role === 'assistant' || role === 'system' || role === 'tool') {
    return role;
  }

  return 'unknown';
}

function extractChatgptContent(turnRoot: Element, role: Role): string {
  if (role === 'user') {
    return getTextFromSelectors(turnRoot, ['p', '[dir="auto"]']);
  }

  if (role === 'assistant') {
    return getTextFromSelectors(turnRoot, ['p', 'pre', '[dir="auto"]']);
  }

  return normalizeWhitespace(turnRoot.textContent ?? '');
}

export const chatgptAdapter: SiteAdapter = {
  site: 'chatgpt',
  hostnames: ['chatgpt.com', 'chat.openai.com'],
  selectors: {
    root: ['main', '[role="main"]'],
    turn: ['[data-message-author-role]'],
  },
  resolveRole: resolveChatgptRole,
  extractContent: extractChatgptContent,
};
