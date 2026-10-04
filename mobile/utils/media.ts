// Native replacement for web <input type="file"> + FileReader: returns data URLs like the web app expects.
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

export interface PickedMedia {
  dataUrl: string;
  uri: string;
  base64: string;
  mime: string;
  isVideo: boolean;
}

interface PickOpts {
  source: 'camera' | 'gallery';
  facing?: 'user' | 'environment';
  video?: boolean;
  multiple?: boolean;
  quality?: number;
}

export async function pickMedia(opts: PickOpts): Promise<PickedMedia[]> {
  const isVideo = !!opts.video;
  try {
    if (opts.source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera permission needed', 'Please allow camera access in Settings to take photos.');
        return [];
      }
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Gallery permission needed', 'Please allow photo access in Settings to choose files.');
        return [];
      }
    }

    const common: ImagePicker.ImagePickerOptions = {
      mediaTypes: isVideo ? ['videos'] : ['images'],
      quality: opts.quality ?? 0.7,
      base64: !isVideo,
      allowsMultipleSelection: !!opts.multiple && opts.source === 'gallery',
    };

    const res =
      opts.source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            ...common,
            cameraType: opts.facing === 'user' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
          })
        : await ImagePicker.launchImageLibraryAsync(common);

    if (res.canceled || !res.assets?.length) return [];

    const out: PickedMedia[] = [];
    for (const a of res.assets) {
      const mime = a.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
      let b64 = a.base64 || '';
      if (!b64) {
        b64 = await FileSystem.readAsStringAsync(a.uri, { encoding: FileSystem.EncodingType.Base64 });
      }
      out.push({ dataUrl: `data:${mime};base64,${b64}`, uri: a.uri, base64: b64, mime, isVideo });
    }
    return out;
  } catch (e) {
    console.warn('[pickMedia] failed', e);
    Alert.alert('Could not open picker', String((e as any)?.message || e));
    return [];
  }
}

// Android/iOS-friendly choice between camera and gallery
export function chooseSource(): Promise<'camera' | 'gallery' | null> {
  return new Promise((resolve) => {
    Alert.alert('Add photo', undefined, [
      { text: 'Camera', onPress: () => resolve('camera') },
      { text: 'Gallery', onPress: () => resolve('gallery') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
