// Native stand-ins for browser APIs the web screens use (confirm, Audio, clipboard, share, window.open).
import { Alert, Linking, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { Audio as ExpoAudio } from 'expo-av';
import * as Speech from 'expo-speech';

export const confirmAsync = (message: string, title = 'FasalDost'): Promise<boolean> =>
  new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) })
  );

export const openUrl = async (url: string) => {
  try { await Linking.openURL(url); } catch { Alert.alert('Cannot open link', url); }
};

export const copyText = async (text: string): Promise<boolean> => {
  try { await Clipboard.setStringAsync(text); return true; } catch { return false; }
};

export const shareText = async (title: string, text: string): Promise<boolean> => {
  try { await Share.share({ title, message: text }); return true; } catch { return false; }
};

// Minimal HTMLAudioElement look-alike used by ResultScreen (data URL -> temp file -> expo-av).
export class NativeAudio {
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private sound: ExpoAudio.Sound | null = null;
  private file: string | null = null;
  constructor(private dataUrl: string) {}

  async play(): Promise<void> {
    const [head, b64] = this.dataUrl.split(',');
    const ext = /mp3|mpeg/.test(head) ? 'mp3' : 'wav';
    this.file = `${FileSystem.cacheDirectory}fd_tts_${Date.now()}.${ext}`;
    await FileSystem.writeAsStringAsync(this.file, b64, { encoding: FileSystem.EncodingType.Base64 });
    await ExpoAudio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await ExpoAudio.Sound.createAsync({ uri: this.file }, { shouldPlay: true });
    this.sound = sound;
    sound.setOnPlaybackStatusUpdate((st: any) => {
      if (st?.didJustFinish) this.onended?.();
      if (st?.error) this.onerror?.();
    });
  }

  pause() {
    const s = this.sound;
    this.sound = null;
    s?.stopAsync().catch(() => {}).finally(() => s?.unloadAsync().catch(() => {}));
    if (this.file) FileSystem.deleteAsync(this.file, { idempotent: true }).catch(() => {});
  }
}

export const speechLangMap: Record<string, string> = {
  en: 'en-US', ur: 'ur-PK', zh: 'zh-CN', hi: 'hi-IN', es: 'es-ES', ar: 'ar-SA',
};

export const nativeSpeak = (text: string, lang: string, onDone: () => void) => {
  Speech.stop();
  Speech.speak(text, {
    language: speechLangMap[lang] || 'en-US',
    rate: lang === 'ur' || lang === 'ar' ? 0.88 : 0.95,
    pitch: 1.0,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
};
export const nativeSpeakStop = () => Speech.stop();
