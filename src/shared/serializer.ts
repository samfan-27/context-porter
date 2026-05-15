type SerializeContext = {
  listDepth: number;
  blockquoteDepth: number;
};

const BLOCK_CONTAINER_TAGS = new Set([
  'article',
  'aside',
  'div',
  'footer',
  'header',
  'main',
  'nav',
  'section',
]);

const STANDALONE_LIST_ITEM_BLOCKS = new Set([
  'blockquote',
  'ol',
  'pre',
  'table',
  'ul',
]);

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function isText(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function getTagName(node: Element): string {
  return node.tagName.toLowerCase();
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

function collapseInlineWhitespace(text: string): string {
  return normalizeLineEndings(text).replace(/\s+/g, ' ');
}

function escapeInlineText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function getLongestBacktickRun(text: string): number {
  let longest = 0;
  let current = 0;

  for (const char of text) {
    if (char === '`') {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

function buildInlineCode(content: string): string {
  const normalized = normalizeLineEndings(content).replace(/\n/g, ' ');
  const fenceLength = Math.max(1, getLongestBacktickRun(normalized) + 1);
  const fence = '`'.repeat(fenceLength);

  if (normalized.length === 0) {
    return `${fence}${fence}`;
  }

  const needsPadding =
    /^\s/.test(normalized) ||
    /\s$/.test(normalized) ||
    normalized.startsWith('`') ||
    normalized.endsWith('`');

  const body = needsPadding ? ` ${normalized} ` : normalized;
  return `${fence}${body}${fence}`;
}

function getCodeBlockLanguage(node: Element): string {
  const className = [
    node.getAttribute('class') ?? '',
    node.parentElement?.getAttribute('class') ?? '',
  ].join(' ');

  const match = className.match(/\b(?:language|lang)-([a-z0-9_+-]+)/i);
  return match ? match[1].toLowerCase() : '';
}

function getFenceForCodeBlock(content: string): string {
  const fenceLength = Math.max(3, getLongestBacktickRun(content) + 1);
  return '`'.repeat(fenceLength);
}

function formatLinkDestination(href: string): string {
  const normalized = href.trim();

  if (/[\s()<>]/.test(normalized)) {
    return `<${normalized.replace(/</g, '%3C').replace(/>/g, '%3E')}>`;
  }

  return normalized.replace(/\\/g, '\\\\').replace(/\)/g, '\\)');
}

function normalizeMarkdownOutput(markdown: string): string {
  return normalizeLineEndings(markdown)
    .replace(/[ \t]+$/gm, '')
    .trim();
}

function applyBlockquotePrefix(markdown: string, depth: number): string {
  if (depth <= 0 || markdown.trim().length === 0) {
    return markdown;
  }

  const prefix = Array.from({ length: depth }, () => '>').join(' ');

  return markdown
    .split('\n')
    .map(line => (line.trim() === '' ? prefix : `${prefix} ${line}`))
    .join('\n');
}

function indentMultiline(markdown: string, prefix: string): string {
  return markdown
    .split('\n')
    .map(line => (line.trim() === '' ? '' : `${prefix}${line}`))
    .join('\n');
}

function serializeTextNode(textNode: Text): string {
  const normalized = collapseInlineWhitespace(textNode.data);
  if (!normalized) {
    return '';
  }

  return escapeInlineText(normalized);
}

function serializeChildrenAsInline(parent: ParentNode, context: SerializeContext): string {
  return Array.from(parent.childNodes)
    .map(child => serializeNode(child, context))
    .join('');
}

function serializeChildrenAsBlocks(parent: ParentNode, context: SerializeContext): string {
  return Array.from(parent.childNodes)
    .map(child => serializeNode(child, context))
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .join('\n\n');
}

function serializeLink(node: Element, context: SerializeContext): string {
  const href = node.getAttribute('href');
  const text = serializeChildrenAsInline(node, context).replace(/\s+/g, ' ').trim();

  if (!href) {
    return text;
  }

  const destination = formatLinkDestination(href);
  return `[${text || destination}](${destination})`;
}

function serializeInlineCodeNode(node: Element): string {
  const rawText = node.textContent ?? '';
  return buildInlineCode(rawText);
}

function serializeCodeBlock(node: Element, context: SerializeContext): string {
  const codeNode = node.querySelector('code') ?? node;
  const codeText = normalizeLineEndings(codeNode.textContent ?? node.textContent ?? '').replace(
    /\n$/,
    ''
  );
  const fence = getFenceForCodeBlock(codeText);
  const language = getCodeBlockLanguage(codeNode);

  const rendered = [language ? `${fence}${language}` : fence, codeText, fence].join('\n');
  return applyBlockquotePrefix(rendered, context.blockquoteDepth);
}

function serializeHeading(node: Element, context: SerializeContext): string {
  const level = Number(getTagName(node).slice(1));
  const content = serializeChildrenAsInline(node, context).trim();

  if (!content) {
    return '';
  }

  return applyBlockquotePrefix(`${'#'.repeat(level)} ${content}`, context.blockquoteDepth);
}

function firstMeaningfulChild(node: Element): Node | null {
  for (const child of Array.from(node.childNodes)) {
    if (isText(child) && child.data.trim() === '') {
      continue;
    }

    return child;
  }

  return null;
}

function isStandaloneListItemBlock(node: Node | null): boolean {
  if (!node || !isElement(node)) {
    return false;
  }

  return STANDALONE_LIST_ITEM_BLOCKS.has(getTagName(node));
}

function serializeListItem(
  item: Element,
  index: number,
  ordered: boolean,
  context: SerializeContext
): string {
  const bullet = ordered ? `${index + 1}.` : '-';
  const childContext: SerializeContext = {
    listDepth: context.listDepth + 1,
    blockquoteDepth: context.blockquoteDepth,
  };

  const body = Array.from(item.childNodes)
    .map(child => serializeNode(child, childContext))
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .join('\n\n');

  if (!body) {
    return bullet;
  }

  const firstChild = firstMeaningfulChild(item);
  const startsWithStandaloneBlock = isStandaloneListItemBlock(firstChild);
  
  const indent = '    '; 

  if (startsWithStandaloneBlock) {
    return `${bullet}\n\n${indentMultiline(body, indent)}`;
  }

  const lines = body.split('\n');
  const firstLine = `${bullet} ${lines[0].trim()}`;
  const remainingLines = lines
    .slice(1)
    .map(line => (line.trim() === '' ? '' : `${indent}${line}`));

  return [firstLine, ...remainingLines].join('\n');
}

function serializeList(node: Element, context: SerializeContext): string {
  const ordered = getTagName(node) === 'ol';
  const items = Array.from(node.children).filter(
    (child): child is Element => child.tagName.toLowerCase() === 'li'
  );

  const rendered = items
    .map((item, index) => serializeListItem(item, index, ordered, context))
    .join('\n');

  return applyBlockquotePrefix(rendered, context.blockquoteDepth);
}

function serializeBlockquote(node: Element, context: SerializeContext): string {
  const childContext: SerializeContext = {
    listDepth: context.listDepth,
    blockquoteDepth: context.blockquoteDepth + 1,
  };

  return serializeChildrenAsBlocks(node, childContext);
}

function serializeElement(node: Element, context: SerializeContext): string {
  const tag = getTagName(node);

  switch (tag) {
    case 'br':
      return '\n';

    case 'strong':
    case 'b': {
      const content = serializeChildrenAsInline(node, context).trim();
      return content ? `**${content}**` : '';
    }

    case 'em':
    case 'i': {
      const content = serializeChildrenAsInline(node, context).trim();
      return content ? `*${content}*` : '';
    }

    case 'code':
      return node.parentElement?.tagName.toLowerCase() === 'pre'
        ? node.textContent ?? ''
        : serializeInlineCodeNode(node);

    case 'a':
      return serializeLink(node, context);

    case 'pre':
      return serializeCodeBlock(node, context);

    case 'blockquote':
      return serializeBlockquote(node, context);

    case 'ul':
    case 'ol':
      return serializeList(node, context);

    case 'li':
      return serializeChildrenAsBlocks(node, context);

    case 'p': {
      const content = serializeChildrenAsInline(node, context).trim();
      return applyBlockquotePrefix(content, context.blockquoteDepth);
    }

    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return serializeHeading(node, context);

    case 'span':
    case 'small':
    case 'mark':
    case 'abbr':
    case 'sup':
    case 'sub':
    case 'time':
    case 'kbd':
    case 'samp':
    case 'var':
      return serializeChildrenAsInline(node, context);

    case 'div':
    case 'article':
    case 'section':
    case 'main':
    case 'aside':
    case 'header':
    case 'footer':
    case 'nav':
      return serializeChildrenAsBlocks(node, context);

    default:
      return BLOCK_CONTAINER_TAGS.has(tag)
        ? serializeChildrenAsBlocks(node, context)
        : serializeChildrenAsInline(node, context);
  }
}

function serializeNode(node: Node, context: SerializeContext): string {
  if (isText(node)) {
    return serializeTextNode(node);
  }

  if (!isElement(node)) {
    return '';
  }

  return serializeElement(node, context);
}

export function serializeMarkdownFromNode(node: Element | null | undefined): string {
  if (!node) {
    return '';
  }

  const markdown = serializeNode(node, {
    listDepth: 0,
    blockquoteDepth: 0,
  });

  return normalizeMarkdownOutput(markdown);
}
