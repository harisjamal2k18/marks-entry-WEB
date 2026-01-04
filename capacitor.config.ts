import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marksentry.app', // This is your unique App ID
  appName: 'Marks Entry',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;