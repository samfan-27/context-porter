import { buildMarkdown } from './markdown';
import {
  collectElementsInDocumentOrder,
  extractFallbackText,
  getFirstMatchingElement,
  getMatchedSelector,
  normalizeWhitespace,
} from './dom';
import type {
  ConversationSnapshot,
  ConversationTurn,
  Role,
  SiteAdapter,
  SupportedSite,
} from './types';

function findRoot(document: Document, selectors: string[]): Element | null {
  return getFirstMatchingElement(document, selectors);
}

function buildTurn(
  turnEl: Element,
  index: number,
  adapter: SiteAdapter
): ConversationTurn {
  const role = adapter.resolveRole(turnEl);
  const rawText = normalizeWhitespace(adapter.extractContent(turnEl, role));
  const content = rawText;

  return {
    index,
    role,
    content,
    rawText,
    sourceSelector: getMatchedSelector(turnEl, adapter.selectors.turn),
  };
}

export function extractConversationSnapshot(
  site: SupportedSite,
  document: Document,
  adapter: SiteAdapter
): ConversationSnapshot {
  const capturedAt = new Date().toISOString();
  const title = document.title || 'Untitled page';
  const url = document.location.href;

  const root = findRoot(document, adapter.selectors.root) ?? document.body;
  const turnRoots = collectElementsInDocumentOrder(root, adapter.selectors.turn);

  const turns = turnRoots
    .map((turnRoot, index) => buildTurn(turnRoot, index, adapter))
    .filter(turn => turn.content.length > 0 || turn.rawText.length > 0);

  const rawText =
    turns.length > 0
      ? turns.map(turn => `[${turn.role}] ${turn.content || turn.rawText}`).join('\n\n')
      : extractFallbackText(document);

  return {
    site,
    title,
    url,
    capturedAt,
    turns,
    rawText,
    markdown: buildMarkdown({
      site,
      title,
      url,
      capturedAt,
      rawText,
      turns,
    }),
  };
}
