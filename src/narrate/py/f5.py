# Reads a JSON job on stdin: {items: [{text, wav}], ref, refText, model, speed}. Loads the model once.
import json
import sys
from importlib.resources import files

from f5_tts.api import F5TTS

job = json.load(sys.stdin)
ref, ref_text = job['ref'], job['refText']
if not ref:  # the sample that ships with the package
    ref = str(files('f5_tts').joinpath('infer/examples/basic/basic_ref_en.wav'))
    ref_text = 'Some call me nature, others call me mother nature.'

tts = F5TTS(model=job['model'])
for item in job['items']:
    tts.infer(ref_file=ref, ref_text=ref_text, gen_text=item['text'], file_wave=item['wav'], speed=job['speed'], seed=1)
    print(f"  f5  {item['wav']}", flush=True)
