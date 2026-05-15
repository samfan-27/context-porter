import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { serializeMarkdownFromNode } from './serializer';

describe('serializeMarkdownFromNode', () => {
  it('preserves paragraphs and lists', () => {
    const dom = new JSDOM(`
      <div class="standard-markdown">
        <p>Hello <strong>world</strong>.</p>
        <ul>
          <li>First item</li>
          <li>Second item</li>
        </ul>
      </div>
    `);

    const node = dom.window.document.querySelector('.standard-markdown');

    expect(node).not.toBeNull();
    expect(serializeMarkdownFromNode(node)).toBe(
      [
        'Hello **world**.',
        '',
        '- First item',
        '- Second item',
      ].join('\n')
    );
  });

  it('preserves blockquotes and code blocks', () => {
    const dom = new JSDOM(`
      <div>
        <blockquote><p>Quoted text</p></blockquote>
        <pre><code>const x = 1;</code></pre>
      </div>
    `);

    const node = dom.window.document.querySelector('div');

    expect(node).not.toBeNull();
    expect(serializeMarkdownFromNode(node)).toContain('> Quoted text');
    expect(serializeMarkdownFromNode(node)).toContain('```');
    expect(serializeMarkdownFromNode(node)).toContain('const x = 1;');
  });

  it('preserves inline code and links', () => {
    const dom = new JSDOM(`
      <div class="standard-markdown">
        <p>Run <code>npm run dev</code> to start.</p>
        <p>
          Read the <a href="https://example.com/docs?q=a(b)">docs</a>
          and the <a href="https://example.com/guide">guide</a>.
        </p>
      </div>
    `);

    const node = dom.window.document.querySelector('.standard-markdown');
    expect(node).not.toBeNull();

    expect(serializeMarkdownFromNode(node)).toBe(
      [
        'Run `npm run dev` to start.',
        '',
        'Read the [docs](<https://example.com/docs?q=a(b)>) and the [guide](https://example.com/guide).',
      ].join('\n')
    );
  });

  it('preserves nested lists', () => {
    const dom = new JSDOM(`
      <div class="standard-markdown">
        <ul>
          <li>
            Parent item
            <ol>
              <li>First nested item</li>
              <li>Second nested item</li>
            </ol>
          </li>
          <li>Second top-level item</li>
        </ul>
      </div>
    `);

    const node = dom.window.document.querySelector('.standard-markdown');
    expect(node).not.toBeNull();

    expect(serializeMarkdownFromNode(node)).toBe(
      [
        '- Parent item',
        '',
        '    1. First nested item',
        '    2. Second nested item',
        '- Second top-level item',
      ].join('\n')
    );
  });

  it('preserves nested blockquotes', () => {
    const dom = new JSDOM(`
      <div class="standard-markdown">
        <blockquote>
          <p>Outer claim</p>
          <blockquote>
            <p>Inner quote</p>
          </blockquote>
          <p>Back to outer</p>
        </blockquote>
      </div>
    `);

    const node = dom.window.document.querySelector('.standard-markdown');
    expect(node).not.toBeNull();

    expect(serializeMarkdownFromNode(node)).toBe(
      [
        '> Outer claim',
        '',
        '> > Inner quote',
        '',
        '> Back to outer',
      ].join('\n')
    );
  });

  it('preserves list and quote boundaries inside assistant style markdown', () => {
    const dom = new JSDOM(`
      <div class="standard-markdown">
        <p>Use <code>npm run dev</code> first.</p>
        <blockquote>
          <p>Remember to keep the dev server running.</p>
        </blockquote>
        <ul>
          <li>
            <p>Install dependencies</p>
            <pre><code class="language-bash">npm install</code></pre>
          </li>
          <li>
            <p>Check the output</p>
            <blockquote>
              <p>Look for the green banner.</p>
            </blockquote>
          </li>
        </ul>
      </div>
    `);

    const node = dom.window.document.querySelector('.standard-markdown');
    expect(node).not.toBeNull();

    const output = serializeMarkdownFromNode(node);

    expect(output).toContain('Use `npm run dev` first.');
    expect(output).toContain('> Remember to keep the dev server running.');
    expect(output).toContain('```bash');
    expect(output).toContain('npm install');
    expect(output).toContain('> Look for the green banner.');
  });

  it('preserves fenced code blocks with language hints', () => {
    const dom = new JSDOM(`
      <div class="standard-markdown">
        <pre><code class="language-ts">const x = 1;
console.log(x);</code></pre>
      </div>
    `);

    const node = dom.window.document.querySelector('.standard-markdown');
    expect(node).not.toBeNull();

    expect(serializeMarkdownFromNode(node)).toBe(
      [
        '```ts',
        'const x = 1;',
        'console.log(x);',
        '```',
      ].join('\n')
    );
  });

  it('uses a longer fence when code contains backticks', () => {
    const dom = new JSDOM(`
      <div class="standard-markdown">
        <pre><code>console.log("\`\`\`");</code></pre>
      </div>
    `);

    const node = dom.window.document.querySelector('.standard-markdown');
    expect(node).not.toBeNull();

    const output = serializeMarkdownFromNode(node);
    expect(output.startsWith('````')).toBe(true);
    expect(output).toContain('console.log("```");');
  });

  it('keeps strong text inside links readable', () => {
    const dom = new JSDOM(`
      <div class="standard-markdown">
        <p><a href="https://example.com"><strong>Docs</strong> and more</a></p>
      </div>
    `);

    const node = dom.window.document.querySelector('.standard-markdown');
    expect(node).not.toBeNull();

    expect(serializeMarkdownFromNode(node)).toBe(
      '[**Docs** and more](https://example.com)'
    );
  });
});
