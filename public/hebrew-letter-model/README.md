# Hebrew letter model (TensorFlow.js)

Converted from [bsesic/HebrewManuscriptsMNIST](https://huggingface.co/bsesic/HebrewManuscriptsMNIST) (MIT).

To regenerate:

```bash
curl -L -o /tmp/hebrew_letter_model.keras \
  https://huggingface.co/bsesic/HebrewManuscriptsMNIST/resolve/main/hebrew_letter_model.keras
python3 scripts/convert-hebrew-model.py
```

`convert-hebrew-model.py` also runs `patch-tfjs-model.py` to fix Keras 3 → TF.js compatibility.
