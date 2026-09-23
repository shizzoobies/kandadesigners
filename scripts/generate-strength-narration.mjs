import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = 'public/training-samples/strength/';
const varsPath = process.env.KA_ENV_FILE || 'D:/K & A Performance Site/.dev.vars';
const keyLine = fs.readFileSync(varsPath, 'utf8').split(/\r?\n/).find(line => line.startsWith('ELEVENLABS_API_KEY='));
if (!keyLine) throw new Error('The local ElevenLabs key is missing.');
const apiKey = keyLine.slice('ELEVENLABS_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(root + 'narration.js', 'utf8'), context);
const scripts = context.window.strengthNarration;
const directory = root + 'assets/audio/';
fs.mkdirSync(directory, { recursive: true });
for (let i = 0; i < scripts.length; i++) {
  const file = path.join(directory, 'screen-' + (i + 1) + '.mp3');
  if (fs.existsSync(file)) { console.log('Retained screen ' + (i + 1)); continue; }
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/hpp4J3VqNfWAUOO0d1Us?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: scripts[i], model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.12, use_speaker_boost: true } }), signal: AbortSignal.timeout(120000)
  });
  if (!response.ok) throw new Error('Narration returned HTTP ' + response.status + ' for screen ' + (i + 1));
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error('Narration output was unexpectedly small.');
  fs.writeFileSync(file, bytes);
  console.log('Generated screen ' + (i + 1) + ': ' + bytes.length + ' bytes');
}
