export type SupportedSite = 'chatgpt' | 'claude' | 'unknown';

export type ConversationSnapshot = {
  site: SupportedSite;
  title: string;
  url: string;
  capturedAt: string;
  rawText: string;
  markdown: string;
};

export type SiteAdapter = {
  site: SupportedSite;
  hostnames: string[];
  selectors: string[];
};
