export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function getFirstMatchingElement(
  root: ParentNode,
  selectors: string[]
): Element | null {
  for (const selector of selectors) {
    const element = root.querySelector(selector);
    if (element) return element;
  }

  return null;
}

export function getTextFromSelectors(
  root: ParentNode,
  selectors: string[]
): string {
  const element = getFirstMatchingElement(root, selectors);
  return normalizeWhitespace(element?.textContent ?? '');
}

export function collectElementsInDocumentOrder(
  root: ParentNode,
  selectors: string[]
): Element[] {
  const candidates = new Map<Element, true>();

  for (const selector of selectors) {
    for (const element of Array.from(root.querySelectorAll(selector))) {
      candidates.set(element, true);
    }
  }

  return Array.from(candidates.keys()).sort((a, b) => {
    const position = a.compareDocumentPosition(b);

    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

export function getMatchedSelector(
  element: Element,
  selectors: string[]
): string | undefined {
  return selectors.find(selector => element.matches(selector));
}

export function extractFallbackText(rootDocument: Document): string {
  return normalizeWhitespace(rootDocument.body?.innerText ?? '');
}
