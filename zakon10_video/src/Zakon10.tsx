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
import {END_AT, FADE, GUNSHOT, NAME_AT, SCENES, SKIP_CAPTIONS, Scene, TOTAL} from './scenes';
import captions from './captions.json';

export const FPS = 30;
export const TOTAL_FRAMES = TOTAL;

const FONT = 'Inter, "Inter Display", sans-serif';
const RED = '#d4252b';
const GOLD = '#f2c14e';
const ease = Easing.bezier(0.45, 0, 0.55, 1);

// ---------- Видео-сцена с движением камеры ----------
const SceneClip: React.FC<{scene: Scene; length: number; fadeIn: boolean}> = ({scene, length, fadeIn}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, length], [0, 1], {extrapolateRight: 'clamp', easing: ease});
  const zoom = interpolate(p, [0, 1], scene.zoom);
  const x = interpolate(p, [0, 1], scene.x);
  const y = interpolate(p, [0, 1], scene.y);
  const s = scene.shake ?? 0;
  const sx = s ? (random(`x${f}`) - 0.5) * s * 0.6 + Math.sin(f / 5) * s : 0;
  const sy = s ? (random(`y${f}`) - 0.5) * s * 0.6 + Math.cos(f / 7) * s : 0;
  const opacity = fadeIn ? interpolate(f, [0, FADE], [0, 1], {extrapolateRight: 'clamp'}) : 1;

  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden', backgroundColor: 'black'}}>
      {scene.still ? (
        <Img
          src={staticFile(scene.src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: scene.grade,
            transform: `translate(${x + sx}px, ${y + sy}px) scale(${zoom})`,
          }}
        />
      ) : (
      <OffthreadVideo
        src={staticFile(scene.src)}
        trimBefore={scene.trimBefore}
        playbackRate={scene.rate ?? 1}
        volume={scene.volume}
        muted={scene.volume === 0}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: scene.grade,
          transform: `translate(${x + sx}px, ${y + sy}px) scale(${zoom})`,
        }}
      />
      )}
    </AbsoluteFill>
  );
};

// ---------- Плёночное зерно, виньетка, градиенты ----------
const FilmLook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.85) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)',
        }}
      />
      <svg width="1080" height="1920" style={{position: 'absolute', opacity: 0.09, mixBlendMode: 'overlay'}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 60} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Вступительный титр ----------
const Title: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame: f, fps, config: {damping: 14, mass: 0.8}});
  const out = interpolate(f, [130, 150], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const spacing = interpolate(f, [0, 70], [30, 8], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const line = interpolate(f, [8, 34], [0, 520], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const sub = interpolate(f, [14, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: out, top: -260}}>
      <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 34, letterSpacing: 14, color: GOLD, opacity: sub, marginBottom: 18}}>
        48 ЗАКОНОВ ВЛАСТИ
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 160,
          letterSpacing: spacing,
          whiteSpace: 'nowrap',
          color: RED,
          transform: `scale(${0.8 + pop * 0.2})`,
          textShadow: '0 0 40px rgba(212,37,43,0.55), 0 8px 30px rgba(0,0,0,0.9)',
          lineHeight: 1,
        }}
      >
        ЗАКОН 10
      </div>
      <div style={{width: line, height: 3, background: GOLD, marginTop: 26, boxShadow: `0 0 18px ${GOLD}`}} />
      <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 40, color: 'white', opacity: sub, marginTop: 24, letterSpacing: 3}}>
        Заражение
      </div>
    </AbsoluteFill>
  );
};

// ---------- Титр места и года (как в документалках) ----------
const PlaceLabel: React.FC<{text: string; length: number}> = ({text, length}) => {
  const f = useCurrentFrame();
  const shown = Math.floor(interpolate(f, [6, 6 + text.length * 2], [0, text.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const bar = interpolate(f, [0, 12], [0, 60], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const out = interpolate(f, [length - 14, length - 2], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 170, left: 80, display: 'flex', alignItems: 'center', gap: 22, opacity: out}}>
      <div style={{width: bar, height: 3, background: RED}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 38, letterSpacing: 8, color: 'white', textShadow: '0 2px 12px rgba(0,0,0,0.9)'}}>
        {text.slice(0, shown)}
      </div>
    </div>
  );
};

// ---------- Имя героини ----------
const NameCard: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 20}});
  const out = interpolate(f, [56, 70], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 330, opacity: out}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 120, color: 'white', letterSpacing: 10 * s, transform: `translateY(${(1 - s) * 30}px)`, opacity: s, textShadow: '0 6px 30px rgba(0,0,0,0.9)'}}>
        ЛОЛА МОНТЕС
      </div>
      <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 40, color: GOLD, letterSpacing: 12, opacity: s, marginTop: 10}}>
        1821 — 1861
      </div>
    </AbsoluteFill>
  );
};

// ---------- Субтитры: слово за словом ----------
type Word = {text: string; start: number; end: number};
type Line = {start: number; end: number; words: Word[]};

const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const lines = captions as Line[];
  // Первая фраза («Закон десятый») уже на экране титром
  const idx = lines.findIndex((l, i) => i >= SKIP_CAPTIONS && t >= l.start - 0.08 && t < (lines[i + 1]?.start ?? l.end + 1) - 0.08 && t < l.end + 0.6);
  if (idx < 0) return null;
  const line = lines[idx];
  const local = f - Math.round((line.start - 0.08) * fps);
  const enter = spring({frame: local, fps, config: {damping: 16, stiffness: 180}});

  return (
    <AbsoluteFill style={{alignItems: 'center', top: 1230}}>
      <div
        style={{
          width: 900,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '6px 26px',
          transform: `translateY(${(1 - enter) * 26}px)`,
          opacity: enter,
        }}
      >
        {line.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.05;
          const spoken = t >= w.start;
          const wf = f - Math.round(w.start * fps);
          const pop = active ? 1 + 0.08 * spring({frame: wf, fps, config: {damping: 10, stiffness: 260}}) - 0.08 * interpolate(wf, [4, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 74,
                textTransform: 'uppercase',
                lineHeight: 1.15,
                color: active ? GOLD : 'white',
                opacity: spoken ? 1 : 0.4,
                transform: `scale(${pop})`,
                display: 'inline-block',
                textShadow: '0 4px 0 rgba(0,0,0,0.85), 0 0 26px rgba(0,0,0,0.9)',
                WebkitTextStroke: '2px rgba(0,0,0,0.6)',
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

// ---------- Вспышка выстрела ----------
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 2, 10], [0, 0.95, 0], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{backgroundColor: '#fff6e0', opacity: o}} />;
};

// ---------- Финальная карточка ----------
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dark = interpolate(f, [0, 20], [0, 0.72], {extrapolateRight: 'clamp'});
  const s = spring({frame: f - 6, fps, config: {damping: 18}});
  const s2 = spring({frame: f - 18, fps, config: {damping: 18}});
  return (
    <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${dark})`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 150, color: RED, opacity: s, transform: `scale(${0.85 + 0.15 * s})`, letterSpacing: 12, textShadow: '0 0 40px rgba(212,37,43,0.5)'}}>
        ЗАКОН 10
      </div>
      <div style={{width: 420 * s2, height: 3, background: GOLD, margin: '28px 0'}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 56, color: 'white', textAlign: 'center', lineHeight: 1.25, opacity: s2, transform: `translateY(${(1 - s2) * 20}px)`, maxWidth: 900}}>
        ИЗБЕГАЙ НЕСЧАСТНЫХ
        <br />И НЕУДАЧНИКОВ
      </div>
    </AbsoluteFill>
  );
};

// ---------- Сборка ----------
export const Zakon10: React.FC = () => {
  const f = useCurrentFrame();
  const fadeOutAll = interpolate(f, [TOTAL_FRAMES - 12, TOTAL_FRAMES], [1, 0], {extrapolateLeft: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <AbsoluteFill style={{opacity: fadeOutAll}}>
        {SCENES.map((sc, i) => {
          const from = i === 0 ? sc.from : sc.from - FADE;
          const length = sc.to - from;
          return (
            <Sequence key={`${sc.src}-${sc.from}`} from={from} durationInFrames={length} premountFor={30}>
              <SceneClip scene={sc} length={length} fadeIn={i > 0} />
            </Sequence>
          );
        })}

        <FilmLook />

        <Sequence from={GUNSHOT} durationInFrames={14}>
          <Flash />
        </Sequence>

        {SCENES.filter((sc) => sc.label).map((sc) => {
          const len = Math.min(90, sc.to - sc.from - 4);
          return (
            <Sequence key={`l-${sc.from}`} from={sc.from + 4} durationInFrames={len}>
              <PlaceLabel text={sc.label!} length={len} />
            </Sequence>
          );
        })}

        <Sequence durationInFrames={152}>
          <Title />
        </Sequence>

        <Sequence from={NAME_AT - 4} durationInFrames={72}>
          <NameCard />
        </Sequence>

        <Subtitles />

        <Sequence from={END_AT}>
          <EndCard />
        </Sequence>
      </AbsoluteFill>

      {/* Звук */}
      <Audio src={staticFile('voice.mp3')} volume={1} />
      <Audio src={staticFile('drone.mp3')} volume={(fr) => interpolate(fr, [0, 30, TOTAL - 60, TOTAL], [0, 0.3, 0.3, 0], {extrapolateRight: 'clamp'})} />
      {/* Гитара фламенко из первого клипа на нормальной скорости */}
      <Sequence durationInFrames={150}>
        <Audio src={staticFile('1_dance.mp4')} volume={(fr) => interpolate(fr, [0, 6, 110, 150], [0, 0.4, 0.4, 0], {extrapolateRight: 'clamp'})} />
      </Sequence>
    </AbsoluteFill>
  );
};
