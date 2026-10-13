// Закон 11 — вариант B: быстрый монтаж на удержание.
// Частые врезки, удары-слова, свисты на переходах, пульс, полоска прогресса.
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {EndCard, FilmLook, Subtitles, Z11_TOTAL} from './Zakon11';

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
const FONT = 'Inter, "Inter Display", sans-serif';
const GOLD = '#E8B04B';
const END_AT = s(66.48);

type Shot = {
  src: string;
  at: number; // секунда начала
  video?: boolean;
  trim?: number; // секунда исходника, с которой начинаем
  rate?: number;
  zoom: [number, number];
  origin?: string;
  cut?: 'whoosh' | 'punch' | 'flash'; // как входим в кадр
};

// whoosh — смена сцены со свистом; punch — резкая врезка на крупный план; flash — вспышка
const SHOTS: Shot[] = [
  {src: 'v1_portrait.mp4', video: true, at: 0, zoom: [1.12, 1.0]},
  {src: 'p1_portrait.jpg', at: 3.9, zoom: [1.35, 1.5], origin: '50% 20%', cut: 'punch'},
  {src: 'p2_king.jpg', at: 7.24, zoom: [1.0, 1.08], origin: '25% 55%', cut: 'whoosh'},
  {src: 'p2_king.jpg', at: 9.96, zoom: [2.0, 2.15], origin: '24% 53%', cut: 'punch'},
  {src: 'v3_ministers.mp4', video: true, at: 12.68, zoom: [1.0, 1.05], cut: 'whoosh'},
  {src: 'v3_ministers.mp4', video: true, at: 16.6, trim: 3.9, rate: 0.6, zoom: [1.05, 1.12], origin: '60% 35%'},
  {src: 'p1_portrait.jpg', at: 18.6, zoom: [1.45, 1.6], origin: '50% 18%', cut: 'flash'},
  {src: 'p3_ministers.jpg', at: 20.45, zoom: [1.0, 1.06], cut: 'whoosh'},
  {src: 'p3_ministers.jpg', at: 22.8, zoom: [1.7, 1.8], origin: '45% 33%', cut: 'punch'},
  {src: 'p3_ministers.jpg', at: 24.7, zoom: [1.8, 1.9], origin: '80% 20%', cut: 'punch'},
  {src: 'p2_king.jpg', at: 26.15, zoom: [1.8, 2.1], origin: '23% 54%', cut: 'punch'},
  {src: 'v4_candle.mp4', video: true, at: 29.16, trim: 1.9, zoom: [1.0, 1.04], cut: 'whoosh'},
  {src: 'v5_crown.mp4', video: true, at: 32.36, rate: 0.91, zoom: [1.0, 1.06], cut: 'whoosh'},
  {src: 'p6_shoulder.jpg', at: 37.96, zoom: [1.0, 1.06], cut: 'whoosh'},
  {src: 'p6_shoulder.jpg', at: 40.4, zoom: [1.7, 1.85], origin: '62% 12%', cut: 'punch'},
  {src: 'p7_map.jpg', at: 42.34, zoom: [1.0, 1.06], origin: '50% 30%', cut: 'whoosh'},
  {src: 'p7_map.jpg', at: 44.4, zoom: [1.5, 1.65], origin: '50% 78%', cut: 'punch'},
  {src: 'p7_map.jpg', at: 46.5, zoom: [1.8, 1.95], origin: '88% 32%', cut: 'punch'},
  {src: 'p5_crown.jpg', at: 48.22, zoom: [1.0, 1.08], origin: '50% 60%', cut: 'whoosh'},
  {src: 'p8_whisper.jpg', at: 51.42, zoom: [1.0, 1.06], origin: '50% 30%', cut: 'whoosh'},
  {src: 'p8_whisper.jpg', at: 53.66, zoom: [1.7, 1.85], origin: '33% 36%', cut: 'punch'},
  {src: 'v9_window.mp4', video: true, at: 56.44, rate: 0.9, zoom: [1.0, 1.06], cut: 'whoosh'},
  {src: 'p9_window.jpg', at: 61.1, zoom: [1.6, 1.75], origin: '38% 20%', cut: 'punch'},
  {src: 'p4_throne.jpg', at: 63.3, zoom: [1.0, 1.12], origin: '65% 60%', cut: 'flash'},
  {src: 'p1_portrait.jpg', at: 66.48, zoom: [1.1, 1.0], origin: '50% 25%', cut: 'flash'},
];

// Ключевые слова — вылетают крупно с ударом
const SLAMS: {text: string; at: number; color?: string}[] = [
  {text: 'СЛАБЫЙ', at: 10.36},
  {text: 'БИСМАРК', at: 19.4, color: GOLD},
  {text: 'НИКТО', at: 28.08},
  {text: 'УМЕР', at: 30.32},
  {text: 'НИ ШАГУ', at: 55.34},
  {text: 'ЗАМЕНЯТ', at: 64.6, color: '#d4252b'},
];

// Тряска кадра после удара
const shakeAt = (f: number) => {
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
  return {dx, dy};
};

const ShotView: React.FC<{shot: Shot; length: number}> = ({shot, length}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, length], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  let zoom = interpolate(p, [0, 1], shot.zoom);
  // врезка: короткий «удар» масштабом на входе
  if (shot.cut === 'punch') zoom *= interpolate(f, [0, 5], [1.07, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  if (shot.cut === 'whoosh') zoom *= interpolate(f, [0, 8], [1.12, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const blur = shot.cut === 'whoosh' ? interpolate(f, [0, 6], [10, 0], {extrapolateRight: 'clamp'}) : 0;
  const opacity = shot.cut === 'whoosh' ? interpolate(f, [0, 4], [0, 1], {extrapolateRight: 'clamp'}) : 1;
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: `contrast(1.08) saturate(1.08) blur(${blur}px)`,
    transform: `scale(${zoom})`,
    transformOrigin: shot.origin ?? '50% 50%',
  };
  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden', backgroundColor: 'black'}}>
      {shot.video ? (
        <OffthreadVideo
          src={staticFile(`z11/${shot.src}`)}
          trimBefore={shot.trim ? s(shot.trim) : undefined}
          playbackRate={shot.rate ?? 1}
          volume={0.08}
          style={style}
        />
      ) : (
        <Img src={staticFile(`z11/${shot.src}`)} style={style} />
      )}
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
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: text.length > 6 ? 150 : 190,
          letterSpacing: 6,
          color: color ?? 'white',
          opacity: o,
          transform: `scale(${scale})`,
          whiteSpace: 'nowrap',
          textShadow: '0 10px 40px rgba(0,0,0,0.95), 0 0 2px black',
          WebkitTextStroke: '3px rgba(0,0,0,0.6)',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Вопрос-крючок сверху: зритель ждёт ответа
const HookQuestion: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame: f, fps, config: {damping: 16}});
  const out = interpolate(f, [170, 185], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 210, opacity: a * out}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 56, color: 'white', textAlign: 'center', lineHeight: 1.2, maxWidth: 920, transform: `translateY(${(1 - a) * -30}px)`, textShadow: '0 4px 24px rgba(0,0,0,0.95)'}}>
        Почему Бисмарк выбрал
        <br />
        <span style={{color: GOLD}}>СЛАБОГО</span> короля?
      </div>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', top: 0, left: 0, height: 8, width: `${(f / Z11_TOTAL) * 100}%`, background: GOLD, boxShadow: `0 0 12px ${GOLD}`}} />
  );
};

export const Zakon11B: React.FC = () => {
  const f = useCurrentFrame();
  const {dx, dy} = shakeAt(f);
  const fadeOutAll = interpolate(f, [Z11_TOTAL - 15, Z11_TOTAL], [1, 0], {extrapolateLeft: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <AbsoluteFill style={{opacity: fadeOutAll}}>
        <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(1.02)`}}>
          {SHOTS.map((sh, i) => {
            const from = s(sh.at);
            const to = i + 1 < SHOTS.length ? s(SHOTS[i + 1].at) : Z11_TOTAL;
            return (
              <Sequence key={`${sh.src}-${sh.at}`} from={from} durationInFrames={to - from} premountFor={30}>
                <ShotView shot={sh} length={to - from} />
              </Sequence>
            );
          })}
        </AbsoluteFill>
        <FilmLook />
        {SHOTS.filter((sh) => sh.cut === 'flash').map((sh) => (
          <Sequence key={`fl-${sh.at}`} from={s(sh.at)} durationInFrames={8}>
            <Flash />
          </Sequence>
        ))}
        <Sequence durationInFrames={190}>
          <HookQuestion />
        </Sequence>
        {SLAMS.map((sl) => (
          <Sequence key={sl.text} from={s(sl.at)} durationInFrames={30}>
            <Slam text={sl.text} color={sl.color} />
          </Sequence>
        ))}
        <Subtitles />
        <Sequence from={END_AT}>
          <EndCard />
        </Sequence>
        <Progress />
      </AbsoluteFill>

      {/* Звук */}
      <Audio src={staticFile('z11/voice.mp3')} volume={1} />
      <Audio src={staticFile('drone.mp3')} volume={(fr) => interpolate(fr, [0, 20, Z11_TOTAL - 60, Z11_TOTAL], [0, 0.14, 0.14, 0], {extrapolateRight: 'clamp'})} />
      <Audio src={staticFile('z11/pulse.wav')} volume={(fr) => interpolate(fr, [0, 30, END_AT - 10, END_AT], [0, 0.35, 0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
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
      <Sequence from={END_AT - s(2.5)} durationInFrames={s(2.6)}>
        <Audio src={staticFile('z11/riser.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={END_AT} durationInFrames={45}>
        <Audio src={staticFile('z11/boom.wav')} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
