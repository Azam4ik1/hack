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
import captions from './captions13.json';

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
export const Z13_TOTAL = s(75.3);

const FONT = 'Inter, "Inter Display", sans-serif';
const GOLD = '#E8B04B';
const RED = '#d4252b';
const END_AT = 63.17; // «Закон тринадцатый»

// focus — точка на фото (в %), которую ставим в центр кадра; zoom — крупность
type Shot = {at: number; src: string; zoom: [number, number]; focus: [number, number]; cut?: 'whoosh' | 'punch' | 'flash'};

// p1 Каструччо на троне, p2 коронация, p3 мятеж, p4 Стефано на коленях, p5 холодное лицо и стража,
// p6 горящее знамя, p7 Афины, p8 посол Коринфа, p9 посол Коркиры, p10 флот
const SHOTS: Shot[] = [
  {at: 0, src: 'p4.jpg', zoom: [2.0, 2.2], focus: [18, 38]}, // Стефано просит
  {at: 1.75, src: 'p5.jpg', zoom: [1.9, 2.1], focus: [50, 36], cut: 'punch'}, // Каструччо отказывает
  {at: 3.28, src: 'p1.jpg', zoom: [1.0, 1.08], focus: [48, 30], cut: 'whoosh'},
  {at: 5.46, src: 'p1.jpg', zoom: [2.3, 2.5], focus: [48, 26], cut: 'punch'}, // «неправильно»
  {at: 7.33, src: 'p2.jpg', zoom: [1.0, 1.08], focus: [50, 30], cut: 'whoosh'}, // Италия
  {at: 9.41, src: 'p2.jpg', zoom: [1.6, 1.7], focus: [75, 8], cut: 'punch'}, // башни Лукки
  {at: 10.79, src: 'p1.jpg', zoom: [1.6, 1.9], focus: [48, 26], cut: 'whoosh'}, // Каструччо Кастракани
  {at: 13.2, src: 'p2.jpg', zoom: [2.0, 2.2], focus: [85, 46], cut: 'punch'}, // семья Поджо
  {at: 15.66, src: 'p3.jpg', zoom: [1.0, 1.08], focus: [50, 45], cut: 'whoosh'}, // мятеж
  {at: 17.6, src: 'p3.jpg', zoom: [2.0, 2.2], focus: [47, 51], cut: 'punch'}, // лицо мятежника
  {at: 19.53, src: 'p4.jpg', zoom: [1.0, 1.06], focus: [45, 40], cut: 'whoosh'}, // старейшина пришёл
  {at: 21.0, src: 'p4.jpg', zoom: [2.2, 2.4], focus: [18, 38], cut: 'punch'}, // Стефано
  {at: 22.39, src: 'p4.jpg', zoom: [1.8, 1.95], focus: [40, 53], cut: 'punch'}, // руки — просит пощады
  {at: 24.85, src: 'p4.jpg', zoom: [2.4, 2.6], focus: [18, 38], cut: 'punch'}, // «Вспомни, мы помогли…»
  {at: 28.75, src: 'p4.jpg', zoom: [2.3, 2.5], focus: [67, 22], cut: 'punch'}, // Каструччо слушает
  {at: 30.25, src: 'p5.jpg', zoom: [1.6, 2.0], focus: [50, 36], cut: 'flash'}, // выслушал…
  {at: 32.2, src: 'p5.jpg', zoom: [2.0, 2.15], focus: [25, 25], cut: 'punch'}, // стража с мечами
  {at: 33.92, src: 'p6.jpg', zoom: [1.0, 1.1], focus: [60, 70], cut: 'whoosh'}, // горящее знамя
  {at: 38.12, src: 'p7.jpg', zoom: [1.0, 1.06], focus: [50, 30], cut: 'whoosh'}, // Греция
  {at: 41.6, src: 'p7.jpg', zoom: [2.0, 2.15], focus: [20, 54], cut: 'punch'}, // послы двух городов
  {at: 45.25, src: 'p7.jpg', zoom: [1.8, 1.95], focus: [40, 8], cut: 'punch'}, // Афины
  {at: 48.04, src: 'p8.jpg', zoom: [2.0, 2.2], focus: [40, 23], cut: 'whoosh'}, // посол Коринфа
  {at: 50.4, src: 'p8.jpg', zoom: [2.3, 2.45], focus: [62, 30], cut: 'punch'}, // афинянину скучно
  {at: 52.36, src: 'p9.jpg', zoom: [2.0, 2.2], focus: [28, 26], cut: 'whoosh'}, // посол Коркиры
  {at: 55.2, src: 'p9.jpg', zoom: [1.8, 1.95], focus: [83, 37], cut: 'punch'}, // флот
  {at: 57.2, src: 'p9.jpg', zoom: [2.0, 2.15], focus: [65, 60], cut: 'punch'}, // афиняне задумались
  {at: 59.32, src: 'p10.jpg', zoom: [1.0, 1.08], focus: [50, 50], cut: 'flash'}, // выбрали Коркиру
  {at: 61.4, src: 'p10.jpg', zoom: [1.4, 1.5], focus: [40, 55], cut: 'punch'},
  {at: END_AT, src: 'p1.jpg', zoom: [1.4, 1.6], focus: [48, 26], cut: 'flash'},
];

const SLAMS: {text: string; at: number; color?: string}[] = [
  {text: 'КАСТРУЧЧО', at: 11.4, color: GOLD},
  {text: 'МЯТЕЖ', at: 18.3, color: RED},
  {text: 'КАЗНИЛ', at: 32.55, color: RED},
  {text: 'РАЗОЗЛИЛО', at: 36.55, color: RED},
  {text: 'КОРИНФ', at: 48.1},
  {text: 'КОРКИРА', at: 52.45, color: GOLD},
  {text: 'ФЛОТ', at: 54.6, color: GOLD},
  {text: 'ВЫГОДА', at: 59.9, color: GOLD},
];

const PLACES: {text: string; at: number}[] = [
  {text: 'ЛУККА, 1320', at: 7.4},
  {text: 'АФИНЫ, 433 г. до н. э.', at: 40.2},
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
        src={staticFile(`z13/${shot.src}`)}
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
  const out = interpolate(f, [s(6.3), s(6.8)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 210, opacity: a * out}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 60, color: 'white', textAlign: 'center', lineHeight: 1.2, maxWidth: 920, transform: `translateY(${(1 - a) * -30}px)`, textShadow: '0 4px 24px rgba(0,0,0,0.95)'}}>
        Почему тебе
        <br />
        <span style={{color: RED}}>ОТКАЗЫВАЮТ</span> в помощи?
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
  const b = spring({frame: f - s(64.8 - END_AT), fps, config: {damping: 18}});
  const c = spring({frame: f - s(69.72 - END_AT), fps, config: {damping: 18}});
  return (
    <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${dark})`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 170, color: GOLD, letterSpacing: 10, opacity: a, transform: `scale(${0.85 + 0.15 * a})`, textShadow: '0 0 40px rgba(232,176,75,0.45), 0 8px 30px rgba(0,0,0,0.9)', whiteSpace: 'nowrap'}}>ЗАКОН 13</div>
      <div style={{width: 440 * b, height: 3, background: GOLD, margin: '30px 0'}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 58, color: 'white', textAlign: 'center', lineHeight: 1.25, maxWidth: 920, opacity: b, transform: `translateY(${(1 - b) * 20}px)`, textShadow: '0 4px 20px rgba(0,0,0,0.9)'}}>
        Прося о помощи,
        <br />
        говори о <span style={{color: GOLD}}>выгоде</span>,
        <br />а не о жалости и долге
      </div>
      <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 46, color: '#e9dccb', textAlign: 'center', lineHeight: 1.3, marginTop: 60, opacity: c, transform: `translateY(${(1 - c) * 20}px)`, textShadow: '0 4px 20px rgba(0,0,0,0.9)'}}>
        Жалость заканчивается.
        <br />
        <span style={{color: GOLD, fontWeight: 800}}>Интерес остаётся.</span>
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
  return <div style={{position: 'absolute', top: 0, left: 0, height: 8, width: `${(f / Z13_TOTAL) * 100}%`, background: GOLD, boxShadow: `0 0 12px ${GOLD}`}} />;
};

export const Zakon13: React.FC = () => {
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
  const fadeOutAll = interpolate(f, [Z13_TOTAL - 15, Z13_TOTAL], [1, 0], {extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <AbsoluteFill style={{opacity: fadeOutAll}}>
        <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(1.02)`}}>
          {SHOTS.map((sh, i) => {
            const from = s(sh.at);
            const to = i + 1 < SHOTS.length ? s(SHOTS[i + 1].at) : Z13_TOTAL;
            return (
              <Sequence key={`${sh.src}-${sh.at}`} from={from} durationInFrames={to - from} premountFor={30}>
                <ShotView shot={sh} length={to - from} />
              </Sequence>
            );
          })}
        </AbsoluteFill>
        {[{from: 15.66, to: 19.53}, {from: 33.92, to: 38.12}].map((z) => (
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
        <Sequence durationInFrames={s(6.9)}>
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
      <Audio src={staticFile('z13/voice.mp3')} volume={1} />
      <Audio src={staticFile('drone.mp3')} volume={(fr) => interpolate(fr, [0, 20, Z13_TOTAL - 60, Z13_TOTAL], [0, 0.14, 0.14, 0], {extrapolateRight: 'clamp'})} />
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
      {[{from: 15.66, to: 19.53}, {from: 33.92, to: 38.12}].map((z) => (
        <Sequence key={`fire-${z.from}`} from={s(z.from)} durationInFrames={s(z.to - z.from)}>
          <Audio src={staticFile('z12/rain.wav')} volume={(fr) => interpolate(fr, [0, 10, s(z.to - z.from) - 10, s(z.to - z.from)], [0, 0.3, 0.3, 0], {extrapolateRight: 'clamp'})} />
        </Sequence>
      ))}
      <Sequence from={s(32.55)} durationInFrames={40}>
        <Audio src={staticFile('z12/clank.wav')} volume={0.7} />
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
