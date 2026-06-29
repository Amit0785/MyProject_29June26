declare module '*.svg' {
  import React from 'react';
  import {SvgProps} from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
declare module 'react-native-image-crop-picker' {
  const content: any;
  export default content;
}
declare module 'react-native-mmkv' {
  export const MMKV: any;
}
