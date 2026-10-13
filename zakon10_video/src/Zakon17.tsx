// Закон 13 — быстрый монтаж на удержание (как вариант B Закона 11).
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FilmLook} from './Zakon11';
import {Smoke} from './Noir12';
import captions from './captions17.json';

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
export const Z17_TOTAL = s(79.6);

const FONT = 'Inter, "Inter Display", sans-serif';
const GOLD = '#E8B04B';
const RED = '#d4252b';
const END_AT = 72.66; // «Закон семнадцатый»

// focus — точка на фото (в %), которую ставим в центр кадра; zoom — крупность
type Shot = {at: number; src: string; zoom: [number, number]; focus: [number, number]; cut?: 'whoosh' | 'punch' | 'flash'};

// plane, chair, hall, spassky, fischer, trophy — фото, которые пришли файлами
const SHOTS: Shot[] = [
  {at: 0, src: 'chair.jpg', zoom: [1.0, 1.12], focus: [50, 55]}, // пустой стул
  {at: 1.64, src: 'chair.jpg', zoom: [1.9, 2.05], focus: [50, 47], cut: 'punch'}, // доска
  {at: 3.43, src: 'hall.jpg', zoom: [1.0, 1.08], focus: [50, 40], cut: 'whoosh'}, // 1972, зал
  {at: 5.6, src: 'hall.jpg', zoom: [2.6, 2.9], focus: [50, 52], cut: 'punch'}, // матч на сцене
  {at: 8.18, src: 'spassky.jpg', zoom: [1.0, 1.08], focus: [45, 40], cut: 'whoosh'}, // Спасский
  {at: 11.48, src: 'spassky.jpg', zoom: [1.9, 2.05], focus: [42, 31], cut: 'punch'}, // непобедимый
  {at: 13.44, src: 'fischer.jpg', zoom: [1.0, 1.08], focus: [50, 35], cut: 'whoosh'}, // Фишер
  {at: 15.2, src: 'fischer.jpg', zoom: [2.0, 2.15], focus: [44, 15], cut: 'punch'}, // лицо Фишера
  {at: 16.84, src: 'plane.jpg', zoom: [1.0, 1.1], focus: [50, 45], cut: 'whoosh'}, // не прилетает
  {at: 18.4, src: 'plane.jpg', zoom: [1.8, 1.95], focus: [30, 72], cut: 'punch'}, // пустое кресло
  {at: 19.7, src: 'hall.jpg', zoom: [1.3, 1.4], focus: [50, 45], cut: 'whoosh'}, // мир ждёт
  {at: 21.07, src: 'chair.jpg', zoom: [1.4, 1.5], focus: [50, 70], cut: 'punch'}, // без него
  {at: 22.98, src: 'fischer.jpg', zoom: [1.5, 1.65], focus: [55, 40], cut: 'whoosh'}, // требует денег
  {at: 24.5, src: 'fischer.jpg', zoom: [2.3, 2.45], focus: [44, 14], cut: 'punch'},
  {at: 26.24, src: 'spassky.jpg', zoom: [1.6, 1.75], focus: [55, 72], cut: 'punch'}, // фонд удваивают
  {at: 28.07, src: 'plane.jpg', zoom: [1.6, 1.75], focus: [75, 22], cut: 'whoosh'}, // прилетает
  {at: 30.3, src: 'chair.jpg', zoom: [2.2, 2.4], focus: [48, 46], cut: 'whoosh'}, // первая партия
  {at: 32.3, src: 'fischer.jpg', zoom: [2.5, 2.7], focus: [44, 14], cut: 'punch'}, // ошибка
  {at: 34.51, src: 'chair.jpg', zoom: [1.0, 1.12], focus: [50, 60], cut: 'flash'}, // не приходит
  {at: 37.18, src: 'chair.jpg', zoom: [2.6, 2.8], focus: [86, 48], cut: 'punch'}, // 0:2, часы
  {at: 38.7, src: 'spassky.jpg', zoom: [1.3, 1.4], focus: [45, 35], cut: 'punch'}, // всё кончено
  {at: 40.87, src: 'hall.jpg', zoom: [1.0, 1.06], focus: [50, 60], cut: 'whoosh'}, // убрать камеры и зрителей
  {at: 43.99, src: 'chair.jpg', zoom: [1.3, 1.45], focus: [50, 35], cut: 'whoosh'}, // задняя комната
  {at: 47.17, src: 'fischer.jpg', zoom: [1.6, 1.75], focus: [50, 28], cut: 'flash'}, // впервые побеждает
  {at: 50.11, src: 'spassky.jpg', zoom: [2.2, 2.35], focus: [42, 31], cut: 'whoosh'}, // теряет почву
  {at: 53.64, src: 'plane.jpg', zoom: [1.4, 1.5], focus: [30, 70], cut: 'punch'}, // опоздает?
  {at: 54.59, src: 'trophy.jpg', zoom: [2.0, 2.1], focus: [50, 85], cut: 'punch'}, // потребует?
  {at: 55.52, src: 'chair.jpg', zoom: [2.4, 2.5], focus: [50, 47], cut: 'punch'}, // гениально?
  {at: 57.13, src: 'spassky.jpg', zoom: [2.5, 2.7], focus: [42, 31], cut: 'punch'}, // не знает
  {at: 58.59, src: 'chair.jpg', zoom: [1.2, 1.3], focus: [50, 75], cut: 'whoosh'}, // рентген кресла
  {at: 62.58, src: 'chair.jpg', zoom: [2.6, 2.8], focus: [52, 72], cut: 'punch'}, // мухи
  {at: 65.16, src: 'trophy.jpg', zoom: [1.0, 1.08], focus: [50, 40], cut: 'flash'}, // чемпион
  {at: 67.0, src: 'trophy.jpg', zoom: [1.8, 1.95], focus: [45, 28], cut: 'punch'},
  {at: 68.81, src: 'fischer.jpg', zoom: [1.1, 1.2], focus: [50, 30], cut: 'whoosh'}, // оружие
  {at: 71.24, src: 'fischer.jpg', zoom: [2.6, 2.8], focus: [44, 14], cut: 'punch'}, // непредсказуемость
  {at: END_AT, src: 'fischer.jpg', zoom: [1.3, 1.45], focus: [44, 22], cut: 'flash'},
];

const SLAMS: {text: string; at: number; color?: string}[] = [
  {text: 'СПАССКИЙ', at: 9.9, color: GOLD},
  {text: 'ФИШЕР', at: 15.2, color: GOLD},
  {text: 'НЕ ПРИЛЕТЕЛ', at: 18.4, color: RED},
  {text: '× 2', at: 26.6, color: GOLD},
  {text: '0 : 2', at: 37.18, color: RED},
  {text: 'ПОБЕДА', at: 48.6, color: GOLD},
  {text: 'РЕНТГЕН', at: 61.0},
  {text: 'ЧЕМПИОН', at: 66.2, color: GOLD},
];

const PLACES: {text: string; at: number}[] = [
  {text: 'РЕЙКЬЯВИК, 1972', at: 3.5},
];

const W = 1080;
const H = 1920;

const ShotView: React.FC<{shot: Shot; length: number}> = ({shot, length}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, length], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  let zoom = interpolate(p, [0, 1], shot.zoom);
  if (shot.cut === 'punch') zoom *= interpolate(f, [0, 5], [1.07, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  if (shot.cut === 'whoosh') zoom *= interpolate(f, [0, 8], [1.12, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const blur = shot.cut === 'whoosh' ? interpolate(f, [0, 6], [10, 0], {extrapolateRight: 'clamp'}) : 0;
  const opacity = shot.cut === 'whoosh' ? interpolate(f, [0, 4], [0, 1], {extrapolateRight: 'clamp'}) : 1;
  // лицо — в центр кадра (чуть выше середины), но без пустых краёв
  const fx = (shot.focus[0] / 100) * W;
  const fy = (shot.focus[1] / 100) * H;
  const tx = Math.min(0, Math.max(W - W * zoom, W * 0.5 - fx * zoom));
  const ty = Math.min(0, Math.max(H - H * zoom, H * 0.4 - fy * zoom));
  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden', backgroundColor: 'black'}}>
      <Img
        src={staticFile(`z17/${shot.src}`)}
        style={{width: W, height: H, objectFit: 'cover', filter: `contrast(1.08) saturate(1.08) blur(${blur}px)`, transform: `translate(${tx}px, ${ty}px) scale(${zoom})`, transformOrigin: '0 0'}}
      />
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: '#fff8e8', opacity: interpolate(f, [0, 1, 7], [0, 0.85, 0], {extrapolateRight: 'clamp'})}} />;
};

const Slam: React.FC<{text: string; color?: string}> = ({text, color}) => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [0, 5], [1.9, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
  const o = interpolate(f, [0, 3, 22, 30], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', top: -120}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: text.length > 7 ? 140 : 180, letterSpacing: 6, color: color ?? 'white', opacity: o, transform: `scale(${scale})`, whiteSpace: 'nowrap', textShadow: '0 10px 40px rgba(0,0,0,0.95), 0 0 2px black', WebkitTextStroke: '3px rgba(0,0,0,0.6)'}}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame: f, fps, config: {damping: 16}});
  const out = interpolate(f, [s(2.6), s(3.2)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 210, opacity: a * out}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 60, color: 'white', textAlign: 'center', lineHeight: 1.2, maxWidth: 920, transform: `translateY(${(1 - a) * -30}px)`, textShadow: '0 4px 24px rgba(0,0,0,0.95)'}}>
        Он победил,
        <br />
        <span style={{color: GOLD}}>не сделав хода</span>
      </div>
    </AbsoluteFill>
  );
};

const Place: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  const shown = Math.floor(interpolate(f, [4, 4 + text.length * 2], [0, text.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const o = interpolate(f, [44, 56], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 170, left: 80, display: 'flex', alignItems: 'center', gap: 20, opacity: o}}>
      <div style={{width: 56, height: 3, background: RED}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: 'white', textShadow: '0 2px 12px rgba(0,0,0,0.9)'}}>{text.slice(0, shown)}</div>
    </div>
  );
};

type Word = {text: string; start: number; end: number};
type Line = {start: number; end: number; words: Word[]};

const Subs: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  if (t >= END_AT - 0.05) return null;
  const lines = captions as Line[];
  const idx = lines.findIndex((l, i) => t >= l.start - 0.05 && t < Math.min(lines[i + 1]?.start ?? 999, l.end + 0.6) - 0.05);
  if (idx < 0) return null;
  const line = lines[idx];
  const enter = spring({frame: f - Math.round((line.start - 0.05) * fps), fps, config: {damping: 18, stiffness: 200}});
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 1300}}>
      <div style={{width: 960, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 24px', transform: `translateY(${(1 - enter) * 22}px)`, opacity: enter}}>
        {line.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.05;
          return (
            <span key={i} style={{fontFamily: FONT, fontWeight: 800, fontSize: 76, lineHeight: 1.15, color: active ? GOLD : 'white', opacity: t >= w.start ? 1 : 0.45, display: 'inline-block', transform: `scale(${active ? 1.06 : 1})`, textShadow: '0 4px 0 rgba(0,0,0,0.85), 0 0 28px rgba(0,0,0,0.95)', WebkitTextStroke: '2px rgba(0,0,0,0.55)'}}>
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dark = interpolate(f, [0, 18], [0, 0.72], {extrapolateRight: 'clamp'});
  const a = spring({frame: f - 3, fps, config: {damping: 18}});
  const b = spring({frame: f - s(74.36 - END_AT), fps, config: {damping: 18}});
  const c = spring({frame: f - s(76.6 - END_AT), fps, config: {damping: 18}});
  return (
    <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${dark})`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 170, color: GOLD, letterSpacing: 10, opacity: a, transform: `scale(${0.85 + 0.15 * a})`, textShadow: '0 0 40px rgba(232,176,75,0.45), 0 8px 30px rgba(0,0,0,0.9)', whiteSpace: 'nowrap'}}>ЗАКОН 17</div>
      <div style={{width: 440 * b, height: 3, background: GOLD, margin: '30px 0'}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 58, color: 'white', textAlign: 'center', lineHeight: 1.25, maxWidth: 920, opacity: b, transform: `translateY(${(1 - b) * 20}px)`, textShadow: '0 4px 20px rgba(0,0,0,0.9)'}}>
        Того, кого нельзя
        <br />
        предсказать —
        <br />
        <span style={{color: GOLD}}>невозможно победить</span>
      </div>
      <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 46, color: '#e9dccb', textAlign: 'center', lineHeight: 1.3, marginTop: 60, opacity: c, transform: `translateY(${(1 - c) * 20}px)`, textShadow: '0 4px 20px rgba(0,0,0,0.9)'}}>
        Будь <span style={{color: GOLD, fontWeight: 800}}>непредсказуемым</span>
      </div>
    </AbsoluteFill>
  );
};

// Дым и искры поверх огня
const SmokeLayer: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1080} height={1920}>
        <Smoke x={250} y={1900} frame={f} count={16} />
        <Smoke x={800} y={1950} frame={f + 40} count={16} />
        {Array.from({length: 26}).map((_, i) => {
          const life = 70;
          const t = ((f + i * 9) % life) / life;
          const x = random(`ex${i}`) * 1080 + Math.sin(t * 8 + i) * 30;
          const y = 1900 - t * 1300;
          return <circle key={i} cx={x} cy={y} r={3 + random(`er${i}`) * 3} fill="#ffb347" opacity={(1 - t) * 0.9} style={{filter: 'drop-shadow(0 0 6px #ff7a1a)'}} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', top: 0, left: 0, height: 8, width: `${(f / Z17_TOTAL) * 100}%`, background: GOLD, boxShadow: `0 0 12px ${GOLD}`}} />;
};

export const Zakon17: React.FC = () => {
  const f = useCurrentFrame();
  let dx = 0;
  let dy = 0;
  for (const sl of SLAMS) {
    const d = f - s(sl.at);
    if (d >= 0 && d < 10) {
      const k = (1 - d / 10) * 14;
      dx += (random(`sx${f}`) - 0.5) * k;
      dy += (random(`sy${f}`) - 0.5) * k;
    }
  }
  const fadeOutAll = interpolate(f, [Z17_TOTAL - 15, Z17_TOTAL], [1, 0], {extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <AbsoluteFill style={{opacity: fadeOutAll}}>
        <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(1.02)`}}>
          {SHOTS.map((sh, i) => {
            const from = s(sh.at);
            const to = i + 1 < SHOTS.length ? s(SHOTS[i + 1].at) : Z17_TOTAL;
            return (
              <Sequence key={`${sh.src}-${sh.at}`} from={from} durationInFrames={to - from} premountFor={30}>
                <ShotView shot={sh} length={to - from} />
              </Sequence>
            );
          })}
        </AbsoluteFill>
        {([] as {from: number; to: number}[]).map((z) => (
          <Sequence key={`smoke-${z.from}`} from={s(z.from)} durationInFrames={s(z.to - z.from)}>
            <SmokeLayer />
          </Sequence>
        ))}
        <FilmLook />
        {SHOTS.filter((sh) => sh.cut === 'flash').map((sh) => (
          <Sequence key={`fl-${sh.at}`} from={s(sh.at)} durationInFrames={8}>
            <Flash />
          </Sequence>
        ))}
        <Sequence durationInFrames={s(3.3)}>
          <Hook />
        </Sequence>
        {PLACES.map((p) => (
          <Sequence key={p.text} from={s(p.at)} durationInFrames={58}>
            <Place text={p.text} />
          </Sequence>
        ))}
        {SLAMS.map((sl) => (
          <Sequence key={sl.text} from={s(sl.at)} durationInFrames={30}>
            <Slam text={sl.text} color={sl.color} />
          </Sequence>
        ))}
        <Subs />
        <Sequence from={s(END_AT)}>
          <EndCard />
        </Sequence>
        <Progress />
      </AbsoluteFill>

      {/* Звук */}
      <Audio src={staticFile('z17/voice.mp3')} volume={1} />
      <Audio src={staticFile('drone.mp3')} volume={(fr) => interpolate(fr, [0, 20, Z17_TOTAL - 60, Z17_TOTAL], [0, 0.14, 0.14, 0], {extrapolateRight: 'clamp'})} />
      <Audio src={staticFile('z11/pulse.wav')} volume={(fr) => interpolate(fr, [0, 30, s(END_AT) - 10, s(END_AT)], [0, 0.35, 0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {SHOTS.filter((sh) => sh.cut === 'whoosh').map((sh) => (
        <Sequence key={`w-${sh.at}`} from={Math.max(0, s(sh.at) - 6)} durationInFrames={20}>
          <Audio src={staticFile('z11/whoosh.wav')} volume={0.35} />
        </Sequence>
      ))}
      {SLAMS.map((sl) => (
        <Sequence key={`b-${sl.text}`} from={s(sl.at)} durationInFrames={45}>
          <Audio src={staticFile('z11/boom.wav')} volume={0.6} />
        </Sequence>
      ))}
      {([] as {from: number; to: number}[]).map((z) => (
        <Sequence key={`fire-${z.from}`} from={s(z.from)} durationInFrames={s(z.to - z.from)}>
          <Audio src={staticFile('z12/rain.wav')} volume={(fr) => interpolate(fr, [0, 10, s(z.to - z.from) - 10, s(z.to - z.from)], [0, 0.3, 0.3, 0], {extrapolateRight: 'clamp'})} />
        </Sequence>
      ))}
      <Sequence from={s(37.18)} durationInFrames={40}>
        <Audio src={staticFile('z12/clank.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={s(26.24)} durationInFrames={20}>
        <Audio src={staticFile('z12/cash.wav')} volume={0.6} />
      </Sequence>
      <Audio src={staticFile('z17/tick.wav')} loop volume={(fr) => interpolate(fr, [0, 20, s(END_AT) - 10, s(END_AT)], [0, 0.22, 0.32, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      <Sequence from={s(34.51)} durationInFrames={s(2.6)}>
        <Audio src={staticFile('z17/tick.wav')} volume={0.7} />
      </Sequence>
      <Sequence from={s(END_AT) - s(2.0)} durationInFrames={s(2.1)}>
        <Audio src={staticFile('z11/riser.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={s(END_AT)} durationInFrames={45}>
        <Audio src={staticFile('z11/boom.wav')} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
