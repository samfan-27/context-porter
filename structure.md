# Project Structure

```text
context-porter/
├── manifest.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
├── package-lock.json
├── .env
├── .env.example
├── .gitignore
├── structure.md
└── src/
    ├── content/
    │   ├── index.ts
    │   ├── chatgpt.ts
    │   └── claude.ts
    ├── popup/
    │   ├── index.html
    │   └── main.ts
    ├── service-worker/
    │   └── index.ts
    └── shared/
        ├── dom.ts
        ├── markdown.ts
        └── types.ts
