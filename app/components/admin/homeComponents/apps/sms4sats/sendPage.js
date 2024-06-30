import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {ThemeText} from '../../../../../functions/CustomElements';
import {COLORS, FONT, ICONS, SIZES} from '../../../../../constants';

export default function SMSMessagingSendPage() {
  return (
    <>
      <View style={styles.homepage}>
        <ThemeText
          styles={{textAlign: 'center', fontSize: SIZES.large}}
          content={'Send page'}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  homepage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
