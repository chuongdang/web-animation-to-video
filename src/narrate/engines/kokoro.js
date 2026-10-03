// local, English only, model downloads on first use
let tts;

export default {
  nativeSpeed: true,
  async synth(items, { voice = 'af_heart', speed = 1 }) {
    if (!tts) {
      const { KokoroTTS } = await import('kokoro-js');
      console.log('Loading Kokoro (first run downloads ~90MB)...');
      tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
    }
    for (const { text, wav } of items) {
      const audio = await tts.generate(text, { voice, speed });
      await audio.save(wav);
    }
  },
};
