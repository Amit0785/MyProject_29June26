import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import React from 'react';
import { moderateScale } from '@app/utils/orientation';
import { Colors, Fonts } from '@app/themes';

export interface IButtonProps {
  buttonText?: string;
  onPress: () => void;
  buttonContainerStyle?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  labelColor?: string;
  labelFont?: string;
}

const CButton: React.FC<IButtonProps> = props => {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={props.onPress}
      style={[styles.container, props.buttonContainerStyle]}
      disabled={props.disabled}
    >
      {props.loading != null && props.loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            {
              color: props.labelColor ?? '#0f172a',
              fontFamily: props.labelFont ?? Fonts.InterRegular,
            },
          ]}
        >
          {props.buttonText}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: moderateScale(48),
    borderRadius: moderateScale(80),
    backgroundColor: Colors.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(30),
  },
  buttonText: {
    fontSize: moderateScale(16),
    color: '#0f172a',
  },
});

export default CButton;
