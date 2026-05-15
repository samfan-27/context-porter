export type SupportedSite = 'chatgpt' | 'claude' | 'unknown';

export type Role = 'user' | 'assistant' | 'system' | 'tool' | 'unknown';

export type ConversationTurn = {
  index: number;
  role: Role;
  content: string;
  rawText: string;
  sourceSelector?: string;
};

export type ConversationSnapshot = {
  site: SupportedSite;
  title: string;
  url: string;
  capturedAt: string;
  turns: ConversationTurn[];
  rawText: string;
  markdown: string;
};

export type AdapterSelectors = {
  root: string[];
  turn: string[];
};

export type SiteAdapter = {
  site: SupportedSite;
  hostnames: string[];
  selectors: AdapterSelectors;
  resolveRole: (turnRoot: Element) => Role;
  extractContent: (turnRoot: Element, role: Role) => string;
};
