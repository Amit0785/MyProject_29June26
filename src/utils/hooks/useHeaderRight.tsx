// hooks/useHeaderRight.ts
import { useLayoutEffect } from 'react';
import { Pressable } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@app/types';
import { moderateScale } from '@app/utils/orientation';

type HeaderRightConfig = {
  icon: React.ReactNode;
  onPress: () => void;
};

export const useHeaderRight = (
  props: StackScreenProps<RootStackParamList>,
  config: HeaderRightConfig | null,
) => {
  useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: config
        ? () => (
            <Pressable
              onPress={config.onPress}
              style={{ paddingHorizontal: moderateScale(16) }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              {config.icon}
            </Pressable>
          )
        : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.navigation, config?.onPress, config?.icon]);
};
