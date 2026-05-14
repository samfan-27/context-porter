import { extractFallbackText } from '../shared/dom';
import { buildMarkdown } from '../shared/markdown';
import type { ConversationSnapshot } from '../shared/types';
import { chatgptAdapter, extractChatgptText } from './chatgpt';
import { claudeAdapter, extractClaudeText } from './claude';

function detectSite(hostname: string): 'chatgpt' | 'claude' | 'unknown' {
  if (chatgptAdapter.hostnames.includes(hostname)) return 'chatgpt';
  if (claudeAdapter.hostnames.includes(hostname)) return 'claude';
  return 'unknown';
}

function extractPageText(site: 'chatgpt' | 'claude' | 'unknown', doc: Document): string {
  if (site === 'chatgpt') return extractChatgptText(doc);
  if (site === 'claude') return extractClaudeText(doc);
  return extractFallbackText(doc);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'CP_CAPTURE_PAGE') return;

  const site = detectSite(window.location.hostname);
  const capturedAt = new Date().toISOString();
  const rawText = extractPageText(site, document);
  const title = document.title || 'Untitled page';
  const url = window.location.href;

  const snapshot: ConversationSnapshot = {
    site,
    title,
    url,
    capturedAt,
    rawText,
    markdown: buildMarkdown({
      site,
      title,
      url,
      capturedAt,
      rawText,
    }),
  };

  sendResponse(snapshot);
});
