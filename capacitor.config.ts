import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The phone builds wrap exactly the bundle `apps/web` produces. Run
 * `npm run build` before `npx cap sync` so `apps/web/dist` is current.
 */
const config: CapacitorConfig = {
  appId: 'com.compassmaritime.compasserror',
  appName: 'Compass Error',
  webDir: 'apps/web/dist',
  android: {
    backgroundColor: '#0b1220',
  },
  ios: {
    backgroundColor: '#0b1220',
    contentInset: 'always',
  },
};

export default config;
