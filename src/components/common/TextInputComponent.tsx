/* eslint-disable react-native/no-inline-styles */
import { Colors, Fonts } from '@app/themes';
import { moderateScale, normalize } from '@app/utils/orientation';
import React from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

export interface ITextInputProps extends TextInputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  secure?: boolean;
  onPressIcon?: () => void;
  keyboardType: KeyboardTypeOptions;
  error?: boolean | string | undefined;
  maxLength?: number;
  autoCaps?: 'none' | 'sentences' | 'words' | 'characters';
  containerStyles?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  multiline?: boolean;
  editable?: boolean;
}

const TextInputComponent: React.FC<ITextInputProps> = props => {
  return (
    <View style={[styles.container, props.containerStyles]}>
      {/* {props.label && <Text style={styles.labelText}>{props.label}</Text>} */}
      <View
        style={[
          styles.inputContainer,
          {
            height:
              props.multiline != null && props.multiline
                ? moderateScale(120)
                : moderateScale(50),
            borderColor: props.error ? Colors.red : Colors.slate400,
          },
          props.inputContainerStyle,
        ]}
      >
        {props.leftIcon && (
          <View style={{ marginRight: moderateScale(8) }}>
            {props.leftIcon}
          </View>
        )}
        <TextInput
          style={[
            styles.textInputContainer,
            {
              width:
                props.rightIcon && props.leftIcon
                  ? '70%'
                  : !props.rightIcon && !props.leftIcon
                    ? '100%'
                    : props.rightIcon || props.leftIcon
                      ? '85%'
                      : '80%',
            },
            props.style,
          ]}
          textAlignVertical={props.multiline ? 'top' : 'center'}
          placeholder={props.placeholder}
          placeholderTextColor={Colors.slate400}
          value={props.value}
          onChangeText={props.onChangeText}
          secureTextEntry={props.secure}
          keyboardType={props.keyboardType}
          maxLength={props?.maxLength}
          autoCapitalize={props.autoCaps}
          multiline={props.multiline}
          editable={props.editable}
        />
        {props.rightIcon && (
          <Pressable
            style={styles.rightIconPressContainer}
            onPress={() => {
              if (props.onPressIcon) {
                props.onPressIcon();
              }
            }}
          >
            {props.rightIcon}
          </Pressable>
        )}
      </View>
      {props.error && <Text style={styles.errorText}>{props.error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: moderateScale(20),
  },
  labelText: {
    color: Colors.black,
    fontFamily: Fonts.InterMedium,
    fontSize: moderateScale(14),
    marginBottom: moderateScale(10),
  },
  textInputContainer: {
    height: '100%',
    alignSelf: 'center',
    fontFamily: Fonts.InterRegular,
    //backgroundColor: '#0f172a',
    borderRadius: 8,
    color: '#f8fafc',
    fontSize: normalize(12),
  },
  inputContainer: {
    width: '100%',
    borderColor: Colors.slate400,
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(1),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    textAlignVertical: 'top',
  },
  rightIconPressContainer: {
    width: moderateScale(40),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorText: {
    //textAlign: 'center',
    color: Colors.red,
    marginTop: 5,
    fontFamily: Fonts.InterRegular,
    fontSize: moderateScale(14),
  },
});

export default TextInputComponent;
