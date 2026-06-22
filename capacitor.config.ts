import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pomochi.app',
  appName: 'Pomochi',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  ios: {
    preferredScheme: 'ios',
  },
  android: {
    preferredScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#D4A574',
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#D4A574',
    },
  },
}

export default config
