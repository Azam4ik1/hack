# Закон 10 — задание для Claude в Chrome

**Закон 10: «Заражение: избегай несчастных и неудачников»** (Infection: Avoid the Unhappy and Unlucky).
Суть: несчастье и вечное нытьё заразны. Кто рядом с таким человеком, тот тонет вместе с ним.

Визуальная идея: от мрачного человека расползается **чёрная тень, как чернила**. Герой в **белом костюме**: когда чернила касаются его, белое становится серым.

---

## ЗАДАНИЕ

Ты работаешь в моём браузере. Сделай по шагам и ничего не покупай.

### Шаг 1. Фото — higgsfield.ai → Image
Модель: **Nano Banana 2**, режим **Unlimited** включён, формат **9:16**.
Сначала сгенерируй кадр 1. Потом загрузи его как референс (image reference) для кадров 2–5, чтобы герой был тот же.

**Кадр 1 — крючок**
```
A gloomy hunched man in a dark coat standing in a bright white minimalist hall, thick black ink-like smoke slowly spreading from his body across the white floor, people near him turning grey where the ink touches them, a confident man in a clean white suit standing at a distance watching, high contrast black and white with warm light, cinematic, photorealistic, ultra detailed, 9:16
```

**Кадр 2 — рукопожатие**
```
Close-up of the same man in the white suit from reference shaking hands with the gloomy man in the dark coat, black ink-like stain crawling from the gloomy man's hand onto the white sleeve, dramatic side light, shallow depth of field, cinematic, photorealistic, 9:16
```

**Кадр 3 — заражение**
```
The same man from reference sitting alone in a dim office, his white suit now stained grey and black, wilted plants, cracked window, cold grey light, papers scattered, tired face, cinematic, photorealistic, 9:16
```

**Кадр 4 — выбор**
```
The same man from reference in a clean white suit walking away from a dark smoky room toward a bright doorway full of warm golden sunlight, his back to the camera, black smoke behind him, light ahead, symmetrical composition, cinematic, photorealistic, 9:16
```

**Кадр 5 — финал**
```
Close-up of the same man from reference in a spotless white suit standing in warm golden sunlight, calm confident gaze straight into the camera, blurred dark figure far behind him in shadow, shallow depth of field, cinematic, photorealistic, 9:16
```

### Шаг 2. Видео — higgsfield.ai → Video
Модель: **Kling 3.0**, **5s**, **720p**, **Unlimited mode** включён, звук **выключен**.
Каждое фото ставь в **Start frame** и вставляй его промт:

**Кадр 1**
```
Black ink-like smoke slowly spreads from the gloomy man across the white floor, people it touches slowly turn grey and lower their heads. The man in the white suit takes one step back. Slow camera push in, dramatic, cinematic, smooth motion.
```

**Кадр 2**
```
The two men hold the handshake, the black stain slowly crawls up the white sleeve like ink in water. Very slow camera push in on the hands, subtle light flicker, cinematic, realistic motion.
```

**Кадр 3**
```
The man sits motionless and slowly drops his head into his hands, grey dust falls in the cold light, a wilted leaf drops from the plant. Slow camera dolly in, heavy depressing mood, realistic motion.
```

**Кадр 4**
```
The man walks steadily toward the bright doorway, black smoke behind him slowly fades, golden light grows brighter and fills the frame. Camera follows behind him, smooth cinematic motion.
```

**Кадр 5**
```
The man slowly raises his chin and gives a faint calm smile, warm sunlight flickers on his face, the dark figure behind dissolves into shadow. Very slow camera push in, calm powerful mood.
```

Скачай все 5 видео.

### Шаг 3. Озвучка — elevenlabs.io → Text to Speech
Язык: русский. Голос: мужской, спокойный, глубокий (тот же, что для Закона 6). Stability ~50%.
Каждую фразу генерируй отдельно и скачай как отдельный файл (1.mp3 … 5.mp3):

1. Закон десятый. Избегай несчастных и неудачников.
2. Несчастье заразно, как болезнь.
3. Кто рядом с ними, тонет вместе с ними.
4. Выбирай тех, кто несёт свет.
5. Твоё окружение — это твоя судьба.

### Шаг 4. Отчёт
Напиши, что скачано и куда, и какие кадры получились плохо (лицо другое, руки кривые, чернила выглядят как грязь).

---

## Монтаж (делаю сам)

| Кадр | Время | Звук/эффект |
|---|---|---|
| 1 Крючок | 0–5с | низкий гул + текст «ЗАКОН 10» |
| 2 Рукопожатие | 5–10с | тихий «шорох» расползающихся чернил |
| 3 Заражение | 10–15с | музыка глухая, почти тишина |
| 4 Выбор | 15–20с | музыка светлеет и нарастает |
| 5 Финал | 20–25с | тёплый аккорд, удар в конце |

Цвет: кадры 1–3 холодные и серые, кадры 4–5 тёплые и золотые. Переход из тьмы в свет и есть смысл ролика.
