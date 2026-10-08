import {Composition} from 'remotion';
import {Zakon10, TOTAL_FRAMES, FPS} from './Zakon10';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Zakon10"
    component={Zakon10}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
