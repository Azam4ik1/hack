// Таймлайн в кадрах (30 fps). Границы сцен подогнаны под паузы в озвучке.
export type Scene = {
  src: string;
  from: number;
  to: number;
  trimBefore?: number; // кадры исходника, которые пропускаем
  rate?: number; // скорость: <1 — замедление
  volume: number; // громкость родного звука клипа
  // Движение камеры: масштаб и сдвиг в начале и в конце сцены
  zoom: [number, number];
  x: [number, number];
  y: [number, number];
  grade: string; // CSS-фильтр цветокоррекции
  shake?: number; // сила тряски «ручной камеры», px
  label?: string; // титр места и года
};

const WARM = 'contrast(1.08) saturate(1.12) sepia(0.12) brightness(1.02)';
const COLD = 'contrast(1.12) saturate(0.72) brightness(0.94) hue-rotate(-8deg)';

export const SCENES: Scene[] = [
  {src: '1_dance.mp4', from: 0, to: 258, rate: 0.58, volume: 0, zoom: [1.16, 1.34], x: [0, 0], y: [20, -50], grade: WARM, label: 'ПАРИЖ, 1844'},
  {src: '2_salon.mp4', from: 258, to: 353, trimBefore: 57, volume: 0.35, zoom: [1.32, 1.18], x: [40, -30], y: [0, 0], grade: WARM},
  {src: '3_duel.mp4', from: 353, to: 443, trimBefore: 36, rate: 1.3, volume: 0.6, zoom: [1.2, 1.32], x: [0, 0], y: [0, 30], grade: COLD, shake: 4, label: 'ДУЭЛЬ, 1845'},
  {src: '4_king.mp4', from: 443, to: 590, volume: 0.3, zoom: [1.16, 1.3], x: [-45, 40], y: [0, -10], grade: WARM, label: 'МЮНХЕН, 1847'},
  {src: '5_riot.mp4', from: 590, to: 717, trimBefore: 45, volume: 0.2, zoom: [1.2, 1.34], x: [0, 0], y: [10, -20], grade: 'contrast(1.14) saturate(1.05)', shake: 6, label: 'БУНТ, 1848'},
  {src: '6_final.mp4', from: 717, to: 945, rate: 0.67, volume: 0, zoom: [1.2, 1.48], x: [0, 0], y: [0, -40], grade: COLD, label: 'НЬЮ-ЙОРК, 1861'},
];

export const FADE = 8; // кадры наплыва между сценами
export const GUNSHOT = 381; // вспышка выстрела
