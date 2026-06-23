#!/usr/bin/env python3
"""Convert HebrewManuscriptsMNIST Keras weights to TensorFlow.js layers format."""

from __future__ import annotations

import sys
from pathlib import Path

import tensorflow as tf
import tensorflowjs as tfjs

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/tmp/hebrew_letter_model.keras')
TARGET = ROOT / 'public' / 'hebrew-letter-model'


def main() -> int:
    if not SOURCE.exists():
        print(f'Missing source model: {SOURCE}', file=sys.stderr)
        return 1

    TARGET.mkdir(parents=True, exist_ok=True)
    model = tf.keras.models.load_model(SOURCE)
    print('Loaded model input:', model.input_shape, 'output:', model.output_shape)
    tfjs.converters.save_keras_model(model, str(TARGET))
    print('Saved TF.js model to', TARGET)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
