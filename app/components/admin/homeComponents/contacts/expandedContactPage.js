import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  CENTER,
  COLORS,
  FONT,
  ICONS,
  SATSPERBITCOIN,
  SIZES,
} from '../../../../constants';
import {useNavigation} from '@react-navigation/native';
import {useGlobalContextProvider} from '../../../../../context-store/context';
import {formatBalanceAmount} from '../../../../functions';
import {useEffect, useRef, useState} from 'react';
import {
  InputTypeVariant,
  parseInput,
  withdrawLnurl,
} from '@breeztech/react-native-breez-sdk';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export default function ExpandedContactsPage(props) {
  const navigate = useNavigation();
  const insets = useSafeAreaInsets();
  const {theme, toggleNostrContacts, nodeInformation, masterInfoObject} =
    useGlobalContextProvider();
  const selectedNpub = props.route.params.npub;
  //   const [contactsList, setContactsList] = useState(props.route.params.contacts);
  const [selectedContact] = masterInfoObject.nostrContacts?.filter(
    contact => contact.npub === selectedNpub,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [transactionHistory, setTransactionHistory] = useState([]);

  console.log(selectedContact.npub);

  useEffect(() => {
    setIsLoading(true);

    let storedTransactions = selectedContact?.transactions || [];

    if (selectedContact.unlookedTransactions.length != 0) {
      const unlookedStoredTransactions =
        selectedContact.unlookedTransactions || [];
      storedTransactions = [
        ...new Set([...storedTransactions, ...unlookedStoredTransactions]),
      ];
      toggleNostrContacts(
        {
          transactions: storedTransactions,
          unlookedTransactions: [],
        },
        null,
        selectedContact,
      );
    }

    const formattedTx =
      storedTransactions.length === 0
        ? []
        : storedTransactions
            .filter(tx => tx)
            .sort((a, b) => {
              if (a?.time && b?.time) {
                return b.time - a.time;
              }
              // If time property is missing, retain the original order
              return 0;
            })
            .map((transaction, id) => {
              return (
                <TransactionItem
                  key={id}
                  nodeInformation={nodeInformation}
                  userBalanceDenomination={
                    masterInfoObject.userBalanceDenomination
                  }
                  theme={theme}
                  transaction={transaction}
                  id={id}
                  selectedContact={selectedContact}
                  toggleNostrContacts={toggleNostrContacts}
                />
              );
            });

    setTransactionHistory(formattedTx);

    setIsLoading(false);
  }, [masterInfoObject.nostrContacts]);

  const themeBackground = theme
    ? COLORS.darkModeBackground
    : COLORS.lightModeBackground;
  const themeText = theme ? COLORS.darkModeText : COLORS.lightModeText;
  const themeBackgroundOffset = theme
    ? COLORS.darkModeBackgroundOffset
    : COLORS.lightModeBackgroundOffset;

  return (
    <View
      style={[
        styles.globalContainer,
        {
          backgroundColor: themeBackground,
          paddingTop: insets.top,
        },
      ]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            navigate.goBack();
          }}>
          <Image
            style={{
              width: 30,
              height: 30,
              transform: [{translateX: -7}],
            }}
            source={ICONS.smallArrowLeft}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            (async () => {
              const didSet = await toggleNostrContacts(
                {isFavorite: !selectedContact.isFavorite},
                null,
                selectedContact,
              );
            })();
          }}>
          <Image
            style={styles.backButton}
            source={
              selectedContact.isFavorite
                ? ICONS.starBlue
                : theme
                ? ICONS.starWhite
                : ICONS.starBlack
            }
          />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.profileImage,
          {
            borderColor: themeBackgroundOffset,
            backgroundColor: themeText,
          },
        ]}>
        <Image
          source={
            selectedContact.profileImg
              ? selectedContact.profileImg
              : ICONS.userIcon
          }
          style={{width: '80%', height: '80%'}}
        />
      </View>
      <Text style={[styles.profileName, {color: themeText}]}>
        {selectedContact.name}
      </Text>

      <View style={styles.buttonGlobalContainer}>
        <TouchableOpacity
          onPress={() => {
            navigate.navigate('SendAndRequestPage', {
              selectedContact: selectedContact,
              paymentType: 'send',
            });
          }}
          style={[styles.buttonContainer, {backgroundColor: themeText}]}>
          <Text style={[styles.buttonText, {color: themeBackground}]}>
            Send
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonContainer, {backgroundColor: themeText}]}>
          <Text style={[styles.buttonText, {color: themeBackground}]}>
            Request
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator
            size="large"
            color={theme ? COLORS.darkModeText : COLORS.lightModeText}
          />
        </View>
      ) : transactionHistory.length != 0 ? (
        <View style={{flex: 1}}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{
              flex: 1,

              width: '80%',
              ...CENTER,
            }}>
            {transactionHistory}
          </ScrollView>
        </View>
      ) : (
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text style={[styles.buttonText, {color: themeText}]}>
            No Transactions
          </Text>
        </View>
      )}
    </View>
  );
}

function TransactionItem(props) {
  const endDate = new Date();
  const startDate = new Date(props.transaction.time * 1000);
  const paymentDate = new Date(props.transaction.time * 1000).toLocaleString();
  const timeDifferenceMs = endDate - startDate;
  const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
  const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);
  const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);

  const txParsed = isJSON(props.transaction.content)
    ? JSON.parse(props.transaction.content)
    : props.transaction.content;

  if (txParsed === undefined) return;

  const paymentDescription = !Object.keys(txParsed)?.includes('amountMsat')
    ? txParsed || 'Unknown'
    : txParsed.description || 'Unknown';

  const [parsedRequest, setParsedRequest] = useState(null);

  useEffect(() => {
    (async () => {
      if (txParsed.isRedeemed) {
        setParsedRequest(false);
        return;
      }
      const input = await parseInput(txParsed.url);

      setParsedRequest(input);
    })();
  }, []);

  if (parsedRequest === null && txParsed.isRedeemed) return;
  return (
    <TouchableOpacity
      key={props.id}
      activeOpacity={!txParsed.isRedeemed ? 1 : 0.5}
      onPress={() => {
        if (!txParsed.isRedeemed) return;
        // props.navigate.navigate('ExpandedTx', {
        //   txId: props.details.data.paymentHash,
        // });
      }}>
      {props.transaction.wasSent || txParsed.isDeclined !== undefined ? (
        <ConfirmedOrSentTransaction
          txParsed={txParsed}
          paymentDescription={paymentDescription}
          timeDifferenceMinutes={timeDifferenceMinutes}
          timeDifferenceHours={timeDifferenceHours}
          timeDifferenceDays={timeDifferenceDays}
          props={props}
        />
      ) : parsedRequest ? (
        <View style={styles.transactionContainer}>
          {/* <View style={{flex: 1}}> */}
          <Image
            source={ICONS.smallArrowLeft}
            style={[
              styles.icons,
              {
                transform: [
                  {
                    rotate: '310deg',
                  },
                ],
              },
            ]}
            resizeMode="contain"
          />
          {/* </View> */}

          <View style={{width: '100%', flex: 1}}>
            <Text
              style={{
                fontFamily: FONT.Title_Regular,
                fontSize: SIZES.medium,
                color: props.theme ? COLORS.darkModeText : COLORS.lightModeText,
              }}>
              {`${
                parsedRequest.type === InputTypeVariant.LN_URL_PAY
                  ? `${'Received'} request for`
                  : 'Accept'
              } ${
                Object.keys(txParsed).includes('amountMsat') &&
                formatBalanceAmount(
                  props.userBalanceDenomination === 'sats'
                    ? txParsed.amountMsat / 1000
                    : (
                        (txParsed.amountMsat / 1000) *
                        (props.nodeInformation.fiatStats.value / SATSPERBITCOIN)
                      ).toFixed(2),
                ) +
                  ` ${
                    props.userBalanceDenomination === 'hidden'
                      ? ''
                      : props.userBalanceDenomination === 'sats'
                      ? 'sats'
                      : props.nodeInformation.fiatStats.coin
                  }`
              }`}
            </Text>
            <Text
              style={[
                styles.dateText,
                {
                  color: props.theme
                    ? COLORS.darkModeText
                    : COLORS.lightModeText,
                },
              ]}>
              {timeDifferenceMinutes < 60
                ? timeDifferenceMinutes < 1
                  ? ''
                  : Math.round(timeDifferenceMinutes)
                : Math.round(timeDifferenceHours) < 24
                ? Math.round(timeDifferenceHours)
                : Math.round(timeDifferenceDays)}{' '}
              {`${
                Math.round(timeDifferenceMinutes) < 60
                  ? timeDifferenceMinutes < 1
                    ? 'Just now'
                    : Math.round(timeDifferenceMinutes) === 1
                    ? 'minute'
                    : 'minutes'
                  : Math.round(timeDifferenceHours) < 24
                  ? Math.round(timeDifferenceHours) === 1
                    ? 'hour'
                    : 'hours'
                  : Math.round(timeDifferenceDays) === 1
                  ? 'day'
                  : 'days'
              } ${timeDifferenceMinutes > 1 ? 'ago' : ''}`}
            </Text>
            <Text
              style={[
                styles.descriptionText,
                {
                  color: props.theme
                    ? COLORS.darkModeText
                    : COLORS.lightModeText,
                  marginBottom: 20,
                },
              ]}>
              {paymentDescription.length > 15
                ? paymentDescription.slice(0, 15) + '...'
                : paymentDescription}
            </Text>

            <TouchableOpacity
              onPress={() => {
                console.log(txParsed);
                if (parsedRequest.type === InputTypeVariant.LN_URL_PAY)
                  sendPayRequest();
                else acceptPayRequest(txParsed);
              }}
              style={[
                styles.acceptOrPayBTN,
                {
                  marginBottom: 10,
                  backgroundColor: COLORS.primary,
                },
              ]}>
              <Text style={{color: COLORS.darkModeText}}>
                {parsedRequest.type === InputTypeVariant.LN_URL_PAY
                  ? 'Send'
                  : 'Accept'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                declinePayment(txParsed);
              }}
              style={[
                styles.acceptOrPayBTN,
                {
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                },
              ]}>
              <Text style={{color: COLORS.primary}}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ActivityIndicator
          size={'large'}
          style={{marginBottom: 10}}
          color={props.theme ? COLORS.darkModeText : COLORS.lightModeText}
        />
      )}
    </TouchableOpacity>
  );

  function declinePayment(parsedTx) {
    const selectedPaymentId = parsedTx.id;
    const selectedUserTransactions = props.selectedContact.transactions;

    const updatedTransactions = selectedUserTransactions.map(tx => {
      const txParsed = isJSON(tx.content) ? JSON.parse(tx.content) : tx.content;

      if (txParsed?.id === selectedPaymentId) {
        return {content: {...txParsed, isDeclined: true}, time: tx.time};
      }
      return {content: {...txParsed}, time: tx.time};
    });

    props.toggleNostrContacts(
      {transactions: updatedTransactions},
      null,
      props.selectedContact,
    );
    console.log(updatedTransactions);
  }

  async function acceptPayRequest(parsedTx) {
    const selectedPaymentId = parsedTx.id;
    const selectedUserTransactions = props.selectedContact.transactions;

    try {
      const input = await parseInput(parsedTx.url);
      if (input.type === InputTypeVariant.LN_URL_WITHDRAW) {
        const response = await withdrawLnurl({
          data: input.data,
          amountMsat: input.data.minWithdrawable,
          description: input.data.defaultDescription,
        });

        if (response) console.log(response);
        else throw new Error('error');
      } else throw new Error('Not valid withdrawls LNURL');
    } catch (err) {
      console.log(err);
      navigate.navigate('ErrorScreen', {
        errorMessage: 'Error receiving payment',
      });
    } finally {
      const updatedTransactions = selectedUserTransactions.map(tx => {
        const txParsed = isJSON(tx.content)
          ? JSON.parse(tx.content)
          : tx.content;

        if (txParsed?.id === selectedPaymentId) {
          return {
            content: {...txParsed, isDeclined: false, isRedeemed: true},
            time: tx.time,
          };
        }
        return {content: {...txParsed}, time: tx.time};
      });

      props.toggleNostrContacts(
        {transactions: updatedTransactions},
        null,
        props.selectedContact,
      );
      console.log(updatedTransactions);
    }
  }
}

function ConfirmedOrSentTransaction({
  txParsed,
  paymentDescription,
  timeDifferenceMinutes,
  timeDifferenceHours,
  timeDifferenceDays,
  props,
}) {
  return (
    <View style={[styles.transactionContainer, {alignItems: 'center'}]}>
      <Image
        source={ICONS.smallArrowLeft}
        style={[
          styles.icons,
          {
            transform: [
              {
                rotate: '130deg',
              },
            ],
          },
        ]}
        resizeMode="contain"
      />

      <View>
        <Text
          style={[
            styles.descriptionText,
            {
              color: txParsed.isDeclined
                ? COLORS.cancelRed
                : props.theme
                ? COLORS.darkModeText
                : COLORS.lightModeText,
            },
          ]}>
          {paymentDescription.length > 15
            ? paymentDescription.slice(0, 15) + '...'
            : paymentDescription}
        </Text>
        <Text
          style={[
            styles.dateText,
            {
              color: txParsed.isDeclined
                ? COLORS.cancelRed
                : props.theme
                ? COLORS.darkModeText
                : COLORS.lightModeText,
            },
          ]}>
          {timeDifferenceMinutes < 60
            ? timeDifferenceMinutes < 1
              ? ''
              : Math.round(timeDifferenceMinutes)
            : Math.round(timeDifferenceHours) < 24
            ? Math.round(timeDifferenceHours)
            : Math.round(timeDifferenceDays)}{' '}
          {`${
            Math.round(timeDifferenceMinutes) < 60
              ? timeDifferenceMinutes < 1
                ? 'Just now'
                : Math.round(timeDifferenceMinutes) === 1
                ? 'minute'
                : 'minutes'
              : Math.round(timeDifferenceHours) < 24
              ? Math.round(timeDifferenceHours) === 1
                ? 'hour'
                : 'hours'
              : Math.round(timeDifferenceDays) === 1
              ? 'day'
              : 'days'
          } ${timeDifferenceMinutes > 1 ? 'ago' : ''}`}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: FONT.Title_Regular,
          fontSize: SIZES.medium,
          color: txParsed.isDeclined
            ? COLORS.cancelRed
            : props.theme
            ? COLORS.darkModeText
            : COLORS.lightModeText,
          marginLeft: 'auto',
        }}>
        {`-${
          Object.keys(txParsed).includes('amountMsat') &&
          formatBalanceAmount(
            props.userBalanceDenomination === 'sats'
              ? txParsed.amountMsat / 1000
              : (
                  (txParsed.amountMsat / 1000) *
                  (props.nodeInformation.fiatStats.value / SATSPERBITCOIN)
                ).toFixed(2),
          ) +
            ` ${
              props.userBalanceDenomination === 'hidden'
                ? ''
                : props.userBalanceDenomination === 'sats'
                ? 'sats'
                : props.nodeInformation.fiatStats.coin
            }`
        }`}
      </Text>
    </View>
  );
}

function isJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
const styles = StyleSheet.create({
  globalContainer: {
    flex: 1,
  },
  topBar: {
    width: '95%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
    // backgroundColor: 'black',
    ...CENTER,
  },
  backButton: {
    width: 20,
    height: 20,
  },

  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 125,
    borderWidth: 5,
    backgroundColor: 'red',
    ...CENTER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  profileName: {
    fontSize: SIZES.medium,
    fontFamily: FONT.Title_Regular,
    fontWeight: 'bold',
    ...CENTER,
  },
  buttonGlobalContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 25,
  },

  buttonContainer: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonText: {
    fontFamily: FONT.Title_Regular,
    fontSize: SIZES.medium,
  },

  gradient: {
    height: 100,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },

  transactionContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'start',
    marginVertical: 12.5,
  },
  icons: {
    width: 30,
    height: 30,
    marginRight: 15,
  },

  descriptionText: {
    fontSize: SIZES.medium,
    fontFamily: FONT.Descriptoin_Regular,
  },
  dateText: {
    fontFamily: FONT.Descriptoin_Regular,
    fontSize: SIZES.small,
  },
  amountText: {
    marginLeft: 'auto',
    fontFamily: FONT.Other_Regular,
    fontSize: SIZES.medium,
  },
  transactionTimeBanner: {
    width: '100%',
    alignItems: 'center',

    fontFamily: FONT.Title_Bold,
    fontSize: SIZES.medium,

    padding: 5,
    borderRadius: 2,
    overflow: 'hidden',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    width: '85%',
    alignItems: 'center',
  },
  noTransactionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTransactionsText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONT.Descriptoin_Regular,
  },

  mostRecentTxContainer: {
    width: 'auto',
    ...CENTER,
    alignItems: 'center',
  },

  acceptOrPayBTN: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 15,
    padding: 5,
    alignItems: 'center',
  },
});
