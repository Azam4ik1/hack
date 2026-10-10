// Закон 12 — полный ролик в стиле «нуар-силуэты». Всё нарисовано кодом.
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
import {Chicago, Doorway, Man, Rain, Smoke} from './Noir12';
import {FilmLook} from './Zakon11';
import captions from './captions12.json';

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
export const NOIR12_FULL_TOTAL = s(75.5);

const FONT = 'Inter, "Inter Display", sans-serif';
const GOLD = '#E8B04B';
const RED = '#d4252b';
const INK = '#050403';
const W = 1080;
const H = 1920;

// ---------- Таймлайн по озвучке (сек) ----------
const T = {
  chicago: 0,
  office: 8.82,
  threat: 13.74,
  door: 16.86,
  eiffel: 19.81,
  meet: 23.37,
  briefcase: 29.84,
  vault: 33.35,
  calendar: 38.32,
  ret: 39.95,
  shock: 50.51,
  gift: 56.2,
  plan: 59.5,
  end: 63.84,
};

const SLAMS: {text: string; at: number; color?: string; top?: number}[] = [
  {text: 'ЧЕСТНЫМ', at: 5.26, color: GOLD},
  {text: 'АЛЬ КАПОНЕ', at: 9.6, color: GOLD},
  {text: 'ЖЕСТОКО', at: 15.55, color: RED},
  {text: 'ВИКТОР ЛЮСТИГ', at: 17.9, color: GOLD},
  {text: '$50 000', at: 25.3, color: GOLD},
  {text: '×2', at: 28.1, color: GOLD},
  {text: 'НИЧЕГО', at: 36.55},
  {text: 'ВСЕ $50 000', at: 43.2, color: GOLD},
  {text: 'ЧЕСТНЫЙ', at: 54.85, color: GOLD},
  {text: '$5 000', at: 57.7, color: GOLD},
  {text: 'ПЛАН', at: 60.4, color: RED},
];

// ---------- Капоне за столом (вид спереди; (0,0) — центр груди) ----------
const Capone: React.FC<{x: number; y: number; scale: number; frame: number; cigarFallAt?: number; rim?: boolean}> = ({x, y, scale, frame, cigarFallAt, rim = true}) => {
  const fall = cigarFallAt === undefined ? 0 : interpolate(frame, [cigarFallAt, cigarFallAt + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const ember = 0.7 + 0.3 * Math.sin(frame / 4) + random(`em${frame}`) * 0.15;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g style={rim ? {filter: 'drop-shadow(0 0 4px #d08a3a)'} : undefined}>
        <path d="M -60 -150 Q -220 -135 -255 -20 L -278 210 L 278 210 L 255 -20 Q 220 -135 60 -150 Z" fill={INK} />
        <path d="M -70 -145 L 0 -40 L 70 -145 Z" fill="#1a110a" />
        <circle cx={0} cy={-232} r={96} fill={INK} />
        <ellipse cx={0} cy={-310} rx={185} ry={30} fill={INK} />
        <path d="M -115 -305 L -100 -435 Q 0 -410 100 -435 L 115 -305 Z" fill={INK} />
        <path d="M 160 50 Q 220 -60 150 -140 L 110 -125 Q 160 -50 110 20 Z" fill={INK} />
      </g>
      {/* сигара: падает, когда Капоне поражён */}
      <g transform={`translate(${fall * 40} ${fall * 420}) rotate(${fall * 120} 120 -195)`}>
        <rect x={72} y={-198} width={95} height={16} rx={6} fill={INK} transform="rotate(-8 72 -190)" />
        <circle cx={172} cy={-207} r={9} fill="#ff7a2a" opacity={ember} style={{filter: 'drop-shadow(0 0 14px #ff6a1a)'}} />
      </g>
      {fall === 0 && <Smoke x={172} y={-215} frame={frame} />}
    </g>
  );
};

// ---------- Фон кабинета ----------
const OfficeBg: React.FC<{tint?: string}> = ({tint}) => (
  <>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, #3a2412 0%, #170d07 55%, #050403 100%)'}} />
    <svg width={W} height={H} style={{position: 'absolute'}}>
      {Array.from({length: 9}).map((_, i) => (
        <polygon key={i} points={`60,${380 + i * 70} 1020,${300 + i * 70} 1020,${330 + i * 70} 60,${410 + i * 70}`} fill="#e0a052" opacity={0.16} />
      ))}
    </svg>
    {tint && <AbsoluteFill style={{backgroundColor: tint, mixBlendMode: 'multiply'}} />}
  </>
);

// Пачка денег
const Stack: React.FC<{x: number; y: number; w?: number; h?: number; o?: number}> = ({x, y, w = 150, h = 40, o = 1}) => (
  <g opacity={o}>
    <rect x={x} y={y} width={w} height={h} rx={4} fill="#8a9a62" />
    <rect x={x} y={y + h * 0.15} width={w} height={h * 0.12} fill="#6f7d4c" />
    <rect x={x + w * 0.42} y={y} width={w * 0.16} height={h} fill="#e8dcb8" />
  </g>
);

// ---------- Сцены ----------
const OfficeScene: React.FC = () => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, s(5)], [1, 1.1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  return (
    <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 45%'}}>
      <OfficeBg />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <g opacity={0.55}>
          <Man x={130} y={1300} scale={0.95} />
          <Man x={960} y={1300} scale={0.95} />
        </g>
        <Capone x={540} y={1100} scale={1} frame={f} />
        <rect x={0} y={1300} width={W} height={620} fill={INK} />
        <path d="M 160 1300 L 220 1180 L 300 1180 L 340 1300 Z" fill="#0c0805" />
        <ellipse cx={260} cy={1305} rx={260} ry={40} fill="#f0b45a" opacity={0.22} style={{filter: 'blur(20px)'}} />
      </svg>
    </AbsoluteFill>
  );
};

// Крупно Капоне (угроза / шок)
const CaponeClose: React.FC<{tint?: string; cigarFallAt?: number}> = ({tint, cigarFallAt}) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, s(5.5)], [1.55, 1.75], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 47%'}}>
      <OfficeBg tint={tint} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <Capone x={540} y={1100} scale={1} frame={f} cigarFallAt={cigarFallAt} />
        <rect x={0} y={1300} width={W} height={620} fill={INK} />
      </svg>
    </AbsoluteFill>
  );
};

// Эйфелева башня и «продажа»
const Eiffel: React.FC = () => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, s(3.6)], [1, 1.08], {extrapolateRight: 'clamp'});
  const stampAt = s(21.5 - T.eiffel);
  const st = interpolate(f, [stampAt, stampAt + 5], [2.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.8))});
  const stO = f >= stampAt ? 1 : 0;
  const shakeHand = Math.sin(f / 3) * 6;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#1b2433 0%, #6d5a4a 50%, #d9945a 72%, #3a2416 86%, #050403 100%)', transform: `scale(${push})`}}>
      <svg width={W} height={H}>
        {/* башня */}
        <g transform="translate(540 1460)">
          <path d="M -460 0 Q -300 -180 -230 -470 L -110 -980 L -40 -1380 L 0 -1520 L 40 -1380 L 110 -980 L 230 -470 Q 300 -180 460 0 L 300 0 Q 120 -300 0 -310 Q -120 -300 -300 0 Z" fill="#0d0907" />
          <rect x={-270} y={-495} width={540} height={34} fill="#0d0907" />
          <rect x={-140} y={-1000} width={280} height={24} fill="#0d0907" />
          <rect x={-50} y={-1400} width={100} height={16} fill="#0d0907" />
          {Array.from({length: 10}).map((_, i) => (
            <path key={i} d={`M ${-215 + i * 10} ${-470 - i * 50} L ${215 - i * 10} ${-520 - i * 50} M ${215 - i * 10} ${-470 - i * 50} L ${-215 + i * 10} ${-520 - i * 50}`} stroke="#2e2117" strokeWidth={3} />
          ))}
        </g>
        <rect x={0} y={1460} width={W} height={460} fill={INK} />
        {/* Люстиг и покупатель в цилиндре */}
        <Man x={330} y={1640} scale={1.05} rim="#e0a052" />
        <g transform="translate(760 1640) scale(1.1)" style={{filter: 'drop-shadow(0 0 3px #e0a052)'}}>
          <rect x={-46} y={-262} width={40} height={262} rx={10} fill={INK} />
          <rect x={6} y={-262} width={40} height={262} rx={10} fill={INK} />
          <ellipse cx={0} cy={-370} rx={140} ry={170} fill={INK} />
          <circle cx={0} cy={-575} r={46} fill={INK} />
          <rect x={-46} y={-720} width={92} height={110} fill={INK} />
          <ellipse cx={0} cy={-612} rx={78} ry={11} fill={INK} />
        </g>
        {/* рукопожатие и документ */}
        <rect x={400} y={1290 + shakeHand} width={260} height={30} rx={14} fill={INK} />
        <rect x={250} y={1270} width={70} height={90} fill="#efe4c8" transform="rotate(-10 285 1315)" style={{filter: 'drop-shadow(0 0 10px #ffd98a)'}} />
        {/* штамп «ПРОДАНО» */}
        <g opacity={stO} transform={`translate(540 700) rotate(-12) scale(${st})`}>
          <rect x={-300} y={-80} width={600} height={160} rx={14} fill="none" stroke={RED} strokeWidth={12} />
          <text x={0} y={42} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={112} fill={RED} letterSpacing={8}>
            ПРОДАНО
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Встреча: Люстиг спиной на переднем плане, Капоне за столом
const Meeting: React.FC<{stacksFrom?: number; bowAt?: number}> = ({stacksFrom, bowAt}) => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, s(8)], [1, 1.08], {extrapolateRight: 'clamp'});
  const bow = bowAt === undefined ? 0 : interpolate(f, [bowAt, bowAt + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stacks = stacksFrom === undefined ? 0 : Math.floor(interpolate(f, [stacksFrom, stacksFrom + s(1.6)], [0, 6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 50%'}}>
      <OfficeBg />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <Capone x={640} y={1000} scale={0.72} frame={f} />
        {/* стол с лампой */}
        <rect x={0} y={1150} width={W} height={160} fill="#0d0805" />
        <path d="M 200 1150 L 250 1050 L 320 1050 L 350 1150 Z" fill="#100a06" />
        <ellipse cx={280} cy={1150} rx={240} ry={36} fill="#f0b45a" opacity={0.28} style={{filter: 'blur(18px)'}} />
        {Array.from({length: stacks}).map((_, i) => (
          <Stack key={i} x={430 + (i % 3) * 165} y={1100 - Math.floor(i / 3) * 44} />
        ))}
        {/* Люстиг спиной, крупно */}
        <g transform={`rotate(${bow * 6} 250 1500)`}>
          <Man x={250} y={2250} scale={2.1} rim="#c9772c" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Чемодан денег скользит по столу
const Briefcase: React.FC = () => {
  const f = useCurrentFrame();
  const slideAt = s(31.99 - T.briefcase);
  const x = interpolate(f, [slideAt - 10, slideAt + 12], [880, 340], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const lid = interpolate(f, [slideAt + 14, slideAt + 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const push = interpolate(f, [0, s(3.5)], [1.05, 1.15], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 60%, #3a2412 0%, #120a05 60%, #050403 100%)', transform: `scale(${push})`}}>
      <svg width={W} height={H}>
        <rect x={0} y={1180} width={W} height={740} fill="#0f0905" />
        <ellipse cx={540} cy={1185} rx={480} ry={60} fill="#f0b45a" opacity={0.18} style={{filter: 'blur(24px)'}} />
        {/* рука Капоне толкает */}
        <rect x={x + 380} y={1040} width={420} height={70} rx={30} fill={INK} />
        <g transform={`translate(${x} 960)`}>
          {/* открытая крышка: деньги светятся */}
          <rect x={0} y={60 - 110 * lid} width={400} height={110 * lid} fill="#1f140b" />
          {lid > 0.3 && (
            <g opacity={lid}>
              {Array.from({length: 6}).map((_, i) => (
                <Stack key={i} x={20 + (i % 3) * 125} y={70 + Math.floor(i / 3) * 34} w={110} h={30} />
              ))}
              <ellipse cx={200} cy={80} rx={220} ry={60} fill="#ffd98a" opacity={0.25} style={{filter: 'blur(20px)'}} />
            </g>
          )}
          <rect x={0} y={60} width={400} height={170} rx={10} fill="#24170d" />
          <rect x={150} y={30} width={100} height={34} rx={14} fill="none" stroke="#24170d" strokeWidth={14} />
          <rect x={60} y={120} width={22} height={30} fill="#b88a3c" />
          <rect x={318} y={120} width={22} height={30} fill="#b88a3c" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Банковский сейф
const Vault: React.FC = () => {
  const f = useCurrentFrame();
  const closeAt = s(36.27 - T.vault) - 18;
  const door = interpolate(f, [closeAt, closeAt + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const spin = interpolate(f, [closeAt + 18, closeAt + 40], [0, 180], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const push = interpolate(f, [0, s(5)], [1, 1.08], {extrapolateRight: 'clamp'});
  const lightO = 1 - door * 0.6;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#141414 0%, #2a2621 50%, #0b0a09 100%)', transform: `scale(${push})`}}>
      <svg width={W} height={H}>
        {/* ячейки */}
        {Array.from({length: 7}).map((_, r) =>
          Array.from({length: 5}).map((__, c) => (
            <g key={`${r}-${c}`}>
              <rect x={70 + c * 190} y={300 + r * 150} width={170} height={130} fill="#3a352e" stroke="#16130f" strokeWidth={6} />
              <circle cx={155 + c * 190} cy={365 + r * 150} r={9} fill="#16130f" />
            </g>
          )),
        )}
        {/* свет сверху */}
        <polygon points="440,0 640,0 860,1500 220,1500" fill="#ffe2a8" opacity={0.12 * lightO} />
        {/* открытая ячейка с деньгами */}
        <rect x={450} y={900} width={170} height={130} fill="#0d0b09" />
        {door < 0.5 && <Stack x={465} y={970} w={140} h={36} />}
        <Man x={330} y={1640} scale={1.25} rim="#a89a86" />
        {/* круглая дверь сейфа закрывается */}
        <g transform={`translate(${interpolate(door, [0, 1], [1500, 540])} 960)`}>
          <circle r={520} fill="#24211d" stroke="#0e0c0a" strokeWidth={30} />
          <circle r={430} fill="none" stroke="#3d3832" strokeWidth={10} />
          <g transform={`rotate(${spin})`}>
            {[0, 60, 120].map((a) => (
              <rect key={a} x={-180} y={-14} width={360} height={28} rx={14} fill="#5a5148" transform={`rotate(${a})`} />
            ))}
            <circle r={50} fill="#5a5148" />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Календарь: прошло два месяца
const Calendar: React.FC = () => {
  const f = useCurrentFrame();
  const len = s(T.ret - T.calendar);
  const day = Math.floor(interpolate(f, [0, len], [1, 61], {extrapolateRight: 'clamp'}));
  const months = ['МАЙ', 'ИЮНЬ', 'ИЮЛЬ'];
  const m = months[Math.min(2, Math.floor((day - 1) / 30))];
  const flip = (f % 3) / 3;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #2a1a0e 0%, #050403 80%)', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 560, height: 640, background: '#e8dcc4', borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', transform: `rotateX(${flip * 10}deg)`, marginTop: -200}}>
        <div style={{background: '#8e1d1d', color: '#f4e7cf', fontFamily: FONT, fontWeight: 800, fontSize: 64, textAlign: 'center', padding: '20px 0'}}>{m} 1926</div>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 300, color: '#1c130b', textAlign: 'center', lineHeight: 1.6}}>{((day - 1) % 30) + 1}</div>
      </div>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, color: GOLD, marginTop: 60, textShadow: '0 6px 24px rgba(0,0,0,0.9)'}}>2 МЕСЯЦА СПУСТЯ</div>
    </AbsoluteFill>
  );
};

// Капоне протягивает 5 000
const Gift: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [8, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const push = interpolate(f, [0, s(3.3)], [1, 1.1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, #4a2e15 0%, #160d06 60%, #050403 100%)', transform: `scale(${push})`}}>
      <svg width={W} height={H}>
        {/* рука Капоне справа (широкий рукав в полоску) */}
        <g transform={`translate(${interpolate(p, [0, 1], [180, 0])} 0)`}>
          <rect x={560} y={920} width={600} height={170} rx={60} fill={INK} />
          {Array.from({length: 6}).map((_, i) => (
            <line key={i} x1={700 + i * 70} y1={925} x2={700 + i * 70} y2={1085} stroke="#2a2018" strokeWidth={4} />
          ))}
          <ellipse cx={560} cy={1000} rx={110} ry={80} fill={INK} />
          <Stack x={430} y={950} w={170} h={50} />
        </g>
        {/* рука Люстига слева */}
        <g transform={`translate(${interpolate(p, [0, 1], [-160, 0])} 0)`}>
          <rect x={-100} y={1060} width={460} height={110} rx={50} fill={INK} />
          <ellipse cx={370} cy={1100} rx={80} ry={60} fill={INK} />
        </g>
        <ellipse cx={540} cy={1010} rx={260} ry={90} fill="#ffd98a" opacity={0.12} style={{filter: 'blur(30px)'}} />
      </svg>
    </AbsoluteFill>
  );
};

// Люстиг уходит в свет, монета блестит
const WalkAway: React.FC = () => {
  const f = useCurrentFrame();
  const len = s(T.end - T.plan);
  const p = interpolate(f, [0, len], [0, 1], {extrapolateRight: 'clamp'});
  const scale = interpolate(p, [0, 1], [1.4, 0.8]);
  const y = interpolate(p, [0, 1], [1720, 1340]);
  const coinY = -Math.abs(Math.sin((f / 18) * Math.PI)) * 160;
  const coinW = Math.abs(Math.cos(f / 3));
  return (
    <AbsoluteFill style={{backgroundColor: '#070504'}}>
      <svg width={W} height={H}>
        <defs>
          <linearGradient id="spill2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffcf86" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ffcf86" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={360} y={520} width={360} height={820} fill="#ffd79a" style={{filter: 'drop-shadow(0 0 60px #ffb347)'}} />
        <polygon points="360,1340 720,1340 1330,1920 -250,1920" fill="url(#spill2)" />
        <Man x={540} y={y} scale={scale} walk={p * Math.PI * 8} />
        <ellipse cx={540 + 95 * scale} cy={y - 330 * scale + coinY * scale} rx={22 * scale * coinW + 2} ry={22 * scale} fill={GOLD} style={{filter: 'drop-shadow(0 0 12px #ffd27a)'}} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Тексты ----------
const Slam: React.FC<{text: string; color?: string}> = ({text, color}) => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [0, 5], [1.9, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
  const o = interpolate(f, [0, 3, 26, 34], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
  const size = text.length > 9 ? 108 : text.length > 6 ? 140 : 180;
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 330}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: 4, color: color ?? 'white', opacity: o, transform: `scale(${scale})`, whiteSpace: 'nowrap', textShadow: '0 10px 40px rgba(0,0,0,0.95)', WebkitTextStroke: '3px rgba(0,0,0,0.55)'}}>{text}</div>
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame: f - 3, fps, config: {damping: 16}});
  const out = interpolate(f, [s(3.3), s(3.7)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 300, opacity: a * out}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 70, color: 'white', textAlign: 'center', lineHeight: 1.18, maxWidth: 940, transform: `translateY(${(1 - a) * -30}px)`, textShadow: '0 4px 24px rgba(0,0,0,0.95)'}}>
        Как обмануть
        <br />
        <span style={{color: GOLD}}>самого опасного</span>
        <br />
        человека в Америке?
      </div>
    </AbsoluteFill>
  );
};

const Place: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  const shown = Math.floor(interpolate(f, [4, 4 + text.length * 2], [0, text.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const o = interpolate(f, [40, 52], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
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
  if (t < 3.3 || t >= T.end - 0.05) return null;
  const lines = captions as Line[];
  const idx = lines.findIndex((l, i) => t >= l.start - 0.05 && t < Math.min(lines[i + 1]?.start ?? 999, l.end + 0.6) - 0.05);
  if (idx < 0) return null;
  const line = lines[idx];
  const enter = spring({frame: f - Math.round((line.start - 0.05) * fps), fps, config: {damping: 18, stiffness: 200}});
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 1480}}>
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

const EndScene: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame: f - 2, fps, config: {damping: 18}});
  const b = spring({frame: f - s(65.58 - T.end), fps, config: {damping: 18}});
  const c = spring({frame: f - s(70.19 - T.end), fps, config: {damping: 18}});
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #2a170b 0%, #0a0604 65%, #050403 100%)'}}>
      <Rain frame={f} opacity={0.18} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <Smoke x={540} y={1900} frame={f} count={18} />
      </svg>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 170, color: GOLD, letterSpacing: 10, opacity: a, transform: `scale(${0.85 + 0.15 * a})`, textShadow: '0 0 40px rgba(232,176,75,0.45), 0 8px 30px rgba(0,0,0,0.9)', whiteSpace: 'nowrap'}}>ЗАКОН 12</div>
        <div style={{width: 440 * b, height: 3, background: GOLD, margin: '30px 0'}} />
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 58, color: 'white', textAlign: 'center', lineHeight: 1.25, maxWidth: 920, opacity: b, transform: `translateY(${(1 - b) * 20}px)`}}>
          Один честный поступок
          <br />
          обезоруживает сильнее,
          <br />
          чем тысяча слов
        </div>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 44, color: '#e9dccb', textAlign: 'center', lineHeight: 1.3, maxWidth: 900, marginTop: 60, opacity: c, transform: `translateY(${(1 - c) * 20}px)`}}>
          Будь <span style={{color: RED, fontWeight: 800}}>осторожен</span> с теми,
          <br />
          кто слишком честен и щедр с тобой
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: '#fff3dc', opacity: interpolate(f, [0, 2, 8], [0, 0.6, 0], {extrapolateRight: 'clamp'})}} />;
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', top: 0, left: 0, height: 8, width: `${(f / NOIR12_FULL_TOTAL) * 100}%`, background: GOLD, boxShadow: `0 0 12px ${GOLD}`}} />;
};

// ---------- Сборка ----------
const SCENES: {at: number; el: React.ReactNode}[] = [
  {at: T.chicago, el: <Chicago />},
  {at: T.office, el: <OfficeScene />},
  {at: T.threat, el: <CaponeClose tint="#a01818" />},
  {at: T.door, el: <Doorway />},
  {at: T.eiffel, el: <Eiffel />},
  {at: T.meet, el: <Meeting />},
  {at: T.briefcase, el: <Briefcase />},
  {at: T.vault, el: <Vault />},
  {at: T.calendar, el: <Calendar />},
  {at: T.ret, el: <Meeting stacksFrom={s(42.3 - T.ret)} bowAt={s(44.56 - T.ret)} />},
  {at: T.shock, el: <CaponeClose cigarFallAt={s(51.0 - T.shock)} />},
  {at: T.gift, el: <Gift />},
  {at: T.plan, el: <WalkAway />},
  {at: T.end, el: <EndScene />},
];

const PLACES: {text: string; at: number}[] = [
  {text: 'ЧИКАГО, 1926', at: 6.7},
  {text: 'ПАРИЖ, 1925', at: 19.9},
  {text: 'БАНК', at: 33.4},
];

export const Noir12Full: React.FC = () => {
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
  const fadeOut = interpolate(f, [NOIR12_FULL_TOTAL - 15, NOIR12_FULL_TOTAL], [1, 0], {extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <AbsoluteFill style={{opacity: fadeOut}}>
        <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px)`}}>
          {SCENES.map((sc, i) => {
            const from = s(sc.at);
            const to = i + 1 < SCENES.length ? s(SCENES[i + 1].at) : NOIR12_FULL_TOTAL;
            return (
              <Sequence key={sc.at} from={from} durationInFrames={to - from} premountFor={15}>
                {sc.el}
              </Sequence>
            );
          })}
        </AbsoluteFill>
        <FilmLook />
        {SCENES.slice(1).map((sc) => (
          <Sequence key={`fl${sc.at}`} from={s(sc.at)} durationInFrames={8}>
            <Flash />
          </Sequence>
        ))}
        <Sequence durationInFrames={s(3.8)}>
          <Hook />
        </Sequence>
        {PLACES.map((p) => (
          <Sequence key={p.text} from={s(p.at)} durationInFrames={54}>
            <Place text={p.text} />
          </Sequence>
        ))}
        {SLAMS.map((sl) => (
          <Sequence key={sl.text} from={s(sl.at)} durationInFrames={34}>
            <Slam text={sl.text} color={sl.color} />
          </Sequence>
        ))}
        <Subs />
        <Progress />
      </AbsoluteFill>

      {/* Звук */}
      <Audio src={staticFile('z12/voice.mp3')} volume={1} />
      <Audio src={staticFile('drone.mp3')} volume={0.15} />
      <Audio src={staticFile('z11/pulse.wav')} volume={(fr) => interpolate(fr, [0, 30, s(T.end) - 10, s(T.end)], [0, 0.35, 0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      <Audio src={staticFile('z12/rain.wav')} loop volume={(fr) => interpolate(fr, [0, 15, s(T.office) - 5, s(T.office) + 10], [0, 0.45, 0.45, 0], {extrapolateRight: 'clamp'})} />
      <Sequence from={s(T.end)}>
        <Audio src={staticFile('z12/rain.wav')} loop volume={0.25} />
      </Sequence>
      {SCENES.slice(1).map((sc) => (
        <Sequence key={`w${sc.at}`} from={s(sc.at) - 6} durationInFrames={20}>
          <Audio src={staticFile('z11/whoosh.wav')} volume={0.4} />
        </Sequence>
      ))}
      {SLAMS.map((sl) => (
        <Sequence key={`b${sl.text}`} from={s(sl.at)} durationInFrames={45}>
          <Audio src={staticFile('z11/boom.wav')} volume={0.6} />
        </Sequence>
      ))}
      <Sequence from={s(32.3)} durationInFrames={20}>
        <Audio src={staticFile('z12/cash.wav')} volume={0.6} />
      </Sequence>
      {[0, 1, 2].map((i) => (
        <Sequence key={`c${i}`} from={s(42.3) + i * 16} durationInFrames={20}>
          <Audio src={staticFile('z12/cash.wav')} volume={0.5} />
        </Sequence>
      ))}
      <Sequence from={s(36.27)} durationInFrames={40}>
        <Audio src={staticFile('z12/clank.wav')} volume={0.8} />
      </Sequence>
      {Array.from({length: 12}).map((_, i) => (
        <Sequence key={`fp${i}`} from={s(T.calendar) + i * 4} durationInFrames={6}>
          <Audio src={staticFile('z12/flip.wav')} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={s(T.end) - s(2.5)} durationInFrames={s(2.6)}>
        <Audio src={staticFile('z11/riser.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={s(T.end)} durationInFrames={45}>
        <Audio src={staticFile('z11/boom.wav')} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
