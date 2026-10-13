// Закон 12 — проба стиля «нуар-силуэты». Всё нарисовано кодом, без фото.
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FilmLook} from './Zakon11';

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
export const NOIR12_TOTAL = s(10.5);

const FONT = 'Inter, "Inter Display", sans-serif';
const GOLD = '#E8B04B';
const INK = '#050403';
const W = 1080;
const H = 1920;

// ---------- Силуэт человека (начало координат — между ступнями) ----------
export const Man: React.FC<{x: number; y: number; scale: number; walk?: number; rim?: string}> = ({x, y, scale, walk = 0, rim}) => {
  const legSwing = Math.sin(walk) * 18;
  const armSwing = -Math.sin(walk) * 12;
  const bob = Math.abs(Math.cos(walk)) * 6;
  return (
    <g transform={`translate(${x} ${y - bob * scale}) scale(${scale})`} style={rim ? {filter: `drop-shadow(0 0 3px ${rim})`} : undefined}>
      {/* ноги */}
      <g transform={`rotate(${legSwing} -26 -260)`}>
        <rect x={-44} y={-262} width={36} height={262} rx={10} fill={INK} />
        <ellipse cx={-30} cy={-4} rx={30} ry={10} fill={INK} />
      </g>
      <g transform={`rotate(${-legSwing} 26 -260)`}>
        <rect x={8} y={-262} width={36} height={262} rx={10} fill={INK} />
        <ellipse cx={30} cy={-4} rx={30} ry={10} fill={INK} />
      </g>
      {/* руки */}
      <g transform={`rotate(${armSwing} -84 -500)`}>
        <rect x={-104} y={-505} width={34} height={250} rx={16} fill={INK} />
      </g>
      <g transform={`rotate(${-armSwing} 84 -500)`}>
        <rect x={70} y={-505} width={34} height={250} rx={16} fill={INK} />
      </g>
      {/* пальто */}
      <path d="M -60 -530 Q -95 -528 -92 -490 L -100 -200 Q 0 -185 100 -200 L 92 -490 Q 95 -528 60 -530 Z" fill={INK} />
      {/* шея и голова */}
      <rect x={-17} y={-570} width={34} height={50} fill={INK} />
      <circle cx={0} cy={-604} r={42} fill={INK} />
      {/* шляпа-федора */}
      <ellipse cx={0} cy={-632} rx={80} ry={13} fill={INK} />
      <path d="M -50 -634 L -44 -690 Q 0 -676 44 -690 L 50 -634 Z" fill={INK} />
    </g>
  );
};

// ---------- Машина 1920-х ----------
export const Car: React.FC<{x: number; y: number; scale: number; frame: number}> = ({x, y, scale, frame}) => {
  const spin = frame * 14;
  const wheel = (cx: number) => (
    <g transform={`translate(${cx} -55) rotate(${spin})`}>
      <circle r={55} fill={INK} />
      <circle r={40} fill="none" stroke="#2a1d12" strokeWidth={3} />
      {[0, 45, 90, 135].map((a) => (
        <rect key={a} x={-2} y={-40} width={4} height={80} fill="#2a1d12" transform={`rotate(${a})`} />
      ))}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* свет фар */}
      <path d="M 250 -120 L 760 -200 L 760 20 Z" fill="url(#beam)" />
      <path d="M -260 -70 Q -270 -140 -200 -150 L -120 -160 L -60 -250 L 120 -250 L 170 -165 L 230 -160 Q 270 -150 268 -90 L 268 -60 L -260 -60 Z" fill={INK} />
      <rect x={-50} y={-235} width={70} height={60} fill="#3b2410" opacity={0.7} />
      <rect x={35} y={-235} width={70} height={60} fill="#3b2410" opacity={0.7} />
      <circle cx={258} cy={-125} r={14} fill="#ffd27a" />
      {wheel(-160)}
      {wheel(165)}
    </g>
  );
};

// ---------- Дым (сигара) ----------
export const Smoke: React.FC<{x: number; y: number; frame: number; count?: number}> = ({x, y, frame, count = 14}) => (
  <g>
    {Array.from({length: count}).map((_, i) => {
      const life = 90;
      const t = ((frame + i * (life / count)) % life) / life;
      const px = x + Math.sin(t * 6 + i) * 30 * t + t * 40;
      const py = y - t * 420;
      const r = 10 + t * 70;
      const o = (1 - t) * 0.35 * Math.min(1, t * 6);
      return <circle key={i} cx={px} cy={py} r={r} fill="#d8c3a8" opacity={o} style={{filter: 'blur(14px)'}} />;
    })}
  </g>
);

// ---------- Дождь ----------
export const Rain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.35}) => (
  <svg width={W} height={H} style={{position: 'absolute', opacity}}>
    {Array.from({length: 140}).map((_, i) => {
      const speed = 38 + random(`rs${i}`) * 22;
      const x0 = random(`rx${i}`) * (W + 300) - 150;
      const y = ((random(`ry${i}`) * H + frame * speed) % (H + 200)) - 100;
      const x = x0 - (y / H) * 160;
      return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 60} stroke="#cfd8e0" strokeWidth={2} />;
    })}
  </svg>
);

// ---------- Сцена 1: Чикаго, ночь, дождь ----------
export const Chicago: React.FC = () => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, s(3.8)], [1, 1.07]);
  const buildings = (layer: number) =>
    Array.from({length: 9}).map((_, i) => {
      const bw = 110 + random(`bw${layer}${i}`) * 90;
      const bx = i * 130 - 40 + random(`bx${layer}${i}`) * 40 + layer * 60;
      const bh = 500 + random(`bh${layer}${i}`) * (layer ? 650 : 450);
      const top = 1450 - bh;
      const wins = [];
      for (let wy = top + 40; wy < 1420; wy += 46) {
        for (let wx = bx + 18; wx < bx + bw - 24; wx += 34) {
          const on = random(`w${layer}${i}${wx}${wy}${Math.floor(f / 20)}`) > (layer ? 0.72 : 0.6);
          if (on) wins.push(<rect key={`${wx}-${wy}`} x={wx} y={wy} width={14} height={20} fill="#f2b450" opacity={layer ? 0.9 : 0.45} />);
        }
      }
      return (
        <g key={`${layer}-${i}`}>
          <rect x={bx} y={top} width={bw} height={bh} fill={layer ? INK : '#120b07'} />
          {wins}
        </g>
      );
    });
  const neon = random(`neon${Math.floor(f / 3)}`) > 0.12 ? 1 : 0.25;
  const carX = interpolate(f, [0, s(3.8)], [-420, 1250]);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#07080d 0%, #1d130d 45%, #9a531a 74%, #2a140a 86%, #050403 100%)', transform: `scale(${push})`}}>
      <svg width={W} height={H}>
        <defs>
          <linearGradient id="beam" x1="0" x2="1">
            <stop offset="0" stopColor="#ffd98a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wet" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#c97a2c" stopOpacity="0.35" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>
        {buildings(0)}
        {buildings(1)}
        {/* неоновая вывеска */}
        <g opacity={neon}>
          <rect x={760} y={760} width={90} height={420} rx={10} fill="none" stroke="#ff3b3b" strokeWidth={6} style={{filter: 'drop-shadow(0 0 12px #ff3b3b)'}} />
          {'HOTEL'.split('').map((c, i) => (
            <text key={i} x={805} y={840 + i * 76} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={62} fill="#ff5a5a" style={{filter: 'drop-shadow(0 0 10px #ff3b3b)'}}>
              {c}
            </text>
          ))}
        </g>
        {/* мокрая улица */}
        <rect x={0} y={1450} width={W} height={470} fill={INK} />
        <rect x={0} y={1450} width={W} height={300} fill="url(#wet)" />
        <Car x={carX} y={1640} scale={1.25} frame={f} />
        {/* фонарь и силуэт гангстера */}
        <rect x={120} y={1000} width={14} height={650} fill={INK} />
        <circle cx={127} cy={995} r={24} fill="#ffcf7a" style={{filter: 'drop-shadow(0 0 30px #ffb347)'}} />
        <Man x={230} y={1660} scale={0.62} rim="#c9772c" />
      </svg>
      <Rain frame={f} />
    </AbsoluteFill>
  );
};

// ---------- Сцена 2: кабинет Капоне ----------
const Office: React.FC = () => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, s(3.6)], [1.0, 1.1], {easing: Easing.out(Easing.quad)});
  const ember = 0.7 + 0.3 * Math.sin(f / 4) + random(`em${f}`) * 0.15;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, #3a2412 0%, #170d07 55%, #050403 100%)', transform: `scale(${push})`, transformOrigin: '50% 45%'}}>
      <svg width={W} height={H}>
        {/* жалюзи: полосы света на стене */}
        {Array.from({length: 9}).map((_, i) => (
          <polygon key={i} points={`${60},${380 + i * 70} ${1020},${300 + i * 70} ${1020},${330 + i * 70} ${60},${410 + i * 70}`} fill="#e0a052" opacity={0.16} />
        ))}
        {/* Капоне: широкий силуэт за столом */}
        <g style={{filter: 'drop-shadow(0 0 4px #d08a3a)'}}>
          <path d="M 480 950 Q 320 965 285 1080 L 262 1310 L 818 1310 L 795 1080 Q 760 965 600 950 Z" fill={INK} />
          <path d="M 470 955 L 540 1060 L 610 955 Z" fill="#1a110a" />
          <circle cx={540} cy={868} r={96} fill={INK} />
          <ellipse cx={540} cy={790} rx={185} ry={30} fill={INK} />
          <path d="M 425 795 L 440 665 Q 540 690 640 665 L 655 795 Z" fill={INK} />
          {/* рука с сигарой */}
          <path d="M 700 1150 Q 760 1040 690 960 L 650 975 Q 700 1050 650 1120 Z" fill={INK} />
          <rect x={612} y={902} width={95} height={16} rx={6} fill={INK} transform="rotate(-8 612 910)" />
        </g>
        <circle cx={712} cy={893} r={9} fill="#ff7a2a" opacity={ember} style={{filter: 'drop-shadow(0 0 14px #ff6a1a)'}} />
        <Smoke x={712} y={885} frame={f} />
        {/* стол и лампа */}
        <rect x={0} y={1300} width={W} height={620} fill={INK} />
        <path d="M 160 1300 L 220 1180 L 300 1180 L 340 1300 Z" fill="#0c0805" />
        <ellipse cx={260} cy={1305} rx={260} ry={40} fill="#f0b45a" opacity={0.22} style={{filter: 'blur(20px)'}} />
        {/* охрана в тени */}
        <g opacity={0.55}>
          <Man x={130} y={1300} scale={0.95} />
          <Man x={960} y={1300} scale={0.95} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Сцена 3: в дверях появляется Люстиг ----------
export const Doorway: React.FC = () => {
  const f = useCurrentFrame();
  const open = interpolate(f, [0, 18], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const walkP = interpolate(f, [10, s(3.2)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scale = interpolate(walkP, [0, 1], [0.75, 1.35]);
  const y = interpolate(walkP, [0, 1], [1330, 1700]);
  const walk = walkP * Math.PI * 7;
  const doorW = 360 * open;
  return (
    <AbsoluteFill style={{backgroundColor: '#070504'}}>
      <svg width={W} height={H}>
        <defs>
          <linearGradient id="spill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffcf86" stopOpacity="0.75" />
            <stop offset="1" stopColor="#ffcf86" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* дверной проём со светом */}
        <rect x={540 - 180} y={520} width={360} height={820} fill="#1b120b" />
        <rect x={540 - 180} y={520} width={doorW} height={820} fill="#ffd79a" style={{filter: 'drop-shadow(0 0 60px #ffb347)'}} />
        {/* свет на полу */}
        <polygon points={`${540 - 180},1340 ${540 - 180 + doorW},1340 ${540 + doorW * 2.2},1920 ${540 - 180 - doorW * 0.9},1920`} fill="url(#spill)" opacity={open} />
        {/* длинная тень */}
        <ellipse cx={540} cy={y + 160 * scale} rx={60 * scale} ry={260 * scale} fill={INK} opacity={0.7 * open} />
        <Man x={540} y={y} scale={scale} walk={walk} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Тексты ----------
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame: f - 6, fps, config: {damping: 16}});
  const out = interpolate(f, [s(3.3), s(3.7)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 300, opacity: a * out}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 68, color: 'white', textAlign: 'center', lineHeight: 1.18, maxWidth: 940, transform: `translateY(${(1 - a) * -30}px)`, textShadow: '0 4px 24px rgba(0,0,0,0.95)'}}>
        Как обмануть
        <br />
        <span style={{color: GOLD}}>самого опасного</span>
        <br />
        человека в Америке?
      </div>
    </AbsoluteFill>
  );
};

const Label: React.FC<{title: string; sub: string; top: number}> = ({title, sub, top}) => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [0, 5], [1.8, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5))});
  const o = interpolate(f, [0, 3], [0, 1], {extrapolateRight: 'clamp'});
  const subO = interpolate(f, [10, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', top}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: title.length > 10 ? 100 : 120, color: GOLD, opacity: o, transform: `scale(${scale})`, whiteSpace: 'nowrap', textShadow: '0 8px 30px rgba(0,0,0,0.95)', WebkitTextStroke: '2px rgba(0,0,0,0.5)'}}>
        {title}
      </div>
      <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 44, color: 'white', opacity: subO, marginTop: 12, textAlign: 'center', maxWidth: 900, textShadow: '0 3px 16px rgba(0,0,0,0.95)'}}>{sub}</div>
    </AbsoluteFill>
  );
};

const Whoosh: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: '#fff3dc', opacity: interpolate(f, [0, 2, 8], [0, 0.7, 0], {extrapolateRight: 'clamp'})}} />;
};

const SC1 = s(3.8);
const SC2 = s(7.2);

export const Noir12: React.FC = () => {
  const f = useCurrentFrame();
  const shake = f >= SC1 && f < SC1 + 10 ? (random(`k${f}`) - 0.5) * 16 * (1 - (f - SC1) / 10) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
        <Sequence durationInFrames={SC1}>
          <Chicago />
        </Sequence>
        <Sequence from={SC1} durationInFrames={SC2 - SC1}>
          <Office />
        </Sequence>
        <Sequence from={SC2}>
          <Doorway />
        </Sequence>
      </AbsoluteFill>
      <FilmLook />
      <Sequence durationInFrames={SC1}>
        <Hook />
      </Sequence>
      <Sequence from={SC1 + 4} durationInFrames={SC2 - SC1 - 4}>
        <Label title="АЛЬ КАПОНЕ" sub="самый страшный гангстер Чикаго" top={260} />
      </Sequence>
      <Sequence from={SC2 + s(1.4)}>
        <Label title="ВИКТОР ЛЮСТИГ" sub="мошенник, который «продал» Эйфелеву башню" top={240} />
      </Sequence>
      <Sequence from={SC1} durationInFrames={10}>
        <Whoosh />
      </Sequence>
      <Sequence from={SC2} durationInFrames={10}>
        <Whoosh />
      </Sequence>
      {/* Звук */}
      <Audio src={staticFile('z12/rain.wav')} volume={(fr) => interpolate(fr, [0, 15, SC1 - 5, SC1 + 10, NOIR12_TOTAL], [0, 0.5, 0.5, 0.12, 0.1], {extrapolateRight: 'clamp'})} />
      <Audio src={staticFile('z11/pulse.wav')} volume={0.45} />
      <Audio src={staticFile('drone.mp3')} volume={0.2} />
      <Sequence from={SC1 - 6} durationInFrames={20}>
        <Audio src={staticFile('z11/whoosh.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={SC1 + 4} durationInFrames={45}>
        <Audio src={staticFile('z11/boom.wav')} volume={0.8} />
      </Sequence>
      <Sequence from={SC2 - 6} durationInFrames={20}>
        <Audio src={staticFile('z11/whoosh.wav')} volume={0.5} />
      </Sequence>
      <Sequence from={SC2 + s(1.4)} durationInFrames={45}>
        <Audio src={staticFile('z11/boom.wav')} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
