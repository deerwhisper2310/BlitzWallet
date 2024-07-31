import {useEffect} from 'react';
import {SafeAreaView, Text, View} from 'react-native';
import {
  EnvironmentType,
  NodeConfigVariant,
  connect,
  defaultConfig,
  listFiatCurrencies,
  mnemonicToSeed,
  nodeInfo,
} from '@breeztech/react-native-breez-sdk';
import {btoa, atob, toByteArray} from 'react-native-quick-base64';
import {generateMnemonic} from '@dreson4/react-native-quick-bip39';

const onBreezEvent = e => {
  console.log(`Received event ${e.type}`);
};

export default function BreezTest() {
  // SDK events listener

  useEffect(() => {
    connectToBreezNode();
    // (async () => {
    //   console.log(await listc());
    // })();
  }, []);
  return (
    <View>
      <SafeAreaView>
        <Text>Testing</Text>
      </SafeAreaView>
    </View>
  );
}

async function connectToBreezNode() {
  try {
    // Create the default config
    // const mnemoinc = await retrieveData('mnemonic');
    const mnemonic = generateMnemonic();

    const seed = await mnemonicToSeed(mnemonic);

    const nodeConfig = {
      type: NodeConfigVariant.GREENLIGHT,
      config: {
        // inviteCode: inviteCode,
        partnerCredentials: {
          //IOS needs to be developerKey abd developerCert
          developerKey: unit8ArrayConverter(
            toByteArray(btoa(process.env.GL_CUSTOM_NOBODY_KEY)),
          ),
          developerCert: unit8ArrayConverter(
            toByteArray(btoa(process.env.GL_CUSTOM_NOBODY_CERT)),
          ),
        },
      },
    };

    const config = await defaultConfig(
      EnvironmentType.PRODUCTION,
      process.env.API_KEY,
      nodeConfig,
    );

    // config.workingDir = filesystem.documentDirectory;

    // Connect to the Breez SDK make it ready for use
    const connectRequest = {config, seed};

    console.log(connectRequest);
    await connect(connectRequest, onBreezEvent);
  } catch (err) {
    console.error(err);
  }
}

function unit8ArrayConverter(unitArray) {
  return Array.from(
    unitArray.filter(num => Number.isInteger(num) && num >= 0 && num <= 255),
  );
}
