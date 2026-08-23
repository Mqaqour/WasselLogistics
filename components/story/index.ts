// Barrel for direct (non-lazy) imports of the story types/config from other
// modules. `App.tsx` intentionally imports `WasselStorySection` via a
// dynamic `import('./components/story/WasselStorySection')` instead of this
// barrel, so the three.js/R3F/gsap chunk stays code-split from the rest of
// the app — importing that component through here would defeat the split.
export * from './types';
export * from './stagesConfig';
export { WasselStorySection } from './WasselStorySection';
