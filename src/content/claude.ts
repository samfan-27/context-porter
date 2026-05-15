import { serializeMarkdownFromNode } from '../shared/serializer';
import type { Role, SiteAdapter } from '../shared/types';

function resolveClaudeRole(turnRoot: Element): Role {
  if (
    turnRoot.matches('[data-user-message-bubble="true"]') ||
    turnRoot.querySelector('[data-testid="user-message"]')
  ) {
    return 'user';
  }

  if (
    turnRoot.matches('[data-is-streaming]') ||
    turnRoot.querySelector('.standard-markdown') ||
    turnRoot.querySelector('.font-claude-response')
  ) {
    return 'assistant';
  }

  return 'unknown';
}

function extractClaudeContent(turnRoot: Element, role: Role): string {
  if (role === 'user') {
    return serializeMarkdownFromNode(
      turnRoot.querySelector('[data-testid="user-message"]')
    );
  }

  if (role === 'assistant') {
    return serializeMarkdownFromNode(
      turnRoot.querySelector('.standard-markdown')
    );
  }

  return turnRoot.textContent?.trim() ?? '';
}

export const claudeAdapter: SiteAdapter = {
  site: 'claude',
  hostnames: ['claude.ai'],
  selectors: {
    root: ['main', '[role="main"]'],
    turn: ['[data-user-message-bubble="true"]', '[data-is-streaming="false"]'],
  },
  resolveRole: resolveClaudeRole,
  extractContent: extractClaudeContent,
};
