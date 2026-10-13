# Закон 10 — Remotion

Монтаж ролика «Закон 10: Лола Монтес» (1080×1920, 30 fps, 31.5 с).

Медиа не хранятся в git. Положи в `public/`:
`1_dance.mp4`, `2_salon.mp4`, `3_duel.mp4`, `4_king.mp4`, `5_riot.mp4`, `6_final.mp4`, `voice.mp3`, `drone.mp3`.

```
npm install
npm run studio   # предпросмотр
npm run render   # out/zakon10.mp4
```

- `src/scenes.ts` — таймлайн, скорость, движения камеры, цвет, титры мест.
- `src/captions.json` — субтитры с таймингом слов.
- `src/Zakon10.tsx` — титры, субтитры, зерно, вспышка выстрела, финальная карточка, звук.
