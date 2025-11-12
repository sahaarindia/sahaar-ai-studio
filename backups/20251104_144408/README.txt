BACKUP CREATED: Tue Nov  4 14:44:08 UTC 2025
=========================

Files backed up:
1. Text-to-Speech Page: text-to-speech-page.tsx.backup
2. Audio Podcast Page: audio-podcast-page.tsx.backup
3. TTS API: text-to-speech-api.ts.backup
4. Podcast API: podcast-generate-api.ts.backup
5. Voices Data: voices.ts.backup
6. Language Context: LanguageContext.tsx.backup

To restore any file:
cp backups/20251104_144408/[filename].backup [original-path]

Example:
cp backups/20251104_144408/text-to-speech-page.tsx.backup app/tools/text-to-speech/page.tsx
