import type { ConversationSnapshot } from '../shared/types';

type CaptureMessage = {
  type: 'CP_CAPTURE_PAGE';
};

function mustGetElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

const captureButton = mustGetElement<HTMLButtonElement>('#capture');
const copyButton = mustGetElement<HTMLButtonElement>('#copy');
const downloadButton = mustGetElement<HTMLButtonElement>('#download');
const output = mustGetElement<HTMLTextAreaElement>('#output');
const status = mustGetElement<HTMLParagraphElement>('#status');

let lastSnapshot: ConversationSnapshot | null = null;

function setStatus(message: string): void {
  status.textContent = message;
}

function setSnapshot(snapshot: ConversationSnapshot): void {
  lastSnapshot = snapshot;
  output.value = snapshot.markdown;
  copyButton.disabled = false;
  downloadButton.disabled = false;
}

function clearSnapshot(): void {
  lastSnapshot = null;
  output.value = '';
  copyButton.disabled = true;
  downloadButton.disabled = true;
}

function getActiveTabId(): Promise<number> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0]?.id;

      if (typeof tabId !== 'number') {
        reject(new Error('No active tab found.'));
        return;
      }

      resolve(tabId);
    });
  });
}

function captureFromTab(tabId: number): Promise<ConversationSnapshot> {
  const message: CaptureMessage = { type: 'CP_CAPTURE_PAGE' };

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      if (!response) {
        reject(new Error('No response from content script.'));
        return;
      }

      resolve(response as ConversationSnapshot);
    });
  });
}

async function handleCapture(): Promise<void> {
  try {
    setStatus('Capturing current page...');
    clearSnapshot();

    const tabId = await getActiveTabId();
    const snapshot = await captureFromTab(tabId);

    setSnapshot(snapshot);
    setStatus(`Captured from ${snapshot.title}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    setStatus(`Capture failed: ${message}`);
  }
}

async function handleCopy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(output.value);
    setStatus('Markdown copied to clipboard.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    setStatus(`Copy failed: ${message}`);
  }
}

function handleDownload(): void {
  if (!lastSnapshot) return;

  const blob = new Blob([lastSnapshot.markdown], {
    type: 'text/markdown;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(lastSnapshot.title)}.md`;
  link.click();

  URL.revokeObjectURL(url);
  setStatus('Markdown downloaded.');
}

function sanitizeFileName(input: string): string {
  return input
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 80) || 'conversation';
}

captureButton.addEventListener('click', handleCapture);
copyButton.addEventListener('click', handleCopy);
downloadButton.addEventListener('click', handleDownload);
