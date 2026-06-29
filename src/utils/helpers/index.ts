import { Alert, Linking, Platform } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { showMessage } from './Toast';
import moment from 'moment';

// Define the callback type for image responses
export type ImageCallback = {
  id?: number | string;
  fileName: string | null;
  size: number | null;
  path: {
    name: string;
    type: string;
    uri: string;
  } | null;
};

// Define the input props type for the camera function
type ImagePickerProps = {
  isCrop?: boolean;
  callback: (res: ImageCallback) => void;
  size?: {
    width?: number;
    height?: number;
  };
  cropperCircleOverlay?: boolean;
  mediaType?: 'photo' | 'video' | 'any';
};

type PickerImage = {
  path: string;
  mime: string;
};

// Define the input props type for the camera function
type ImagePickerProps2 = {
  mediaType?: 'photo' | 'video' | 'any' | undefined;
  callback: (res: ImageCallback[]) => void;
  size?: {
    width?: number;
    height?: number;
  };
  cropperCircleOverlay?: boolean;
};

const MAX_FILE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

// Utility function to format the image object
const formatImage = (image: PickerImage): ImageCallback['path'] => {
  const { path, mime } = image;
  const fileName = path.split('/').pop() || 'unknown';
  return {
    name: fileName,
    type: mime,
    uri: Platform.OS === 'android' ? path : path.replace('file://', ''),
  };
};

// Function to pick an image from the gallery
export const getImageFromGallery = async ({
  isCrop = false,
  callback,
  size = { width: 400, height: 400 },
  cropperCircleOverlay = false,
}: ImagePickerProps): Promise<void> => {
  try {
    const image = await ImagePicker.openPicker({
      width: size.width,
      height: size.height,
      cropping: isCrop,
      mediaType: 'photo',
      cropperCircleOverlay: cropperCircleOverlay,
    });

    callback({
      fileName: image.filename ?? '',
      size: image.size ?? -1,
      path: formatImage(image),
    });
  } catch (error) {
    console.error('Gallery Error:', error);
    const _err = new String(error).toString().includes('permission');
    if (_err) {
      if (Platform.OS === 'ios') {
        Alert.alert('Permission Denied', 'Please Give Access', [
          {
            text: 'cancel',
          },
          {
            text: 'settings',
            onPress: () => {
              Linking.openSettings()
                .then(() => {})
                .catch(_ => {});
            },
          },
        ]);
      } else {
        showMessage(
          (error as any)?.message ??
            'Something went wrong, please try again later.',
        );
        setTimeout(() => {
          Linking.openSettings().catch(() => {
            showMessage('Unable to open settings');
          });
        }, 1000);
      }
    } else {
      showMessage(
        (error as any)?.message ??
          'Something went wrong, please try again later.',
      );
    }
    callback({
      fileName: null,
      size: null,
      path: null,
    });
  }
};

// Function to pick multiple images from the gallery
export const getMultipleImagesFromGallery = async ({
  callback,
  size = { width: 400, height: 400 },
  mediaType = 'photo',
}: ImagePickerProps): Promise<void> => {
  try {
    const imageList = await ImagePicker.openPicker({
      width: size.width,
      height: size.height,
      mediaType: mediaType,
      multiple: true,
    });

    for (let i = 0; i < imageList.length; i++) {
      if (
        imageList[i].mime.includes('video') &&
        imageList[i].size > MAX_VIDEO_SIZE_BYTES
      ) {
        showMessage('Video size exceeds the limiot of 100 mb');
      } else if (
        imageList[i].mime.includes('image') &&
        imageList[i].size > MAX_FILE_SIZE_BYTES
      ) {
        showMessage('Image size exceeds the limiot of 100 mb');
      } else {
        callback({
          id: i + 1,
          fileName: imageList[i].filename ?? '',
          size: imageList[i].size ?? -1,
          path: formatImage(imageList[i]),
        });
      }
    }
  } catch (error) {
    console.error('Gallery Error:', error);
    const _err = new String(error).toString().includes('permission');
    if (_err) {
      if (Platform.OS === 'ios') {
        Alert.alert('Permission Denied', 'Please Give Access', [
          {
            text: 'cancel',
          },
          {
            text: 'settings',
            onPress: () => {
              Linking.openSettings()
                .then(() => {})
                .catch(_ => {});
            },
          },
        ]);
      } else {
        showMessage(
          (error as any)?.message ??
            'Something went wrong, please try again later.',
        );
        setTimeout(() => {
          Linking.openSettings().catch(() => {
            showMessage('Unable to open settings');
          });
        }, 1000);
      }
    } else {
      showMessage(
        (error as any)?.message ??
          'Something went wrong, please try again later.',
      );
    }
    callback({
      fileName: null,
      size: null,
      path: null,
    });
  }
};

export const getMultipleImagesFromGallery2 = async ({
  mediaType = 'photo',
  callback,
  size = { width: 400, height: 400 },
  cropperCircleOverlay = false,
}: ImagePickerProps2): Promise<void> => {
  try {
    const picked = await ImagePicker.openPicker({
      width: size.width,
      height: size.height,
      mediaType,
      cropperCircleOverlay,
      multiple: true,
    });

    // filter out files that exceed the limits
    const allowed = (picked as any[]).filter((item: any) => {
      const bytes = item.size ?? 0;
      const tooBig =
        (item.mime?.startsWith('image/') && bytes > MAX_FILE_SIZE_BYTES) ||
        (item.mime?.startsWith('video/') && bytes > MAX_VIDEO_SIZE_BYTES);

      return !tooBig;
    });

    // warn the user if something was skipped
    if (allowed.length !== (picked as any[]).length) {
      showMessage(
        'Some files were skipped because they exceed the size limit' +
          ` (${MAX_FILE_SIZE_MB} MB for images, ` +
          `${MAX_VIDEO_SIZE_MB} MB for videos).`,
      );
    }

    const formatted: ImageCallback[] = allowed.map((img: any, i: number) => ({
      id: i + 1,
      fileName: img.filename ?? '',
      size: img.size ?? -1,
      path: formatImage(img),
    }));

    callback(formatted);
  } catch (err) {
    console.error('Gallery Error:', err);
    const isPermissionError = String(err).toLowerCase().includes('permission');

    if (isPermissionError) {
      if (Platform.OS === 'ios') {
        Alert.alert('Permission Denied', 'Please Give Access', [
          { text: 'Cancel' },
          {
            text: 'Settings',
            onPress: () => Linking.openSettings().catch(() => {}),
          },
        ]);
      } else {
        showMessage(
          (err as any)?.message ??
            'Something went wrong, please try again later.',
        );
        setTimeout(() => {
          Linking.openSettings().catch(() => {
            showMessage('Unable to open settings');
          });
        }, 1000);
      }
    } else {
      showMessage(
        (err as any)?.message ??
          'Something went wrong, please try again later.',
      );
    }

    // indicate failure
    callback([]);
  }
};

// Function to capture an image using the camera
export const getImageFromCamera = async ({
  isCrop = false,
  callback,
  size = { width: 400, height: 400 },
  cropperCircleOverlay = false,
}: ImagePickerProps): Promise<void> => {
  try {
    const image = await ImagePicker.openCamera({
      width: size.width,
      height: size.height,
      cropping: isCrop,
      mediaType: 'photo',
      cropperCircleOverlay: cropperCircleOverlay,
    });

    callback({
      fileName: image.filename ?? '',
      size: image.size ?? -1,
      path: formatImage(image),
    });
  } catch (error) {
    const _err = new String((error as any)?.message).toString().includes('permission');
    if (_err) {
      if (Platform.OS === 'ios') {
        Alert.alert('Permission Denied', 'Please Give Access', [
          {
            text: 'cancel',
          },
          {
            text: 'settings',
            onPress: () => {
              Linking.openSettings()
                .then(() => {})
                .catch(_ => {});
            },
          },
        ]);
      } else {
        showMessage(
          (error as any)?.message ??
            'Something went wrong, please try again later.',
        );
        setTimeout(() => {
          Linking.openSettings().catch(() => {
            showMessage('Unable to open settings');
          });
        }, 1000);
      }
    } else {
      showMessage(
        (error as any)?.message ??
          'Something went wrong, please try again later.',
      );
    }
    callback({
      fileName: null,
      size: null,
      path: null,
    });
  }
};

export function hexToRGB(
  hex: string,
  opacity: number = 1,
  defaultColor: string = 'red',
): string {
  let c: string[] | number;

  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = parseInt(c.join(''), 16);

    return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(
      ',',
    )},${opacity})`;
  }

  return defaultColor;
}

//Time Zone Func
export const timeZoneFunc = () => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timeZone;
};

// Capitalize First Letter
export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Function to disoplay date time
export const calenderDateTime = (timeString: string) => {
  const time = moment.utc(timeString).local(); // convert to local time if needed

  const now = moment();
  const isToday = time.isSame(now, 'day');
  const isYesterday = time.isSame(moment().subtract(1, 'day'), 'day');

  let displayTime = '';

  if (isToday) {
    displayTime = 'Today';
  } else if (isYesterday) {
    displayTime = 'Yesterday';
  } else {
    displayTime = time.format('D MMMM YYYY'); // e.g., "22 September 2023"
  }

  return displayTime;
};

export const generateId = () => {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
};
