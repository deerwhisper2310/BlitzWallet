import {createContext, useState, useContext, useEffect} from 'react';
import {
  getLocalStorageItem,
  retrieveData,
  setLocalStorageItem,
} from '../app/functions';

import {setStatusBarStyle} from 'expo-status-bar';
import {useTranslation} from 'react-i18next';
import {usesLocalStorage} from '../app/functions/localStorage';
import {
  addDataToCollection,
  getDataFromCollection,
  getUserAuth,
  handleDataStorageSwitch,
} from '../db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {generateRandomContact} from '../app/functions/contacts';
import {generatePubPrivKeyForMessaging} from '../app/functions/messaging/generateKeys';
import * as Device from 'expo-device';
import axios from 'axios';

import {
  decryptMessage,
  encriptMessage,
} from '../app/functions/messaging/encodingAndDecodingMessages';

import * as nostr from 'nostr-tools';

// Initiate context
const GlobalContextManger = createContext();

const GlobalContextProvider = ({children}) => {
  // Manage theme state

  const [theme, setTheme] = useState(null);

  const [nodeInformation, setNodeInformation] = useState({
    didConnectToNode: null,
    transactions: [],
    userBalance: 0,
    inboundLiquidityMsat: 0,
    blockHeight: 0,
    onChainBalance: 0,
    fiatStats: {},
  });
  const [liquidNodeInformation, setLiquidNodeInformation] = useState({
    transactions: [],
    userBalance: 0,
  });
  const [breezContextEvent, setBreezContextEvent] = useState({});
  const [contactsPrivateKey, setContactsPrivateKey] = useState('');

  const [JWT, setJWT] = useState('');

  const [masterInfoObject, setMasterInfoObject] = useState({});
  const {i18n} = useTranslation();

  async function toggleTheme(peram) {
    const mode = peram ? 'light' : 'dark';
    setStatusBarStyle(mode);

    toggleMasterInfoObject({colorScheme: mode});

    setTheme(peram);
  }
  function toggleNodeInformation(newInfo) {
    setNodeInformation(prev => {
      return {...prev, ...newInfo};
    });
  }

  function toggleLiquidNodeInformation(newInfo) {
    setLiquidNodeInformation(prev => {
      return {...prev, ...newInfo};
    });
  }
  function toggleBreezContextEvent(breezEvent) {
    setBreezContextEvent({...breezEvent});
  }

  async function toggleMasterInfoObject(newData, globalDataStorageSwitch) {
    if (newData.userSelectedLanguage) {
      i18n.changeLanguage(newData.userSelectedLanguage);
    }

    const isUsingLocalStorage =
      globalDataStorageSwitch !== undefined
        ? globalDataStorageSwitch
        : (await usesLocalStorage()).data;

    console.log(newData, 'NEW DOCUMENT DATTA');

    setMasterInfoObject(prev => {
      const newObject = {...prev, ...newData};

      if (isUsingLocalStorage)
        setLocalStorageItem(
          'blitzWalletLocalStorage',
          JSON.stringify(newObject),
        );
      else addDataToCollection(newObject, 'blitzWalletUsers');

      return newObject;
    });
  }

  useEffect(() => {
    (async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        let tempObject = {};
        const mnemonic = (await retrieveData('mnemonic'))
          .split(' ')
          .filter(word => word.length > 0)
          .join(' ');

        const privateKey = nostr.nip06.privateKeyFromSeedWords(mnemonic);

        let blitzStoredData =
          (await getDataFromCollection('blitzWalletUsers')) || {};
        let blitzWalletLocalStorage =
          JSON.parse(await getLocalStorageItem('blitzWalletLocalStorage')) ||
          {};

        const {data} = await axios.post(process.env.CREATE_JWT_URL, {
          id: Device.osBuildId,
        });

        setContactsPrivateKey(privateKey);

        setJWT(data.token);

        const contacts = blitzWalletLocalStorage.contacts ||
          blitzStoredData.contacts || {
            myProfile: {
              ...generateRandomContact(),
              bio: '',
              name: '',
              uuid: await generatePubPrivKeyForMessaging(),
            },
            addedContacts: [],
            // unaddedContacts: [],
          };

        const storedTheme =
          blitzWalletLocalStorage.colorScheme ||
          blitzStoredData.colorScheme ||
          'dark';
        const storedUserTxPereferance =
          blitzWalletLocalStorage.homepageTxPreferace ||
          blitzStoredData.homepageTxPreferace ||
          15;
        const userBalanceDenomination =
          blitzWalletLocalStorage.userBalanceDenominatoin ||
          blitzStoredData.userBalanceDenominatoin ||
          'sats';
        const selectedLanguage =
          blitzWalletLocalStorage.userSelectedLanguage ||
          blitzStoredData.userSelectedLanguage ||
          'en';

        const currencyList =
          blitzWalletLocalStorage.currenciesList ||
          blitzStoredData.currenciesList ||
          [];

        const currency =
          blitzWalletLocalStorage.currency || blitzStoredData.currency || 'USD';

        const userFaceIDPereferance =
          blitzWalletLocalStorage.userFaceIDPereferance ||
          blitzStoredData.userFaceIDPereferance ||
          false;

        const liquidSwaps =
          blitzWalletLocalStorage.liquidSwaps ||
          blitzStoredData.liquidSwaps ||
          [];

        const failedTransactions =
          blitzWalletLocalStorage.failedTransactions ||
          blitzStoredData.failedTransactions ||
          [];

        const chatGPT = blitzWalletLocalStorage.chatGPT ||
          blitzStoredData.chatGPT || {conversation: [], credits: 0};

        const liquidWalletSettings =
          blitzWalletLocalStorage.liquidWalletSettings ||
            blitzStoredData.liquidWalletSettings || {
              autoChannelRebalance: true,
              autoChannelRebalancePercantage: 50,
              regulateChannelOpen: true,
              regulatedChannelOpenSize: 100000, //sats
            };

        const isUsingLocalStorage = await usesLocalStorage();

        if (storedTheme === 'dark') {
          setTheme(false);
          tempObject['colorScheme'] = 'dark';
          setStatusBarStyle('dark');
        } else {
          setTheme(true);
          tempObject['colorScheme'] = 'light';
          setStatusBarStyle('light');
        }

        tempObject['homepageTxPreferance'] = storedUserTxPereferance;
        tempObject['userBalanceDenomination'] = userBalanceDenomination;
        tempObject['userSelectedLanguage'] = selectedLanguage;
        tempObject['usesLocalStorage'] = isUsingLocalStorage.data;
        tempObject['currenciesList'] = currencyList;
        tempObject['currency'] = currency;
        tempObject['userFaceIDPereferance'] = userFaceIDPereferance;
        tempObject['liquidSwaps'] = liquidSwaps;
        tempObject['failedTransactions'] = failedTransactions;
        tempObject['chatGPT'] = chatGPT;
        tempObject['contacts'] = contacts;
        tempObject['uuid'] = await getUserAuth();
        tempObject['liquidWalletSettings'] = liquidWalletSettings;

        if (keys?.length > 3) {
          handleDataStorageSwitch(true, toggleMasterInfoObject);
        }

        // if no account exists add account to database otherwise just save information in global state
        Object.keys(blitzStoredData).length === 0 &&
        Object.keys(blitzWalletLocalStorage).length === 0
          ? toggleMasterInfoObject(tempObject)
          : setMasterInfoObject(tempObject);
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  if (theme === null || masterInfoObject.homepageTxPreferance === null) return;

  return (
    <GlobalContextManger.Provider
      value={{
        theme,
        toggleTheme,
        nodeInformation,
        toggleNodeInformation,
        breezContextEvent,
        toggleBreezContextEvent,
        toggleMasterInfoObject,
        masterInfoObject,
        contactsPrivateKey,
        JWT,
        liquidNodeInformation,
        toggleLiquidNodeInformation,
      }}>
      {children}
    </GlobalContextManger.Provider>
  );
};

function useGlobalContextProvider() {
  const context = useContext(GlobalContextManger);
  if (!context) {
    throw new Error(
      'useGlobalContextProvider must be used within a GlobalContextProvider',
    );
  }
  return context;
}

export {GlobalContextManger, GlobalContextProvider, useGlobalContextProvider};

// Function to check if two objects are equal (shallow equality)
function shallowEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1 || {});
  const keys2 = Object.keys(obj2 || {});

  // Check if the number of keys is the same
  if (keys1.length !== keys2.length) {
    return false;
  }

  // Check if all keys and their values are equal
  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}
function isJSON(item) {
  try {
    return JSON.parse(item);
  } catch (err) {
    return item;
  }
}
// Function to check if two objects are equal (deep equality)
function deepEqual(obj1, obj2) {
  // Check shallow equality first
  if (!shallowEqual(obj1, obj2)) {
    return false;
  }

  // Check deep equality for nested objects and arrays
  for (let key in obj1) {
    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      if (!deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }
  }

  return true;
}
