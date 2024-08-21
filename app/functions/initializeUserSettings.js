import AsyncStorage from '@react-native-async-storage/async-storage';
import {retrieveData} from './secureStore';
import * as nostr from 'nostr-tools';
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  usesLocalStorage,
} from './localStorage';
import {
  getDataFromCollection,
  getUserAuth,
  handleDataStorageSwitch,
} from '../../db';
import {generateRandomContact} from './contacts';
import {generatePubPrivKeyForMessaging} from './messaging/generateKeys';
import * as Device from 'expo-device';
import axios from 'axios';
import {getContactsImage} from './contacts/contactsFileSystem';
import {getCurrentDateFormatted} from './rotateAddressDateChecker';

export default async function initializeUserSettingsFromHistory({
  setContactsPrivateKey,
  setJWT,
  setContactsImages,
  toggleMasterInfoObject,
  setMasterInfoObject,
}) {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let tempObject = {};
    let mnemonic = await retrieveData('mnemonic');
    mnemonic &&
      mnemonic
        .split(' ')
        .filter(word => word.length > 0)
        .join(' ');

    const privateKey =
      mnemonic && nostr.nip06.privateKeyFromSeedWords(mnemonic);

    let blitzStoredData;
    let retrivedStoredBlitzData = await getDataFromCollection(
      'blitzWalletUsers',
    );

    if (retrivedStoredBlitzData === null) throw Error('Failed to retrive');
    else if (retrivedStoredBlitzData) blitzStoredData = retrivedStoredBlitzData;
    else blitzStoredData = {};

    let blitzWalletLocalStorage =
      JSON.parse(await getLocalStorageItem('blitzWalletLocalStorage')) || {};
    const {data} = await axios.post(process.env.CREATE_JWT_URL, {
      id: Device.osBuildId,
    });
    setContactsPrivateKey(privateKey);
    setJWT(data.token);
    const generatedUniqueName = generateRandomContact();
    setContactsImages((await getContactsImage()) || []);
    const contacts = blitzWalletLocalStorage.contacts ||
      blitzStoredData.contacts || {
        myProfile: {
          uniqueName: generatedUniqueName.uniqueName,
          uniqueNameLower: generatedUniqueName.uniqueName.toLocaleLowerCase(),
          bio: '',
          name: '',
          uuid: await generatePubPrivKeyForMessaging(),
          lastRotated: new Date(),
        },
        addedContacts: [],
      };

    const storedUserTxPereferance =
      JSON.parse(await getLocalStorageItem('homepageTxPreferance')) || 25;

    const userBalanceDenomination =
      JSON.parse(await getLocalStorageItem('userBalanceDenomination')) ||
      'sats';

    const enabledSlidingCamera =
      JSON.parse(await getLocalStorageItem('enabledSlidingCamera')) || false;

    const userFaceIDPereferance =
      JSON.parse(await getLocalStorageItem('userFaceIDPereferance')) || false;

    const fiatCurrenciesList =
      JSON.parse(await getLocalStorageItem('fiatCurrenciesList')) || [];
    const fiatCurrency =
      JSON.parse(await getLocalStorageItem('fiatCurrency')) || 'USD';

    const failedTransactions =
      JSON.parse(await getLocalStorageItem('failedTransactions')) || [];

    const satDisplay =
      JSON.parse(await getLocalStorageItem('satDisplay')) || 'word';
    const enabledEcash =
      JSON.parse(await getLocalStorageItem('enabledEcash')) || false;

    const selectedLanguage =
      blitzWalletLocalStorage.userSelectedLanguage ||
      blitzStoredData.userSelectedLanguage ||
      'en';

    const liquidSwaps =
      blitzWalletLocalStorage.liquidSwaps || blitzStoredData.liquidSwaps || [];

    const chatGPT = blitzWalletLocalStorage.chatGPT ||
      blitzStoredData.chatGPT || {conversation: [], credits: 0};
    const liquidWalletSettings = blitzWalletLocalStorage.liquidWalletSettings ||
      blitzStoredData.liquidWalletSettings || {
        autoChannelRebalance: true,
        autoChannelRebalancePercantage: 90,
        regulateChannelOpen: true,
        regulatedChannelOpenSize: 1000000, //sats
        maxChannelOpenFee: 5000, //sats
      };
    const eCashProofs =
      blitzWalletLocalStorage.eCashProofs || blitzStoredData.eCashProofs || [];

    const posSettings = blitzWalletLocalStorage.posSettings ||
      blitzStoredData.posSettings || {
        storeName: contacts.myProfile.uniqueName,
        storeNameLower: contacts.myProfile.uniqueName.toLowerCase(),
        storeCurrency: fiatCurrency,
        lastRotated: new Date(),
      };

    //added here for legecy people
    liquidWalletSettings.regulatedChannelOpenSize =
      liquidWalletSettings.regulatedChannelOpenSize < 1000000
        ? 1000000
        : liquidWalletSettings.regulatedChannelOpenSize;

    if (!contacts.myProfile?.uniqueNameLower) {
      contacts.myProfile.uniqueNameLower =
        contacts.myProfile.uniqueName.toLocaleLowerCase();
    }
    if (!contacts.myProfile.lastRotated)
      contacts.myProfile.lastRotated = getCurrentDateFormatted();
    if (!posSettings.lastRotated)
      posSettings.lastRotated = getCurrentDateFormatted();

    const isUsingLocalStorage = await usesLocalStorage();
    tempObject['homepageTxPreferance'] = storedUserTxPereferance;
    tempObject['userBalanceDenomination'] = userBalanceDenomination;
    tempObject['userSelectedLanguage'] = selectedLanguage;
    tempObject['usesLocalStorage'] = isUsingLocalStorage.data;
    tempObject['fiatCurrenciesList'] = fiatCurrenciesList;
    tempObject['fiatCurrency'] = fiatCurrency;
    tempObject['userFaceIDPereferance'] = userFaceIDPereferance;
    tempObject['liquidSwaps'] = liquidSwaps;
    tempObject['failedTransactions'] = failedTransactions;
    tempObject['chatGPT'] = chatGPT;
    tempObject['contacts'] = contacts;
    tempObject['satDisplay'] = satDisplay;
    tempObject['uuid'] = await getUserAuth();
    tempObject['liquidWalletSettings'] = liquidWalletSettings;
    tempObject['enabledSlidingCamera'] = enabledSlidingCamera;
    tempObject['enabledEcash'] = enabledEcash;
    tempObject['eCashProofs'] = eCashProofs;
    tempObject['posSettings'] = posSettings;

    if (!retrivedStoredBlitzData && !(await usesLocalStorage()).data) {
      handleDataStorageSwitch(true, toggleMasterInfoObject);
    }

    // if no account exists add account to database otherwise just save information in global state
    Object.keys(blitzStoredData).length === 0 &&
    Object.keys(blitzWalletLocalStorage).length === 0
      ? toggleMasterInfoObject(tempObject)
      : setMasterInfoObject(tempObject);

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
