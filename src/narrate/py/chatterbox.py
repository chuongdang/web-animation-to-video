# Reads a JSON job on stdin: {items: [{text, wav}], ref, exaggeration, cfg}. Loads the model once, writes 16-bit mono wavs.
import json
import sys

import soundfile as sf
import torch

job = json.load(sys.stdin)
device = 'cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu'
if device != 'cuda':  # the checkpoints were saved on CUDA
    _load = torch.load
    torch.load = lambda *a, **k: _load(*a, **{**k, 'map_location': torch.device(device)})

from chatterbox.tts import ChatterboxTTS

model = ChatterboxTTS.from_pretrained(device=device)
for item in job['items']:
    torch.manual_seed(1)
    kwargs = {'audio_prompt_path': job['ref']} if job['ref'] else {}
    wav = model.generate(item['text'], exaggeration=job['exaggeration'], cfg_weight=job['cfg'], **kwargs)
    sf.write(item['wav'], wav.squeeze().cpu().numpy(), model.sr, subtype='PCM_16')
    print(f"  chatterbox  {item['wav']}", flush=True)
