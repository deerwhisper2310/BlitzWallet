import {useIsFocused, useNavigation} from '@react-navigation/native';
import {
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {CENTER, COLORS, FONT, ICONS, SIZES} from '../../../../constants';
import {useGlobalContextProvider} from '../../../../../context-store/context';
import {useEffect, useState} from 'react';
import {atob} from 'react-native-quick-base64';
import {queryContacts} from '../../../../../db';
import {getPublicKey} from 'nostr-tools';
import {
  decryptMessage,
  encriptMessage,
} from '../../../../functions/messaging/encodingAndDecodingMessages';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ANDROIDSAFEAREA} from '../../../../constants/styles';

export default function AddContactPage({navigation}) {
  const navigate = useNavigation();
  const {theme, masterInfoObject, toggleMasterInfoObject, contactsPrivateKey} =
    useGlobalContextProvider();

  const insets = useSafeAreaInsets();

  const [contactsList, setContactsList] = useState([]);

  const [searchInput, setSearchInput] = useState('');

  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  function parseContact(data) {
    const decoded = atob(data);
    const parsedData = JSON.parse(decoded);

    const newContact = {
      name: parsedData.name || '',
      bio: parsedData.bio || '',
      uniqueName: parsedData.uniqueName,
      isFavorite: false,
      transactions: [],
      unlookedTransactions: 0,
      uuid: parsedData.uuid,
      receiveAddress: parsedData.receiveAddress,
      isAdded: true,
    };

    addContact(
      newContact,
      masterInfoObject,
      toggleMasterInfoObject,
      navigate,
      navigation,
      contactsPrivateKey,
    );
  }

  useEffect(() => {
    (async () => {
      let users = await queryContacts('blitzWalletUsers');

      users = users.map(doc => {
        return {
          name: doc['_document'].data.value.mapValue.fields.contacts.mapValue
            .fields.myProfile.mapValue.fields.name.stringValue,
          uuid: doc['_document'].data.value.mapValue.fields.contacts.mapValue
            .fields.myProfile.mapValue.fields.uuid.stringValue,
          uniqueName:
            doc['_document'].data.value.mapValue.fields.contacts.mapValue.fields
              .myProfile.mapValue.fields.uniqueName.stringValue,
          bio: doc['_document'].data.value.mapValue.fields.contacts.mapValue
            .fields.myProfile.mapValue.fields.bio.stringValue,
          receiveAddress:
            doc['_document'].data.value.mapValue.fields.contacts.mapValue.fields
              .myProfile.mapValue.fields.receiveAddress.stringValue,
        };
      });
      setContactsList(users);
      setIsLoadingContacts(false);
    })();
  }, []);

  const potentialContacts =
    contactsList.length != 0 &&
    contactsList.map((savedContact, id) => {
      if (!savedContact) {
        return false;
      }
      if (
        savedContact.uniqueName ===
        masterInfoObject.contacts.myProfile.uniqueName
      )
        return false;
      if (
        savedContact.name.toLowerCase().startsWith(searchInput.toLowerCase()) ||
        savedContact.uniqueName
          .toLowerCase()
          .startsWith(searchInput.toLowerCase())
      ) {
        return (
          <ContactListItem
            key={savedContact.uniqueName}
            navigation={navigation}
            id={id}
            savedContact={savedContact}
            contactsPrivateKey={contactsPrivateKey}
          />
        );
      } else return false;
    });

  return (
    <View
      style={[
        styles.globalContainer,
        {
          backgroundColor: theme
            ? COLORS.darkModeBackground
            : COLORS.lightModeBackground,
        },
      ]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={{flex: 1}}>
          {/* <SafeAreaView style={{flex: 1}}> */}
          <View
            style={{
              flex: 1,
              paddingTop: insets.top === 0 ? ANDROIDSAFEAREA : insets.top,
              // paddingBottom:
              //   insets.bottom === 0 ? ANDROIDSAFEAREA : insets.bottom,
            }}>
            <View style={styles.topBar}>
              <Text
                style={[
                  styles.topBarText,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                  },
                ]}>
                New Contact
              </Text>
              <TouchableOpacity
                onPress={() => {
                  navigation.openDrawer();
                }}>
                <Image style={styles.drawerIcon} source={ICONS.drawerList} />
              </TouchableOpacity>
            </View>

            <View style={{flex: 1}}>
              <TextInput
                onChangeText={setSearchInput}
                value={searchInput}
                placeholder="Username"
                placeholderTextColor={
                  theme ? COLORS.darkModeText : COLORS.lightModeText
                }
                style={[
                  styles.textInput,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                  },
                ]}
              />
              {isLoadingContacts ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ActivityIndicator
                    size="large"
                    color={theme ? COLORS.darkModeText : COLORS.lightModeText}
                  />
                  <Text
                    style={[
                      styles.gettingContacts,
                      {
                        color: theme
                          ? COLORS.darkModeText
                          : COLORS.lightModeText,
                      },
                    ]}>
                    Getting all contacts
                  </Text>
                </View>
              ) : (
                <View style={{flex: 1}}>
                  <ScrollView>{potentialContacts}</ScrollView>
                </View>
              )}
            </View>

            <View style={styles.scanProfileContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigate.navigate('CameraModal', {
                    updateBitcoinAdressFunc: parseContact,
                  });
                }}
                style={[
                  styles.scanProfileButton,
                  {
                    backgroundColor: theme
                      ? COLORS.darkModeText
                      : COLORS.lightModeText,
                  },
                ]}>
                <Image
                  style={styles.scanProfileImage}
                  source={theme ? ICONS.scanQrCodeDark : ICONS.scanQrCodeLight}
                />
              </TouchableOpacity>
              <Text
                style={[
                  styles.scanProfileText,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                  },
                ]}>
                Scan Profile
              </Text>
            </View>
          </View>
          {/* </SafeAreaView> */}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

function ContactListItem(props) {
  const {theme, masterInfoObject, toggleMasterInfoObject} =
    useGlobalContextProvider();
  const navigate = useNavigation();
  const newContact = {
    ...props.savedContact,
    isFavorite: false,
    transactions: [],
    unlookedTransactions: 0,
    isAdded: true,
  };

  return (
    <TouchableOpacity
      key={props.savedContact.uniqueName}
      onPress={() =>
        navigate.navigate('ConfirmAddContact', {
          addContact: () =>
            addContact(
              newContact,
              masterInfoObject,
              toggleMasterInfoObject,
              navigate,
              props.navigation,
              props.contactsPrivateKey,
            ),
        })
      }>
      <View style={[styles.contactListContainer, {}]}>
        <View
          style={[
            styles.contactListLetterImage,
            {
              borderColor: theme ? COLORS.darkModeText : COLORS.lightModeText,
              backgroundColor: theme
                ? COLORS.darkModeBackgroundOffset
                : COLORS.lightModeBackgroundOffset,
            },
          ]}>
          <Text
            style={[
              styles.contactListName,
              {
                color: theme ? COLORS.darkModeText : COLORS.lightModeText,
              },
            ]}>
            {newContact.uniqueName[0]}
          </Text>
        </View>
        <View>
          <Text
            style={[
              styles.contactListName,
              {
                color: theme ? COLORS.darkModeText : COLORS.lightModeText,
              },
            ]}>
            {newContact.uniqueName}
          </Text>
          <Text
            style={[
              styles.contactListName,
              {
                color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                fontSize: SIZES.small,
              },
            ]}>
            {newContact.name || 'No name set'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function addContact(
  newContact,
  masterInfoObject,
  toggleMasterInfoObject,
  navigate,
  navigation,
  contactsPrivateKey,
) {
  try {
    const publicKey = getPublicKey(contactsPrivateKey);
    let savedContacts =
      typeof masterInfoObject.contacts.addedContacts === 'string'
        ? [
            ...JSON.parse(
              decryptMessage(
                contactsPrivateKey,
                publicKey,
                masterInfoObject.contacts.addedContacts,
              ),
            ),
          ]
        : [];

    if (masterInfoObject.contacts.myProfile.uuid === newContact.uuid) {
      navigate.navigate('ErrorScreen', {
        errorMessage: 'Cannot add yourself',
      });
      return;
    } else if (
      savedContacts.filter(
        savedContact =>
          savedContact.uuid === newContact.uuid ||
          newContact.uuid === masterInfoObject.contacts.myProfile.uuid,
      ).length > 0
    ) {
      navigate.navigate('ErrorScreen', {
        errorMessage: 'Contact already added',
      });
      return;
    }

    savedContacts.push(newContact);

    toggleMasterInfoObject({
      contacts: {
        myProfile: {
          ...masterInfoObject.contacts.myProfile,
        },
        addedContacts: encriptMessage(
          contactsPrivateKey,
          publicKey,
          JSON.stringify(savedContacts),
        ),
        // unaddedContacts:
        //   typeof masterInfoObject.contacts.unaddedContacts === 'string'
        //     ? masterInfoObject.contacts.unaddedContacts
        //     : [],
      },
    });

    navigate.navigate('ErrorScreen', {
      errorMessage: 'Contact saved',
      navigationFunction: {
        navigator: navigation.jumpTo,
        destination: 'Contacts Page',
      },
    });
  } catch (err) {
    console.log(err);

    navigate.navigate('ErrorScreen', {errorMessage: 'Error adding contact'});
  }
}

const styles = StyleSheet.create({
  globalContainer: {
    flex: 1,
  },
  topBar: {
    width: '95%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
    ...CENTER,
  },
  drawerIcon: {
    width: 20,
    height: 20,
  },
  topBarText: {
    fontFamily: FONT.Title_Regular,
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },

  gettingContacts: {
    fontSize: SIZES.medium,
    fontFamily: FONT.Title_Regular,
    marginTop: 10,
  },

  textInput: {
    width: '95%',
    padding: 10,
    ...CENTER,
    fontSize: SIZES.medium,
    fontFamily: FONT.Title_Regular,
    borderWidth: 1,
    borderRadius: 50,
    borderColor: COLORS.primary,
  },

  scanProfileContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 10,
  },
  scanProfileButton: {borderRadius: 8, overflow: 'hidden', marginBottom: 5},
  scanProfileImage: {
    width: 20,
    height: 20,
    margin: 12,
  },
  scanProfileText: {fontFamily: FONT.Title_Regular, fontSize: SIZES.small},

  contactListContainer: {
    width: '95%',
    ...CENTER,
    padding: 10,

    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactListLetterImage: {
    height: 30,
    width: 30,
    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,

    marginRight: 10,
  },

  contactListName: {fontFamily: FONT.Title_Regular, fontSize: SIZES.medium},
});
