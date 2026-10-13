// Закон 12 — экран пополам: сверху фото, снизу нуар-анимация.
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {Hook, NOIR12_FULL_TOTAL, Noir12Full, PLACES, Place, Progress, SLAMS, Slam, Subs, T} from './Noir12Full';

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
const HALF = 960;
const GOLD = '#E8B04B';

type Photo = {at: number; src: string; focus: [number, number]; zoom: [number, number]; dim?: number};

// Фото сверху: врезки на лица и детали в такт истории
const PHOTOS: Photo[] = [
  {at: 0, src: 'ph_chicago.jpg', focus: [50, 30], zoom: [1.0, 1.1]}, // Чикаго ночью
  {at: 3.83, src: 'ph_chicago.jpg', focus: [14, 62], zoom: [1.35, 1.5]}, // гангстеры с автоматами
  {at: 6.64, src: 'ph_chicago.jpg', focus: [96, 24], zoom: [1.2, 1.32]}, // неон CHICAGO
  {at: T.office, src: 'ph7.jpg', focus: [72, 30], zoom: [1.7, 1.9]}, // Капоне
  {at: T.threat, src: 'ph6.jpg', focus: [55, 14], zoom: [1.25, 1.4]}, // сигара и охранник
  {at: T.door, src: 'ph5.jpg', focus: [45, 20], zoom: [1.5, 1.65]}, // Люстиг
  {at: T.eiffel, src: 'ph7.jpg', focus: [24, 32], zoom: [1.5, 1.65]}, // Люстиг сидит
  {at: T.meet, src: 'ph7.jpg', focus: [50, 42], zoom: [1.0, 1.1]}, // встреча
  {at: T.briefcase, src: 'ph6.jpg', focus: [50, 50], zoom: [1.0, 1.12]}, // чемодан
  {at: T.vault, src: 'ph5.jpg', focus: [50, 30], zoom: [1.0, 1.1]}, // сейф
  {at: T.calendar, src: 'ph5.jpg', focus: [32, 60], zoom: [1.6, 1.7]}, // деньги в руках
  {at: T.ret, src: 'ph4.jpg', focus: [50, 38], zoom: [1.0, 1.08]}, // возврат
  {at: 45.0, src: 'ph4.jpg', focus: [58, 66], zoom: [1.5, 1.6]}, // пачки на столе
  {at: T.shock, src: 'ph4.jpg', focus: [24, 36], zoom: [1.6, 1.8]}, // Капоне поражён
  {at: T.gift, src: 'ph3.jpg', focus: [50, 55], zoom: [1.0, 1.1]}, // 5 000
  {at: T.plan, src: 'ph3.jpg', focus: [68, 22], zoom: [1.6, 1.8]}, // улыбка Люстига
  {at: T.end, src: 'ph5.jpg', focus: [45, 22], zoom: [1.4, 1.6], dim: 0.55}, // финал
];

// Какую часть анимации показываем снизу (сдвиг вверх в пикселях)
const OFFSETS: {at: number; y: number}[] = [
  {at: 0, y: -620},
  {at: T.office, y: -660},
  {at: T.door, y: -560},
  {at: T.eiffel, y: -400},
  {at: T.meet, y: -640},
  {at: T.calendar, y: -440},
  {at: T.ret, y: -640},
  {at: T.plan, y: -560},
  {at: T.end, y: -520},
];

const PhotoShot: React.FC<{p: Photo; length: number}> = ({p, length}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, length], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const zoom = interpolate(t, [0, 1], p.zoom) * interpolate(f, [0, 6], [1.06, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const [fx, fy] = p.focus;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(`z12/${p.src}`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${fx}% ${fy}%`,
          transform: `scale(${zoom})`,
          transformOrigin: `${fx}% ${fy}%`,
          filter: `contrast(1.06) saturate(1.05) brightness(${p.dim ?? 1})`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Split12: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  let off = OFFSETS[0].y;
  for (const o of OFFSETS) if (t >= o.at) off = o.y;
  const fadeOut = interpolate(f, [NOIR12_FULL_TOTAL - 15, NOIR12_FULL_TOTAL], [1, 0], {extrapolateLeft: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <AbsoluteFill style={{opacity: fadeOut}}>
        {/* Верх: фото */}
        <div style={{position: 'absolute', top: 0, left: 0, width: 1080, height: HALF, overflow: 'hidden'}}>
          {PHOTOS.map((p, i) => {
            const from = s(p.at);
            const to = i + 1 < PHOTOS.length ? s(PHOTOS[i + 1].at) : NOIR12_FULL_TOTAL;
            return (
              <Sequence key={`${p.src}-${p.at}`} from={from} durationInFrames={to - from}>
                <PhotoShot p={p} length={to - from} />
              </Sequence>
            );
          })}
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
          <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.7) 100%)'}} />
        </div>

        {/* Низ: анимация */}
        <div style={{position: 'absolute', top: HALF, left: 0, width: 1080, height: HALF, overflow: 'hidden'}}>
          <div style={{position: 'absolute', top: off, left: 0, width: 1080, height: 1920}}>
            <Noir12Full mode="visual" />
          </div>
          <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 25%)'}} />
        </div>

        {/* Стык */}
        <div style={{position: 'absolute', top: HALF - 2, left: 0, width: 1080, height: 4, background: GOLD, boxShadow: `0 0 16px ${GOLD}`}} />

        {/* Тексты */}
        <Sequence durationInFrames={s(3.8)}>
          <Hook top={250} />
        </Sequence>
        {PLACES.map((p) => (
          <Sequence key={p.text} from={s(p.at)} durationInFrames={54}>
            <Place text={p.text} top={HALF + 40} />
          </Sequence>
        ))}
        {SLAMS.map((sl) => (
          <Sequence key={sl.text} from={s(sl.at)} durationInFrames={34}>
            <Slam text={sl.text} color={sl.color} top={360} />
          </Sequence>
        ))}
        <Subs top={HALF - 70} />
        <Progress />
      </AbsoluteFill>

      {/* Звук — из полной версии */}
      <Noir12Full mode="audio" />
    </AbsoluteFill>
  );
};
