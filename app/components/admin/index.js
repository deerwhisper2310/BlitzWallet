import CameraModal from './homeComponents/cameraModal';
import ClipboardCopyPopup from './homeComponents/confirmClipboard';
import {
  FaucetHome,
  FaucetReceivePage,
  FaucetSettingsPage,
  FaucetSendPage,
} from './homeComponents/faucet';
import AmountToGift from './homeComponents/fundGift/amountToGift';
import HowToSteps from './homeComponents/fundGift/howToSteps';
import GiftWalletConfirmation from './homeComponents/fundGift/popups/giftWalletConfirmation';
import ScanRecieverQrCode from './homeComponents/fundGift/scanReciverQrCode';
import HomeLightning from './homeComponents/homeLightning';
import HalfModalSendOptions from './homeComponents/homeLightning/halfModalSendOptions';
import {HomeTransactions} from './homeComponents/homeLightning/homeTransactions';
import LiquidityIndicator from './homeComponents/homeLightning/liquidityIndicator';
import {SendRecieveBTNs} from './homeComponents/homeLightning/sendReciveBTNs';
import {UserSatAmount} from './homeComponents/homeLightning/userSatAmount';
import {UserTransactions} from './homeComponents/homeLightning/userTransactions';
import NavBar from './homeComponents/navBar';
import {
  ButtonsContainer,
  EditReceivePaymentInformation,
  RefundBitcoinTransactionPage,
  ViewInProgressSwap,
} from './homeComponents/receiveBitcoin';
import SwitchReceiveOptionPage from './homeComponents/receiveBitcoin/switchReceiveOptionPage';
import LnurlPaymentDescription from './homeComponents/sendBitcoin/lnurlPaymentDescription';

import SendPaymentScreen from './homeComponents/sendBitcoin/sendPaymentScreen';
import {
  AboutPage,
  BiometricLoginPage,
  BlitzSocialOptions,
  ConfirmActionPage,
  DisplayOptions,
  DrainPage,
  DrainWalletAddress,
  FiatCurrencyPage,
  FundWalletGift,
  GainsCalculator,
  LSPPage,
  LspDescriptionPopup,
  NodeInfo,
  NosterWalletConnect,
  RefundFailedLiquidSwaps,
  ResetPage,
  SeedPhrasePage,
  SendOnChainBitcoin,
  UserBalanceDenomination,
} from './homeComponents/settingsContent';
import HasNWCAccount from './homeComponents/settingsContent/nwc/hasAccount';
import NoNWCAccount from './homeComponents/settingsContent/nwc/noAccount';
import HomeLogin from './loginComponents/home';
import PinPage from './loginComponents/pinPage';

export {
  NavBar,
  HomeLightning,
  CameraModal,
  BlitzSocialOptions,
  SendOnChainBitcoin,
  SeedPhrasePage,
  ResetPage,
  RefundFailedLiquidSwaps,
  NosterWalletConnect,
  NodeInfo,
  LSPPage,
  GainsCalculator,
  FundWalletGift,
  FiatCurrencyPage,
  DrainPage,
  DisplayOptions,
  BiometricLoginPage,
  AboutPage,
  UserBalanceDenomination,
  ConfirmActionPage,
  DrainWalletAddress,
  LspDescriptionPopup,
  HasNWCAccount,
  NoNWCAccount,
  SendPaymentScreen,
  RefundBitcoinTransactionPage,
  ButtonsContainer,
  EditReceivePaymentInformation,
  SwitchReceiveOptionPage,
  ViewInProgressSwap,
  HomeTransactions,
  LiquidityIndicator,
  SendRecieveBTNs,
  UserSatAmount,
  UserTransactions,
  AmountToGift,
  HowToSteps,
  ScanRecieverQrCode,
  GiftWalletConfirmation,
  FaucetHome,
  FaucetReceivePage,
  FaucetSettingsPage,
  HomeLogin,
  PinPage,
  ClipboardCopyPopup,
  HalfModalSendOptions,
  LnurlPaymentDescription,
  FaucetSendPage,
};