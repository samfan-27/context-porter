function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function extractTextFromSelectors(
  rootDocument: Document,
  selectors: string[]
): string {
  const chunks: string[] = [];

  for (const selector of selectors) {
    const nodes = Array.from(rootDocument.querySelectorAll(selector));

    for (const node of nodes) {
      const text = normalizeWhitespace(node.textContent ?? '');
      if (text) chunks.push(text);
    }
  }

  const uniqueChunks = Array.from(new Set(chunks));
  return normalizeWhitespace(uniqueChunks.join('\n\n'));
}

export function extractFallbackText(rootDocument: Document): string {
  return normalizeWhitespace(rootDocument.body?.innerText ?? '');
}
