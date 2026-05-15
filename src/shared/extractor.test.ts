import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { extractConversationSnapshot } from './extractor';
import { claudeAdapter } from '../content/claude';

describe('Claude extractor', () => {
  it('extracts user and assistant turns correctly', () => {
    const html = readFileSync(
      join(process.cwd(), 'test/fixtures/claude-basic.html'),
      'utf8'
    );

    const dom = new JSDOM(html, {
      url: 'https://claude.ai/chat/test',
    });

    const snapshot = extractConversationSnapshot(
      'claude',
      dom.window.document,
      claudeAdapter
    );

    expect(snapshot.site).toBe('claude');
    expect(snapshot.turns).toHaveLength(2);

    expect(snapshot.turns[0]).toMatchObject({
      role: 'user',
      content: 'Find DOM',
    });

    expect(snapshot.turns[1].role).toBe('assistant');
    expect(snapshot.turns[1].content).toContain('Could you clarify what you mean by "Find DOM"?');

    expect(snapshot.markdown).toContain('### USER');
    expect(snapshot.markdown).toContain('### ASSISTANT');
  });
});
