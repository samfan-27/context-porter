import { extractConversationSnapshot } from '../shared/extractor';
import type { ConversationSnapshot } from '../shared/types';
import { chatgptAdapter } from './chatgpt';
import { claudeAdapter } from './claude';

function detectAdapter(hostname: string) {
  if (chatgptAdapter.hostnames.includes(hostname)) return chatgptAdapter;
  if (claudeAdapter.hostnames.includes(hostname)) return claudeAdapter;
  return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'CP_CAPTURE_PAGE') return;

  const adapter = detectAdapter(window.location.hostname);

  const snapshot: ConversationSnapshot = adapter
    ? extractConversationSnapshot(adapter.site, document, adapter)
    : {
        site: 'unknown',
        title: document.title || 'Untitled page',
        url: window.location.href,
        capturedAt: new Date().toISOString(),
        turns: [],
        rawText: document.body?.innerText ?? '',
        markdown: document.body?.innerText ?? '',
      };

  sendResponse(snapshot);
});
