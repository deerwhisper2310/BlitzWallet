import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {GlobalThemeView} from '../../../../functions/CustomElements';
import {COLORS, ICONS, SIZES, WEBSITE_REGEX} from '../../../../constants';
import {useNavigation} from '@react-navigation/native';

import {useCallback, useEffect, useState} from 'react';
import openWebBrowser from '../../../../functions/openWebBrowser';
import handleBackPress from '../../../../hooks/handleBackPress';
import {CENTER} from '../../../../constants/styles';
import {FONT, WINDOWWIDTH} from '../../../../constants/theme';
import CustomButton from '../../../../functions/CustomElements/button';
import GetThemeColors from '../../../../hooks/themeColors';
import ThemeImage from '../../../../functions/CustomElements/themeImage';
import {useTranslation} from 'react-i18next';

export default function ManualEnterSendAddress() {
  const navigate = useNavigation();
  const {t} = useTranslation();

  const [inputValue, setInputValue] = useState('');
  const {textInputBackground, textInputColor} = GetThemeColors();
  const handleBackPressFunction = useCallback(() => {
    navigate.goBack();
    return true;
  }, [navigate]);

  useEffect(() => {
    handleBackPress(handleBackPressFunction);
  }, [handleBackPressFunction]);

  return (
    <GlobalThemeView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{flex: 1}}>
        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            setTimeout(() => {
              navigate.goBack();
            }, 200);
          }}
          style={{width: WINDOWWIDTH, ...CENTER}}>
          <ThemeImage
            styles={styles.backArrow}
            darkModeIcon={ICONS.smallArrowLeft}
            lightModeIcon={ICONS.smallArrowLeft}
            lightsOutIcon={ICONS.arrow_small_left_white}
          />
          {/* <Image style={[backArrow]} source={ICONS.smallArrowLeft} /> */}
        </TouchableOpacity>

        <View style={styles.innerContainer}>
          <TextInput
            style={[
              styles.testInputStyle,

              {
                backgroundColor: textInputBackground,
                color: textInputColor,
              },
            ]}
            multiline
            onChangeText={setInputValue}
            value={inputValue}
            textAlignVertical="top"
            placeholder={t('wallet.manualInputPage.inputPlaceholder')}
            placeholderTextColor={COLORS.opaicityGray}
          />

          <CustomButton
            buttonStyles={{
              opacity: !inputValue ? 0.5 : 1,
              width: 'auto',
              marginTop: 'auto',
              marginBottom: Platform.OS == 'ios' ? 10 : 0,
            }}
            actionFunction={hanldeSubmit}
            textContent={t('constants.accept')}
          />
        </View>
      </KeyboardAvoidingView>
    </GlobalThemeView>
  );
  function hanldeSubmit() {
    if (!inputValue) return;
    if (WEBSITE_REGEX.test(inputValue)) {
      openWebBrowser({navigate, link: inputValue});
      return;
    }
    Keyboard.dismiss();
    navigate.navigate('HomeAdmin');
    navigate.navigate('ConfirmPaymentScreen', {
      btcAdress: inputValue,
    });
  }
}

const styles = StyleSheet.create({
  innerContainer: {
    width: WINDOWWIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...CENTER,
  },
  testInputStyle: {
    width: '95%',
    height: 150,

    borderRadius: 8,

    fontSize: SIZES.large,
    fontFamily: FONT.Title_Regular,

    marginTop: 'auto',
    padding: 10,
  },
});
