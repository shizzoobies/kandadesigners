import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root = path.resolve('public/training-samples/finance');
const envFile = process.env.KA_ENV_FILE || 'D:/K & A Performance Site/.dev.vars';
const line = fs.readFileSync(envFile, 'utf8').split(/\r?\n/).find(v => v.startsWith('ELEVENLABS_API_KEY='));
if (!line) throw new Error('Missing local ElevenLabs API key.');
const key = line.slice('ELEVENLABS_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'narration.js'), 'utf8'), context);
fs.mkdirSync(path.join(root, 'assets/audio'), { recursive: true });
for (let i = 0; i < context.window.financeNarration.length; i++) {
  const file = path.join(root, 'assets/audio', 'screen-' + (i + 1) + '.mp3');
  if (fs.existsSync(file)) { console.log('Retained lesson ' + (i + 1)); continue; }
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/hpp4J3VqNfWAUOO0d1Us?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: context.window.financeNarration[i], model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.12, use_speaker_boost: true } }),
    signal: AbortSignal.timeout(120000)
  });
  if (!response.ok) throw new Error('Narration HTTP ' + response.status + ' for lesson ' + (i + 1));
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error('Narration file unexpectedly small.');
  fs.writeFileSync(file, bytes);
  console.log('Generated lesson ' + (i + 1) + ': ' + bytes.length + ' bytes');
}
