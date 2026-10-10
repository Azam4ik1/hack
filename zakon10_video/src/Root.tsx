import {Composition} from 'remotion';
import {Zakon10, TOTAL_FRAMES, FPS} from './Zakon10';
import {Zakon11, Z11_TOTAL} from './Zakon11';
import {Zakon11B} from './Zakon11B';
import {Noir12, NOIR12_TOTAL} from './Noir12';
import {Noir12Full, NOIR12_FULL_TOTAL} from './Noir12Full';
import {Split12} from './Split12';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Zakon10" component={Zakon10} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="Zakon11" component={Zakon11} durationInFrames={Z11_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Zakon11B" component={Zakon11B} durationInFrames={Z11_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Noir12" component={Noir12} durationInFrames={NOIR12_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Noir12Full" component={Noir12Full} durationInFrames={NOIR12_FULL_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Split12" component={Split12} durationInFrames={NOIR12_FULL_TOTAL} fps={30} width={1080} height={1920} />
  </>
);
