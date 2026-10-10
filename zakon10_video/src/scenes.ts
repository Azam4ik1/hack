// Таймлайн (30 fps). Границы сцен подогнаны под паузы в озвучке.
export type Scene = {
  src: string;
  from: number; // кадр начала
  to: number; // кадр конца
  trimBefore?: number; // кадры исходника, которые пропускаем
  rate?: number; // скорость: <1 — замедление
  volume: number; // громкость родного звука клипа
  still?: boolean; // неподвижная картинка вместо видео
  // Движение камеры: масштаб и сдвиг в начале и в конце сцены.
  // Минимум 1.07 — чтобы срезать водяные знаки по углам.
  zoom: [number, number];
  x: [number, number];
  y: [number, number];
  grade: string; // CSS-фильтр цветокоррекции
  shake?: number; // тряска «ручной камеры», px
  label?: string; // титр места и года
};

const s = (sec: number) => Math.round(sec * 30);

const WARM = 'contrast(1.08) saturate(1.12) sepia(0.12) brightness(1.02)';
const COLD = 'contrast(1.12) saturate(0.72) brightness(0.94) hue-rotate(-8deg)';
const MEMORY = 'grayscale(0.85) contrast(1.15) brightness(0.85) sepia(0.15)';
const OLD_PHOTO = 'sepia(0.55) contrast(1.1) brightness(0.95) saturate(0.8)';

export const SCENES: Scene[] = [
  // Вступление: «Закон десятый. Заражение. Избегай…»
  {src: '1_dance.mp4', from: 0, to: s(5.3), rate: 0.5, volume: 0, zoom: [1.1, 1.14], x: [0, 0], y: [0, -15], grade: WARM},
  // «Несчастье — как болезнь…»
  {src: '0_ink.mp4', from: s(5.3), to: s(15.1), rate: 0.52, volume: 0, zoom: [1.07, 1.13], x: [0, 0], y: [0, 0], grade: 'contrast(1.1)'},
  // «Вот история… Её звали Лола Монтес»
  {src: '1_dance.mp4', from: s(15.1), to: s(20.1), trimBefore: s(2.6), rate: 0.49, volume: 0, zoom: [1.1, 1.14], x: [0, 0], y: [0, -10], grade: WARM},
  // «Простая девушка из Ирландии…»
  {src: 'girl.jpg', still: true, from: s(20.1), to: s(24.67), volume: 0, zoom: [1.12, 1.07], x: [20, -20], y: [0, 0], grade: OLD_PHOTO, label: 'ИРЛАНДИЯ'},
  // «Она танцевала так, что мужчины теряли голову»
  {src: '1_dance.mp4', from: s(24.67), to: s(28.14), rate: 1.45, volume: 0, zoom: [1.1, 1.12], x: [0, 0], y: [0, 0], grade: WARM},
  // «В Париже её полюбил Дюжарье… жизнь пошла под откос»
  {src: '2_salon.mp4', from: s(28.14), to: s(38.6), rate: 0.49, volume: 0, zoom: [1.12, 1.07], x: [15, -15], y: [0, 0], grade: WARM, label: 'ПАРИЖ, 1845'},
  // «Вскоре его вызвали на дуэль… и убили»
  {src: '3_duel.mp4', from: s(38.6), to: s(42.36), trimBefore: s(1), rate: 1.2, volume: 0, zoom: [1.13, 1.16], x: [0, 0], y: [0, 10], grade: COLD, shake: 3, label: 'ДУЭЛЬ'},
  // «Тогда Лола уехала в Мюнхен… Людвига Первого»
  {src: '4_king.mp4', from: s(42.36), to: s(48.09), rate: 0.89, volume: 0.3, zoom: [1.07, 1.12], x: [-15, 15], y: [0, 0], grade: WARM, label: 'МЮНХЕН, 1846'},
  // «…осыпал её подарками и сделал графиней»
  {src: '7_necklace.mp4', from: s(48.09), to: s(52.41), rate: 0.95, volume: 0.3, zoom: [1.07, 1.11], x: [0, 0], y: [0, -10], grade: WARM},
  // «Народ возненавидел её… Король потерял трон»
  {src: '5_riot.mp4', from: s(52.41), to: s(60.92), volume: 0.18, zoom: [1.11, 1.15], x: [0, 0], y: [0, -10], grade: 'contrast(1.14) saturate(1.05)', shake: 4, label: '1848'},
  // «А сама Лола умерла в Нью-Йорке…»
  {src: '6_final.mp4', from: s(60.92), to: s(68.39), rate: 0.68, volume: 0, zoom: [1.08, 1.15], x: [0, 0], y: [0, -15], grade: COLD, label: 'НЬЮ-ЙОРК, 1861'},
  // «Куда бы она ни пришла, за ней шла беда…» — воспоминания
  {src: '3_duel.mp4', from: s(68.39), to: s(71.14), trimBefore: s(6), rate: 1.45, volume: 0, zoom: [1.15, 1.12], x: [0, 0], y: [0, 0], grade: MEMORY},
  {src: '5_riot.mp4', from: s(71.14), to: s(73.9), trimBefore: s(7.2), volume: 0, zoom: [1.11, 1.14], x: [0, 0], y: [0, 0], grade: MEMORY},
  // «Смотри, кто рядом с тобой…»
  {src: '9_cross.mp4', from: s(73.9), to: s(84), rate: 0.5, volume: 0, zoom: [1.07, 1.13], x: [0, 0], y: [0, -10], grade: 'contrast(1.08) saturate(1.08)'},
];

export const TOTAL = s(84);
export const FADE = 8; // кадры наплыва между сценами
export const GUNSHOT = s(39.55); // вспышка выстрела на слове «дуэль»
export const NAME_AT = s(17.88); // «Её звали Лола Монтес»
export const END_AT = s(80.6); // финальная карточка
export const SKIP_CAPTIONS = 2; // «Закон десятый.» и «Заражение.» уже на титре
