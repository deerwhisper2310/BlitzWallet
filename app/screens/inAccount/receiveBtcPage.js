import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';

import {
  CENTER,
  FONT,
  COLORS,
  SIZES,
  ICONS,
  SHADOWS,
  SATSPERBITCOIN,
} from '../../constants';
import {useEffect, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';

import {
  copyToClipboard,
  formatBalanceAmount,
  getLocalStorageItem,
  numberConverter,
} from '../../functions';
import {useGlobalContextProvider} from '../../../context-store/context';
import QRCode from 'react-native-qrcode-svg';

import {
  generateBitcoinAddress,
  generateLightningAddress,
  generateLiquidAddress,
  generateUnifiedAddress,
} from '../../functions/receiveBitcoin/addressGeneration';
import {ButtonsContainer} from '../../components/admin/homeComponents/receiveBitcoin';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ANDROIDSAFEAREA, backArrow} from '../../constants/styles';

import {getBoltzWsUrl} from '../../functions/boltz/boltzEndpoitns';

import handleReverseClaimWSS from '../../functions/boltz/handle-reverse-claim-wss';

import {calculateBoltzFee} from '../../functions/boltz/calculateBoltzFee';
import {useWebView} from '../../../context-store/webViewContext';
import {getSideSwapApiUrl} from '../../functions/sideSwap/sideSwapEndpoitns';
import {GlobalThemeView, ThemeText} from '../../functions/CustomElements';
import {WINDOWWIDTH} from '../../constants/theme';
import handleBackPress from '../../hooks/handleBackPress';

export function ReceivePaymentHome(props) {
  const navigate = useNavigation();
  const {
    theme,
    nodeInformation,
    masterInfoObject,
    toggleMasterInfoObject,
    contactsPrivateKey,
    minMaxLiquidSwapAmounts,
  } = useGlobalContextProvider();
  const {webViewRef, setWebViewArgs, webViewArgs} = useWebView();
  const initialSendAmount = props.route.params?.receiveAmount;
  // const webViewRef = useRef(null);
  function handleBackPressFunction() {
    navigate.goBack();
    return true;
  }
  useEffect(() => {
    handleBackPress(handleBackPressFunction);
  }, []);

  console.log(initialSendAmount);
  const dollarSatValue = Math.round(
    SATSPERBITCOIN / nodeInformation.fiatStats?.value || 980555,
  );

  const sendingAmount = initialSendAmount; //sats

  // const [sendingAmount, setSendingAmount] = useState(
  //   initialSendAmount,
  //   // ? initialSendAmount
  //   // : nodeInformation.userBalance === 0
  //   // ? masterInfoObject.userBalanceDenomination === 'fiat'
  //   //   ? dollarSatValue > 1500
  //   //     ? 1
  //   //     : Math.round(1500 / dollarSatValue)
  //   //   : 1500
  //   // : 1,
  // );
  const [generatingInvoiceQRCode, setGeneratingInvoiceQRCode] = useState(true);

  const [generatedAddress, setGeneratedAddress] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [selectedRecieveOption, setSelectedRecieveOption] =
    useState('lightning');

  const [isReceivingSwap, setIsReceivingSwap] = useState(false);

  const [minMaxSwapAmount, setMinMaxSwapAmount] = useState({
    min: 0,
    max: 0,
  });

  const sideSwapWebSocketRef = useRef(null);

  const [inProgressSwapInfo, setInProgressSwapInfo] = useState({});
  const [errorMessageText, setErrorMessageText] = useState({
    type: null,
    text: '',
  });
  const [prevSelectedReceiveOption, setPrevSelectedReceiveOption] =
    useState('');
  const [bitcoinConfirmations, setBitcoinConfirmations] = useState('');

  useEffect(() => {
    let clearPreviousRequest = false;
    const fetchAddress = async () => {
      if (prevSelectedReceiveOption != selectedRecieveOption) {
        console.log('IS RUNNING');
        setErrorMessageText('');
        setIsReceivingSwap(false);
        setInProgressSwapInfo({});
        setMinMaxSwapAmount({
          min: 0,
          max: 0,
        });
        setGeneratedAddress('');
      } else {
        setErrorMessageText('');
      }
      setPrevSelectedReceiveOption(selectedRecieveOption);

      console.log(selectedRecieveOption, 'TESTING IN FUNCTION');

      const response =
        selectedRecieveOption.toLowerCase() === 'lightning'
          ? await generateLightningAddress({
              nodeInformation,
              userBalanceDenomination: masterInfoObject.userBalanceDenomination,
              amount: sendingAmount,
              description: paymentDescription,
              isGeneratingAddressFunc: setGeneratingInvoiceQRCode,
              masterInfoObject,
              setSendingAmount: null,
              minMasSwapAmounts: minMaxLiquidSwapAmounts,
            })
          : selectedRecieveOption.toLowerCase() === 'bitcoin'
          ? await generateBitcoinAddress({
              nodeInformation,
              userBalanceDenomination: masterInfoObject.userBalanceDenomination,
              amount: sendingAmount,
              description: paymentDescription,
              isGeneratingAddressFunc: setGeneratingInvoiceQRCode,
            })
          : selectedRecieveOption.toLowerCase() === 'liquid'
          ? await generateLiquidAddress({
              nodeInformation,
              userBalanceDenomination: masterInfoObject.userBalanceDenomination,
              amount: sendingAmount,
              paymentDescription,
              isGeneratingAddressFunc: setGeneratingInvoiceQRCode,
              setSendingAmount: null,
              masterInfoObject,
            })
          : await generateUnifiedAddress({
              nodeInformation,
              userBalanceDenomination: masterInfoObject.userBalanceDenomination,
              amount: sendingAmount,
              description: paymentDescription,
              isGeneratingAddressFunc: setGeneratingInvoiceQRCode,
            });

      if (clearPreviousRequest || !response) {
        setErrorMessageText('');
        setIsReceivingSwap(false);
        setInProgressSwapInfo({});
        setMinMaxSwapAmount({
          min: 0,
          max: 0,
        });
        setGeneratedAddress('');
        return;
      }
      if (response.errorMessage.type === 'stop') {
        setErrorMessageText(response.errorMessage);
        return;
      } else if (response.errorMessage.type === 'warning') {
        if (
          response.errorMessage.text.includes('bank') &&
          selectedRecieveOption != 'liquid'
        ) {
          const [boltzFees, _] = await calculateBoltzFee(
            sendingAmount,
            'ln-liquid',
          );

          const txSize = (148 + 3 * 34 + 10.5) / 100;

          setErrorMessageText({
            type: 'warning',
            text: `${
              response.errorMessage.text
            }, swap fee of ${formatBalanceAmount(
              numberConverter(
                (txSize * process.env.BOLTZ_ENVIRONMENT === 'liquid'
                  ? 0.01
                  : 0.11) + boltzFees,
                masterInfoObject.userBalanceDenomination,
                nodeInformation,
                masterInfoObject.userBalanceDenomination != 'fiat' ? 0 : 2,
              ),
            )} ${
              masterInfoObject.userBalanceDenomination != 'fiat'
                ? 'sats'
                : nodeInformation.fiatStats.coin
            }`,
          });
        } else setErrorMessageText(response.errorMessage);
      }

      if (response?.swapInfo) {
        if (response.swapInfo.minMax)
          setMinMaxSwapAmount(response.swapInfo.minMax);
        if (response.swapInfo.pairSwapInfo)
          setInProgressSwapInfo(response.swapInfo.pairSwapInfo);
      }

      if (!response.errorMessage.text.includes('bank')) {
        console.log('RUNNING IN FUNCTION');
        setGeneratedAddress(response.receiveAddress);
      }

      if (selectedRecieveOption === 'Bitcoin') {
        sideSwapWebSocketRef.current = new WebSocket(
          `${getSideSwapApiUrl(process.env.BOLTZ_ENVIRONMENT)}`,
        );

        sideSwapWebSocketRef.current.onopen = () => {
          console.log('did un websocket open');
          if (sideSwapWebSocketRef.current.readyState != WebSocket.OPEN) return;

          sideSwapWebSocketRef.current.send(
            JSON.stringify({
              id: 1,
              method: 'login_client',
              params: {
                api_key: process.env.SIDESWAP_REWARDS_KEY,
                cookie: null,
                user_agent: 'BlitzWallet',
                version: '1.2.3',
              },
            }),
          );

          sideSwapWebSocketRef.current.send(
            JSON.stringify({
              id: 1,
              method: 'peg_status',
              params: {
                peg_in: true,
                order_id: response.swapPegInfo.order_id,
              },
            }),
          );
          sideSwapWebSocketRef.current.send(
            JSON.stringify({
              id: 1,
              method: 'server_status',
              params: null,
            }),
          );
        };

        sideSwapWebSocketRef.current.onmessage = rawMsg => {
          const msg = JSON.parse(rawMsg.data);
          console.log(msg);

          if (msg.method === 'server_status') {
            setMinMaxSwapAmount({
              min:
                msg.result?.min_peg_in_amount || msg.params.min_peg_in_amount,
              max: 0,
            });
          } else if (msg.method === 'peg_status') {
            const swapList = msg.result?.list || msg.params.list;

            if (swapList.length > 0) {
              setBitcoinConfirmations(swapList[0].status);
              const isConfirming = swapList.filter(
                item => item.tx_state_code === 3 || item.tx_state_code === 2,
              );
              if (isConfirming.length > 0) {
                console.log(isConfirming);
                setInProgressSwapInfo(isConfirming[0]);
                setIsReceivingSwap(true);
              } else if (
                (swapList.filter(item => item.tx_state_code === 4).length = 1)
              ) {
                navigate.navigate('HomeAdmin');
                navigate.navigate('ConfirmTxPage', {
                  for: 'paymentSuceed',
                  information: {},
                });
              }
            }
          }
        };

        return;
      }

      if (selectedRecieveOption === 'Bitcoin' || !response.data) return;
      if (selectedRecieveOption === 'liquid' && !response.data) return;
      if (
        selectedRecieveOption === 'lightning' &&
        !response.data.liquidAddress &&
        !response.data.initSwapInfo &&
        !response.data.preimage &&
        !response.data.keys?.privateKey?.toString('hex')
      )
        return;

      const webSocket = new WebSocket(
        `${getBoltzWsUrl(process.env.BOLTZ_ENVIRONMENT)}`,
      );
      console.log('CRETE WSS CONNECTION');
      webViewArgs.page != 'receivePage' &&
        setWebViewArgs({navigate: navigate, page: 'receivePage'});
      // webViewRef.current.injectJavaScript('alert("Hello from HomeScreen");');

      const didHandle = await handleReverseClaimWSS({
        ref: webViewRef,
        webSocket,
        liquidAddress: response.data.liquidAddress,
        swapInfo: response.data.initSwapInfo,
        preimage: response.data.preimage,
        privateKey: response.data.keys.privateKey.toString('hex'),
        isReceivingSwapFunc: setIsReceivingSwap,
        navigate,
      });

      console.log(didHandle, 'DID CERAET WSS CONNECTION');
      didHandle && setGeneratedAddress(response.receiveAddress);
    };
    fetchAddress();
    return () => {
      clearPreviousRequest = true;
      if (sideSwapWebSocketRef.current) {
        sideSwapWebSocketRef.current.close();
      }
      console.log('TESTING');
      // clearInterval(lookForBTCSwap);
    };
  }, [sendingAmount, paymentDescription, selectedRecieveOption]);

  return (
    <GlobalThemeView>
      <View
        style={{flex: 1, alignItems: 'center', width: WINDOWWIDTH, ...CENTER}}>
        <TouchableOpacity
          style={{marginRight: 'auto'}}
          activeOpacity={0.6}
          onPress={clear}>
          <Image
            source={ICONS.smallArrowLeft}
            style={[backArrow]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            {
              color: theme ? COLORS.darkModeText : COLORS.lightModeText,
            },
          ]}>
          {selectedRecieveOption}
        </Text>

        <View
          style={[
            styles.qrCodeContainer,
            {
              backgroundColor: theme
                ? COLORS.darkModeBackgroundOffset
                : COLORS.lightModeBackgroundOffset,
              paddingVertical: errorMessageText.text ? 10 : 0,
            },
          ]}>
          {generatingInvoiceQRCode || !generatedAddress || isReceivingSwap ? (
            <>
              <ActivityIndicator
                size="large"
                color={theme ? COLORS.darkModeText : COLORS.lightModeText}
              />
              {(errorMessageText.type === 'stop' || isReceivingSwap) && (
                <>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.errorText,
                      {
                        color: theme
                          ? COLORS.darkModeText
                          : COLORS.lightModeText,
                        fontSize: isReceivingSwap ? SIZES.large : SIZES.small,
                      },
                    ]}>
                    {isReceivingSwap
                      ? 'Confirming swap'
                      : errorMessageText.text
                      ? errorMessageText.text
                      : ''}
                  </Text>
                  {bitcoinConfirmations && (
                    <ThemeText
                      content={`${bitcoinConfirmations} confirmations`}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <QRCode
                size={250}
                quietZone={15}
                value={
                  generatedAddress ? generatedAddress : 'Genrating QR Code'
                }
                color={theme ? COLORS.lightModeText : COLORS.darkModeText}
                backgroundColor={
                  theme ? COLORS.darkModeText : COLORS.lightModeText
                }
              />
              {errorMessageText.type === 'warning' && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      marginBottom: 0,
                      color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                    },
                  ]}>
                  {errorMessageText.text ? errorMessageText.text : ''}
                </Text>
              )}
            </>
          )}
        </View>

        {selectedRecieveOption.toLowerCase() != 'bitcoin' && (
          <Text
            style={[
              styles.amountText,
              {color: theme ? COLORS.darkModeText : COLORS.lightModeText},
            ]}>{`${formatBalanceAmount(sendingAmount)} ${
            masterInfoObject.userBalanceDenomination === 'sats' ||
            masterInfoObject.userBalanceDenomination === 'hidden'
              ? 'sats'
              : nodeInformation.fiatStats.coin
          }`}</Text>
        )}

        {(!isReceivingSwap ||
          selectedRecieveOption.toLowerCase() != 'lightning') && (
          <ButtonsContainer
            generatingInvoiceQRCode={generatingInvoiceQRCode}
            generatedAddress={generatedAddress}
            // setSendingAmount={setSendingAmount}
            // setPaymentDescription={setPaymentDescription}
            setSelectedRecieveOption={setSelectedRecieveOption}
          />
        )}

        <View style={{marginBottom: 'auto'}}></View>

        {(minMaxSwapAmount.min != 0 || minMaxSwapAmount.max != 0) &&
          selectedRecieveOption.toLowerCase() != 'lightning' && (
            <>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                    marginTop: 0,
                    marginBottom: 0,
                  },
                ]}>
                {generatingInvoiceQRCode ? ' ' : `Min/Max receive to bank:`}
              </Text>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                    marginTop: 0,
                    marginBottom: 'auto',
                  },
                ]}>
                {generatingInvoiceQRCode
                  ? ' '
                  : `${
                      masterInfoObject.userBalanceDenomination != 'fiat'
                        ? formatBalanceAmount(minMaxSwapAmount.min)
                        : Math.ceil(
                            minMaxSwapAmount.min *
                              (nodeInformation.fiatStats.value /
                                SATSPERBITCOIN),
                          )
                    }${minMaxSwapAmount.max != 0 ? ' - ' : ''}${
                      minMaxSwapAmount.max != 0
                        ? masterInfoObject.userBalanceDenomination != 'fiat'
                          ? formatBalanceAmount(minMaxSwapAmount.max)
                          : Math.ceil(
                              minMaxSwapAmount.max *
                                (nodeInformation.fiatStats.value /
                                  SATSPERBITCOIN),
                            )
                        : ''
                    } ${
                      masterInfoObject.userBalanceDenomination != 'fiat'
                        ? 'sats'
                        : nodeInformation.fiatStats.coin
                    }`}
              </Text>
            </>
          )}
        {(selectedRecieveOption.toLowerCase() === 'bitcoin' ||
          selectedRecieveOption.toLowerCase() === 'unified qr') &&
          isReceivingSwap && (
            <TouchableOpacity
              onPress={() => {
                copyToClipboard(
                  inProgressSwapInfo?.tx_hash || 'No Txhash',
                  navigate,
                );
              }}
              style={[
                styles.secondaryButton,
                {
                  borderColor: theme
                    ? COLORS.darkModeText
                    : COLORS.lightModeText,
                },
              ]}>
              <Text
                style={[
                  styles.secondaryButtonText,
                  {color: theme ? COLORS.darkModeText : COLORS.lightModeText},
                ]}>
                Copy transaction id
              </Text>
            </TouchableOpacity>
          )}
      </View>
    </GlobalThemeView>
  );

  function clear() {
    navigate.navigate('HomeAdmin');
  }
}

const styles = StyleSheet.create({
  title: {
    fontFamily: FONT.Title_Regular,
    fontSize: SIZES.medium,
    marginBottom: 10,
    marginTop: 'auto',
  },
  qrCodeContainer: {
    width: 275,
    height: 'auto',
    minHeight: 275,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    fontFamily: FONT.Title_Regular,
    fontSize: SIZES.large,
    marginTop: 10,
  },
  errorText: {
    width: '90%',
    fontFamily: FONT.Descriptoin_Regular,
    fontSize: SIZES.small,
    color: COLORS.cancelRed,
    textAlign: 'center',
    marginTop: 20,
  },

  secondaryButton: {
    width: 'auto',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    ...CENTER,
  },
  secondaryButtonText: {
    fontFamily: FONT.Other_Regular,
    fontSize: SIZES.medium,
  },
});
