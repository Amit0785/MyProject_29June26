import { Platform } from 'react-native';

export const Fonts = {
  InterSemiBold:
    Platform.OS === 'ios' ? 'Inter28pt-SemiBold' : 'Inter_28pt-SemiBold',
  InterBold: Platform.OS === 'ios' ? 'Inter28pt-SemiBold' : 'Inter_28pt-Bold',
  InterRegular:
    Platform.OS === 'ios' ? 'Inter28pt-Regular' : 'Inter_28pt-Regular',
  InterMedium: Platform.OS === 'ios' ? 'Inter28pt-Medium' : 'Inter_28pt-Medium',
};
