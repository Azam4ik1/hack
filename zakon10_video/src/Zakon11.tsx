import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import captions from './captions11.json';

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

export const Z11_TOTAL = s(73.4);

const FONT = 'Inter, "Inter Display", sans-serif';
const GOLD = '#E8B04B';
const FADE = 10; // кадры наплыва
const END_AT = s(66.48); // «Закон 11»
const PHRASE_AT = s(68.56); // «Делай так, чтобы…»
const ease = Easing.bezier(0.45, 0, 0.55, 1);

type Shot = {
  src: string;
  from: number;
  to: number;
  video?: boolean;
  trimBefore?: number;
  rate?: number;
  zoom: [number, number];
  x?: [number, number];
  y?: [number, number];
  origin?: string; // точка, к которой идёт наезд
};

// Таймлайн по голосу (см. zakon11_handoff.md)
const SHOTS: Shot[] = [
  // 1. Хук: «Хочешь, чтобы тебя никогда не уволили…»
  {src: 'v1_portrait.mp4', video: true, from: 0, to: s(7.24), rate: 0.7, zoom: [1, 1.04]},
  // 2. «Давным-давно в Германии жил король…»
  {src: 'p2_king.jpg', from: s(7.24), to: s(12.68), zoom: [1.02, 1.1], origin: '30% 55%'},
  // 3. «Все вокруг были против него…»
  {src: 'v3_ministers.mp4', video: true, from: s(12.68), to: s(18.6), rate: 0.86, zoom: [1, 1.04]},
  // «Его звали Бисмарк»
  {src: 'p1_portrait.jpg', from: s(18.6), to: s(20.45), zoom: [1.08, 1.14], origin: '50% 25%'},
  // «Почему он выбрал слабого короля?…»
  {src: 'p3_ministers.jpg', from: s(20.45), to: s(26.15), zoom: [1.03, 1.12], origin: '70% 30%'},
  // «А слабый без помощника — никто»
  {src: 'p2_king.jpg', from: s(26.15), to: s(29.16), zoom: [1.18, 1.3], origin: '25% 55%'},
  // 4. «Потом король умер»
  {src: 'v4_candle.mp4', video: true, from: s(29.16), to: s(32.36), trimBefore: s(1.9), zoom: [1, 1.03]},
  // 5. «Новый король… хотел бросить корону»
  {src: 'v5_crown.mp4', video: true, from: s(32.36), to: s(37.96), rate: 0.91, zoom: [1, 1.04]},
  // 6. «Не бойтесь. Я всё сделаю за вас»
  {src: 'p6_shoulder.jpg', from: s(37.96), to: s(42.34), zoom: [1.02, 1.1], origin: '45% 40%'},
  // 7. «Выигрывал войны. Объединил страну»
  {src: 'p7_map.jpg', from: s(42.34), to: s(48.22), zoom: [1.1, 1.02], origin: '50% 70%'},
  // 8. «Прошли годы. Король носил корону»
  {src: 'p5_crown.jpg', from: s(48.22), to: s(51.42), zoom: [1.02, 1.09], origin: '50% 60%'},
  // «Но решал всё Бисмарк…»
  {src: 'p8_whisper.jpg', from: s(51.42), to: s(56.44), zoom: [1.02, 1.1], origin: '60% 30%'},
  // 9. «Бисмарк понял главное…»
  {src: 'v9_window.mp4', video: true, from: s(56.44), to: s(63.3), rate: 0.744, zoom: [1, 1.04]},
  // «А если тебя легко заменить — тебя заменят» — пустой трон
  {src: 'p4_throne.jpg', from: s(63.3), to: s(66.48), zoom: [1.02, 1.1], origin: '65% 60%'},
  // Финал
  {src: 'p1_portrait.jpg', from: s(66.48), to: Z11_TOTAL, zoom: [1.02, 1.08], origin: '50% 25%'},
];

const ShotView: React.FC<{shot: Shot; length: number; fadeIn: boolean}> = ({shot, length, fadeIn}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, length], [0, 1], {extrapolateRight: 'clamp', easing: ease});
  const zoom = interpolate(p, [0, 1], shot.zoom);
  const x = shot.x ? interpolate(p, [0, 1], shot.x) : 0;
  const y = shot.y ? interpolate(p, [0, 1], shot.y) : 0;
  const opacity = fadeIn ? interpolate(f, [0, FADE], [0, 1], {extrapolateRight: 'clamp'}) : 1;
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'contrast(1.05) saturate(1.05)',
    transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    transformOrigin: shot.origin ?? '50% 50%',
  };
  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden', backgroundColor: 'black'}}>
      {shot.video ? (
        <OffthreadVideo
          src={staticFile(`z11/${shot.src}`)}
          trimBefore={shot.trimBefore}
          playbackRate={shot.rate ?? 1}
          volume={0.1}
          style={style}
        />
      ) : (
        <Img src={staticFile(`z11/${shot.src}`)} style={style} />
      )}
    </AbsoluteFill>
  );
};

export const FilmLook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 88%, rgba(0,0,0,0.8) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)'}} />
      <svg width="1080" height="1920" style={{position: 'absolute', opacity: 0.06, mixBlendMode: 'overlay'}}>
        <filter id="grain11">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 60} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain11)" />
      </svg>
    </AbsoluteFill>
  );
};

// Субтитры: слово за словом, текущее слово золотое
type Word = {text: string; start: number; end: number};
type Line = {start: number; end: number; words: Word[]};

export const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  if (f >= END_AT - 2) return null; // финал — свой титр
  const lines = captions as Line[];
  const idx = lines.findIndex((l, i) => t >= l.start - 0.05 && t < Math.min(lines[i + 1]?.start ?? 999, l.end + 0.6) - 0.05);
  if (idx < 0) return null;
  const line = lines[idx];
  const local = f - Math.round((line.start - 0.05) * fps);
  const enter = spring({frame: local, fps, config: {damping: 18, stiffness: 200}});

  return (
    <AbsoluteFill style={{alignItems: 'center', top: 1300}}>
      <div
        style={{
          width: 940,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '4px 24px',
          transform: `translateY(${(1 - enter) * 22}px)`,
          opacity: enter,
        }}
      >
        {line.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.05;
          const spoken = t >= w.start;
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 76,
                lineHeight: 1.15,
                color: active ? GOLD : 'white',
                opacity: spoken ? 1 : 0.45,
                display: 'inline-block',
                transform: `scale(${active ? 1.06 : 1})`,
                textShadow: '0 4px 0 rgba(0,0,0,0.85), 0 0 28px rgba(0,0,0,0.95)',
                WebkitTextStroke: '2px rgba(0,0,0,0.55)',
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const NameCard: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame: f, fps, config: {damping: 20}});
  const out = interpolate(f, [44, 56], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 260, opacity: out * a}}>
      <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 42, letterSpacing: 14, color: GOLD, textShadow: "0 3px 14px rgba(0,0,0,0.9)"}}>ОТТО ФОН</div>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 120, letterSpacing: 10 * a, color: 'white', textShadow: '0 6px 30px rgba(0,0,0,0.9)'}}>
        БИСМАРК
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dark = interpolate(f, [0, 18], [0, 0.7], {extrapolateRight: 'clamp'});
  const a = spring({frame: f - 4, fps, config: {damping: 18}});
  const b = spring({frame: f - (PHRASE_AT - END_AT), fps, config: {damping: 18}});
  return (
    <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${dark})`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 170, color: GOLD, letterSpacing: 10, opacity: a, transform: `scale(${0.85 + 0.15 * a})`, textShadow: '0 0 40px rgba(232,176,75,0.45), 0 8px 30px rgba(0,0,0,0.9)', whiteSpace: 'nowrap'}}>
        ЗАКОН 11
      </div>
      <div style={{width: 440 * b, height: 3, background: GOLD, margin: '30px 0'}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 60, color: 'white', textAlign: 'center', lineHeight: 1.25, maxWidth: 900, opacity: b, transform: `translateY(${(1 - b) * 20}px)`, textShadow: '0 4px 20px rgba(0,0,0,0.9)'}}>
        Делай так, чтобы люди
        <br />
        зависели от тебя
      </div>
    </AbsoluteFill>
  );
};

export const Zakon11: React.FC = () => {
  const f = useCurrentFrame();
  const fadeOutAll = interpolate(f, [Z11_TOTAL - 15, Z11_TOTAL], [1, 0], {extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <AbsoluteFill style={{opacity: fadeOutAll}}>
        {SHOTS.map((sh, i) => {
          const from = i === 0 ? sh.from : sh.from - FADE;
          const length = sh.to - from;
          return (
            <Sequence key={`${sh.src}-${sh.from}`} from={from} durationInFrames={length} premountFor={30}>
              <ShotView shot={sh} length={length} fadeIn={i > 0} />
            </Sequence>
          );
        })}
        <FilmLook />
        <Sequence from={s(19.2)} durationInFrames={58}>
          <NameCard />
        </Sequence>
        <Subtitles />
        <Sequence from={END_AT}>
          <EndCard />
        </Sequence>
      </AbsoluteFill>
      <Audio src={staticFile('z11/voice.mp3')} volume={1} />
      <Audio src={staticFile('drone.mp3')} volume={(fr) => interpolate(fr, [0, 30, Z11_TOTAL - 60, Z11_TOTAL], [0, 0.18, 0.18, 0], {extrapolateRight: 'clamp'})} />
    </AbsoluteFill>
  );
};
