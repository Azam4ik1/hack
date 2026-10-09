import {Composition} from 'remotion';
import {Zakon10, TOTAL_FRAMES, FPS} from './Zakon10';
import {Zakon11, Z11_TOTAL} from './Zakon11';
import {Zakon11B} from './Zakon11B';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Zakon10" component={Zakon10} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="Zakon11" component={Zakon11} durationInFrames={Z11_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Zakon11B" component={Zakon11B} durationInFrames={Z11_TOTAL} fps={30} width={1080} height={1920} />
  </>
);
