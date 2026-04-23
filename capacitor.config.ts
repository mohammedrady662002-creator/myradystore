import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rady.store',
  appName: 'راضي ستور',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
