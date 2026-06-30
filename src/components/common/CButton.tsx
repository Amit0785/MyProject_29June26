import { Colors } from '@app/themes';
import { moderateScale, verticalScale } from '@app/utils/orientation';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

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
        <Text style={[styles.buttonText]}>{props.buttonText}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: moderateScale(30),

    backgroundColor: Colors.primary,
    borderRadius: moderateScale(8),
    height: verticalScale(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default CButton;
