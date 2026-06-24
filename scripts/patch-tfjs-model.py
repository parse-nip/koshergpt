#!/usr/bin/env python3
"""Patch Keras 3 TF.js exports for browser compatibility."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def fix_dtype(value):
    if isinstance(value, dict):
        if value.get('class_name') == 'DTypePolicy' and 'config' in value:
            return value['config'].get('name', 'float32')
        return {key: fix_dtype(child) for key, child in value.items()}
    if isinstance(value, list):
        return [fix_dtype(child) for child in value]
    return value


def patch_model_json(path: Path) -> None:
    data = json.loads(path.read_text())
    topology = fix_dtype(data['modelTopology'])

    layers = topology['model_config']['config']['layers']
    for layer in layers:
        config = layer.get('config', {})
        if layer.get('class_name') != 'InputLayer':
            continue
        if 'batch_shape' in config:
            config['batchInputShape'] = config.pop('batch_shape')
        config.pop('inputShape', None)
        config.pop('optional', None)
        config.pop('sparse', None)
        config.pop('ragged', None)

    data['modelTopology'] = topology
    path.write_text(json.dumps(data))


def main() -> int:
    target = Path(sys.argv[1] if len(sys.argv) > 1 else 'public/hebrew-letter-model/model.json')
    if not target.exists():
        print(f'Missing model.json at {target}', file=sys.stderr)
        return 1
    patch_model_json(target)
    print('Patched', target)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
