import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'ContextPorter',
  version: '0.1.0',
  description: 'Capture a conversation snapshot and hand it off between AI web apps.',
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'ContextPorter',
  },
  permissions: ['activeTab', 'tabs', 'clipboardWrite'],
  host_permissions: [
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
    'https://claude.ai/*',
  ],
  background: {
    service_worker: 'src/service-worker/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: [
        'https://chatgpt.com/*',
        'https://chat.openai.com/*',
        'https://claude.ai/*',
      ],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
});
