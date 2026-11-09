import {Config} from '@remotion/cli/config';

// Defaults for `npx remotion studio` / `npx remotion render`. scripts/render.mjs sets the same values itself.
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuv420p');
Config.setCrf(16);
Config.setChromiumOpenGlRenderer('angle');
Config.setOverwriteOutput(true);
