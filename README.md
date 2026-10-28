# Novum

## Subjects and syllabus checklists

Open **Subjects** using the center navigation button, then add a subject and a PDF syllabus (up to 3 MB). Create a free-tier Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey) and enter it when creating a checklist. Gemini free-tier availability and quotas depend on your account and region. Check Google's [pricing](https://ai.google.dev/gemini-api/docs/pricing) and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

The PDF is sent directly from your browser to Google Gemini for processing; the key is not saved by Novum. Google notes that free-tier content may be used to improve its products; check its terms before uploading sensitive documents. The resulting subjects and checklist progress are stored in this browser's localStorage, not synced across devices. The PDF itself is not stored. AI output can be incomplete or inaccurate, so check it against the original syllabus.

Run `npm run dev` to develop, `npm run build` to build, and `node --test src/lib/syllabus.test.js src/lib/subjects.test.js` to test the syllabus integration without a real API key.
