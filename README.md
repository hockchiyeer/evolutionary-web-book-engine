# Evolutionary Web-Book Engine

Evolutionary Web-Book Engine is a client-side React application that uses Google Gemini plus the Google Search tool to turn a user topic into a styled, multi-page "Web-book". The app searches for source material, scores and recombines candidate knowledge fragments, assembles a chapter set, and renders the result as an on-screen book that can also be exported in multiple formats.

👉 You can explore the live application built from this repository’s source code at: [https://aistudio.google.com/apps/84d53490-d503-494c-bf74-c67f1af980a8?showPreview=true&showAssistant=true](https://aistudio.google.com/apps/84d53490-d503-494c-bf74-c67f1af980a8?showPreview=true&showAssistant=true)


This repository is set up for local Vite development and also includes Google AI Studio app metadata in `metadata.json`.

## What The Current App Does

- Accepts a topic prompt and runs a Gemini-powered search/extraction pass.
- Requests at least 5 relevant sources and captures grounding metadata for the in-app artifacts panel.
- Builds an initial population of source summaries, definitions, and sub-topics.
- Applies a lightweight evolutionary pass across 3 generations using informative value, authority, and redundancy-weighted fitness scoring.
- Generates an 18-chapter candidate pool, writes all chapter candidates in parallel, filters low-quality output, then selects the top 10 chapters by priority score.
- Renders a cover page, table of contents, chapter pages, glossary content, sub-topic analysis, and a closing page.
- Keeps a collapsible technical artifacts view with raw search grounding, evolved population data, and assembly input/output.
- Saves generated Web-books to `localStorage`, and can also sync them to Firebase Auth plus Cloud Firestore when Firebase variables are configured.
- Exports the current Web-book as high-resolution PDF, print-friendly PDF, Word-compatible `.doc`, standalone HTML, or plain text.

## Current Architecture

- Frontend only: all checked-in application logic lives in `src/`.
- UI: React 19 + TypeScript + Vite + Tailwind CSS 4 + Motion.
- AI layer: `@google/genai` from the browser bundle.
- Persistence: optional Firebase Web SDK with Anonymous Auth and Cloud Firestore.
- Export stack: `html2canvas` + `jspdf` for high-resolution PDF, DOM-to-HTML export for `.html` and `.doc`, and browser print for lightweight PDF output.

There is no checked-in backend server, API route, or proxy layer in this repo.

## Repo Layout

```text
.
|-- .env.example
|-- index.html
|-- LICENSE.txt
|-- metadata.json
|-- package-lock.json
|-- package.json
|-- README.md
|-- tsconfig.json
|-- vite.config.ts
`-- src
    |-- App.tsx
    |-- index.css
    |-- main.tsx
    |-- types.ts
    |-- services
    |   `-- evolutionService.ts
    `-- utils
        `-- webBookRender.ts
```

## How The Pipeline Works Today

1. Search and extraction
   `src/services/evolutionService.ts` calls Gemini (`gemini-3-flash-preview`) with the `googleSearch` tool and asks for structured JSON containing source summaries, definitions, sub-topics, and scores.
2. Population scoring
   Each source is scored with `F(w) = alpha * informativeScore + beta * authorityScore - gamma * redundancy`.
3. Evolution
   The app runs 3 evolutionary passes, keeps the top half of the population, and recombines survivors into offspring.
4. Chapter candidate generation
   Gemini creates an 18-chapter candidate pool with focus text, key terms, sub-topic titles, image seeds, and a `priorityScore`.
5. Chapter writing
   The app generates content for all 18 chapter candidates in parallel, then drops candidates that fail the repo's text-quality heuristics.
6. Final selection
   The surviving chapters are sorted by `priorityScore`, the top 10 are kept, and then they are re-sorted into their original outline order for the final book.
7. Render planning
   `src/utils/webBookRender.ts` filters repeated or low-quality glossary items and sub-topics, then computes the final page numbers used by the on-screen layout and PDF link annotations.

## Important Reality Checks

- The app is browser-first. Gemini requests are made directly from the frontend bundle using `GEMINI_API_KEY`.
- The "evolutionary" portion is heuristic, not a full evolutionary search engine. It implements scoring, selection, and recombination; mutation is effectively not implemented.
- The redundancy term exists in the fitness formula, but `evolve()` currently calls `calculateFitness()` with an empty comparison set, so redundancy is not actively influencing selection yet.
- The chapter candidate pool is 18 chapters, but the rendered book targets a final top 10 selection after filtering and ranking.
- The final Web-book can contain fewer than 10 chapters when generated content is rejected by the text-quality filters.
- Chapter imagery is loaded from `https://picsum.photos/...` using the chapter title or visual seed. These are decorative placeholder images, not AI-generated illustrations stored in the repo.
- `package.json` still includes `express`, `dotenv`, and `@types/express`, but no server implementation is checked in.
- `npm run lint` is TypeScript type checking only. There is no dedicated unit/integration test suite in this repository.

## Export Notes

- `PDF Document (High Res)` renders each page individually with `html2canvas` and builds the PDF with `jspdf`.
- In embedded environments such as Google AI Studio previews, high-resolution PDF export now opens a dedicated preview tab/window once the PDF blob is ready instead of relying only on an iframe-scoped download.
- `Print / Save as PDF` is the lightweight fallback and is still the most reliable option for very large books.
- `Word (.doc)` exports HTML wrapped in a Word-compatible document shell. It does not produce `.docx`.
- `HTML Webpage` exports the rendered book as a standalone HTML file.
- `Plain Text` exports a text-only version of the current Web-book.

## Persistence Notes

- Local history is always stored in `localStorage` under `webbook_history`.
- When Firebase is configured, the app signs users in anonymously and stores searches in Firestore under `webbookUsers/{uid}/searches`.
- Local and Firebase-backed history are merged in the UI by Web-book ID and sorted by timestamp.

## Tech Stack

- React 19
- TypeScript 5
- Vite 6
- Tailwind CSS 4 via `@tailwindcss/vite`
- Motion via `motion/react`
- Google Gemini via `@google/genai`
- Firebase Web SDK
- `html2canvas`
- `jspdf`
- `lucide-react`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example`.

3. Add at minimum:

```env
GEMINI_API_KEY="your_gemini_api_key"
```

4. Optionally add Firebase values from `.env.example` if you want shared cloud-backed history.

5. Start the development server:

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Environment Variables

Required:

- `GEMINI_API_KEY`

Optional Firebase variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Present in `.env.example` but not used by the checked-in source:

- `APP_URL`

Supported by `vite.config.ts` for AI Studio editing workflows:

- `DISABLE_HMR`

## Available Scripts

- `npm run dev` starts the Vite dev server on port 3000 and binds to `0.0.0.0`
- `npm run build` creates a production build
- `npm run preview` previews the production build
- `npm run lint` runs `tsc --noEmit`
- `npm run clean` removes `dist` via `rm -rf dist`

Note: `npm run clean` assumes a Unix-like shell and is not portable to a plain Windows shell.

## Google AI Studio Metadata

`metadata.json` currently declares:

- App name: `Evolutionary Web-Book Engine`
- A short app description for AI Studio
- No extra `requestFramePermissions`

## Known Constraints

- Large books can still hit browser memory or rendering limits during high-resolution PDF export.
- Remote image availability can affect export quality because chapter images are fetched from `picsum.photos`.
- Public deployment should ideally use a backend proxy instead of exposing a browser-usable Gemini API key.
- Production builds currently emit a large chunk warning from Vite because most of the app ships in a small number of large bundles.

## License

See [LICENSE.txt](LICENSE.txt).
