## multirtc

Simple Next.js-based real-time meeting / transcription demo.

### Quick overview

- This repo contains a Next.js app (app dir) for real-time meetings, transcripts, and related utilities.
- The app includes pages and API routes for starting meetings, recording/transcribing audio, and interacting with GPT/mistral endpoints.

### Start a meeting

Visit the `/transcripts` page in the running app to start a meeting. From that page you can create or join a meeting session — the meeting link can be copied and shared directly from `/transcripts` so other participants can join.

Typical local URL: http://localhost:3000/transcripts

### Run locally

1. Install dependencies:

   npm install

2. Start the dev server:

   npm run dev

3. Open your browser and go to `http://localhost:3000/transcripts` to start or share a meeting link.

### Relevant files

- `src/app/transcript` — transcript UI and meeting-related pages/components.
- `src/app/api` — Next.js API routes used by the app (gpt/mistral, tokens, screenshots, etc.).
- `src/components` — shared UI components (auth, dialogs, recorder, moderator view).

### Important routes

UI pages (open these in the browser, e.g. `http://localhost:3000/<path>`):

- `/transcripts` — (src/app/transcript) Start or join a meeting and copy/share the meeting link from this page.
- `/answerPane` — (src/app/answerPane) Answer pane UI for submitting or viewing answers.
- `/moderator` — (src/app/moderator) Moderator controls and session management.
- `/meet` — (src/app/meet) Meeting view / main realtime meeting experience.
- `/callList` — (src/app/callList) List of calls/meetings.
- `/codeview` — (src/app/codeview) Code viewing page.
- `/viewAnswers` — (src/app/viewAnswers) View submitted answers.
- `/firebaseTest` — (src/app/firebaseTest) Firebase-related test/debug page.


Look in `src/app/api/*/route.ts` for the exact implementations and expected request/response shapes.

### Notes

- The project uses Next.js (app router). Adjust environment variables or API keys as needed for external services used by the API routes.
- This README is intentionally short — see the code and inline comments for implementation details.

If you'd like, I can expand this with contributor/deployment instructions or document specific API routes.
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn Moree

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details
