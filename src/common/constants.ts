import { ERC20BridgeSource, SwapQuoteRequestOpts } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';

import { Network, ProviderType } from '../util/types';
import { ChainId } from '../util/types/swap';

export const ERC20_APP_BASE_PATH = '/erc20';
export const MARKET_APP_BASE_PATH = '/market-trade';
export const LAUNCHPAD_APP_BASE_PATH = '/launchpad';
export const MARGIN_APP_BASE_PATH = '/margin';
export const DEFI_APP_BASE_PATH = '/defi';
export const INSTANT_APP_BASE_PATH = '/instant';
export const FIAT_RAMP_APP_BASE_PATH = '/fiat-onramp';
export const MARKET_MAKER_APP_BASE_PATH = `${ERC20_APP_BASE_PATH}/market-maker`;

export const USE_RELAYER_MARKET_UPDATES = process.env.REACT_APP_USE_RELAYER_MARKET_UPDATES === 'true' ? true : false;

export const ERC721_APP_BASE_PATH = '/marketplace';
export const DEFAULT_BASE_PATH = process.env.REACT_APP_DEFAULT_BASE_PATH || ERC20_APP_BASE_PATH;

export const RELAYER_URL = process.env.REACT_APP_RELAYER_URL || 'http://localhost:3001/api/v3';

export const RELAYER_WS_URL = process.env.REACT_APP_RELAYER_WS_URL || 'ws://localhost:3001';

export const RPC_URL = process.env.REACT_APP_RPC_URL || 'https://cloudflare-eth.com/';

export const INFURA_ID = process.env.REACT_APP_INFURA_ID || '';

export const TX_DEFAULTS = {
    gas: 1000000,
    // gasLimit: 1000000,
    //  gasTransferToken: 21000,
    //  shouldValidate: true,
};

export const TX_DEFAULTS_TRANSFER = {
    gas: 1000000,
    gasLimit: 1000000,
    gasTransferToken: 21000,
    shouldValidate: true,
};

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1);

export const ZERO = new BigNumber(0);

export const MIN_ORDER_EXPIRATION_TIME_ON_ORDERBOOK = 60;

export const VERIDEX_ORIGIN = process.env.REACT_APP_VERIDEX_ORIGIN || 'https://switchdex.ag';

export const FEE_RECIPIENT = process.env.REACT_APP_FEE_RECIPIENT || ZERO_ADDRESS;
export const AFFILIATE_FEE_PERCENTAGE: number = process.env.REACT_APP_AFFILIATE_FEE_PERCENTAGE
    ? Number(process.env.REACT_APP_AFFILIATE_FEE_PERCENTAGE)
    : 0;

export const FEE_PERCENTAGE: number = process.env.REACT_APP_FEE_PERCENTAGE
    ? Number(process.env.REACT_APP_FEE_PERCENTAGE)
    : 0;

export const INSTANT_FEE_PERCENTAGE: number = process.env.REACT_APP_INSTANT_FEE_PERCENTAGE
    ? Number(process.env.REACT_APP_INSTANT_FEE_PERCENTAGE)
    : 0;

export const IS_ORDER_LIMIT_MATCHING: boolean = process.env.REACT_APP_MATCH_LIMIT_ORDERS === 'true' ? true : false;

export const ETH_DECIMALS = 18;
export const MAX_AMOUNT_TOKENS_IN_UNITS = 100000000000000000000000000000000000;

export const PROTOCOL_FEE_MULTIPLIER = 150000;

export const RELAYER_RPS = 5;

export const SECONDS_IN_A_DAY = new BigNumber(60 * 60 * 24);

export const DEFAULT_ORDER_EXPIRY_SECONDS = process.env.REACT_APP_DEFAULT_ORDER_EXPIRY_SECONDS
    ? new BigNumber(process.env.REACT_APP_DEFAULT_ORDER_EXPIRY_SECONDS)
    : SECONDS_IN_A_DAY;

export const UI_DECIMALS_DISPLAYED_ON_STEP_MODALS = 3;
export const UI_DECIMALS_DISPLAYED_SPREAD_PERCENT = 2;
export const UI_DECIMALS_DISPLAYED_DEFAULT_PRECISION = 2;
export const UI_DECIMALS_DISPLAYED_ORDER_SIZE = 0;
export const UI_DECIMALS_DISPLAYED_PRICE_ETH = 7;
export const UI_GENERAL_TITLE = 'VeriDex';

export const METAMASK_EXTENSION_URL = 'https://metamask.io/';
export const METAMASK_CHROME_EXTENSION_DOWNLOAD_URL =
    'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';

export const PORTIS_APP_ID = process.env.REACT_APP_PORTIS_APP_ID;
export const FORTMATIC_APP_ID = process.env.REACT_APP_FORTMATIC_APP_ID;

export const COINDIRECT_MERCHANT_ID = process.env.REACT_APP_COINDIRECT_MERCHANT_ID || '';

export const MOONPAY_API_KEY = process.env.REACT_APP_MOONPAY_API_KEY || '';

export const WYRE_ID = process.env.REACT_APP_WYRE_ID || '';

// Default value is enabled, 0 is disabled
export const UI_UPDATE_CHECK_INTERVAL: number = process.env.REACT_APP_UI_UPDATE_CHECK_INTERVAL
    ? Number.parseInt(process.env.REACT_APP_UI_UPDATE_CHECK_INTERVAL as string, 10)
    : 5000;

// Default value is enabled, 0 is disabled
export const UPDATE_ETHER_PRICE_INTERVAL: number = process.env.REACT_APP_UPDATE_ETHER_PRICE_INTERVAL
    ? Number.parseInt(process.env.REACT_APP_UPDATE_ETHER_PRICE_INTERVAL as string, 10)
    : 3600000;

// Default value is enabled, 0 is disabled
export const UPDATE_TOKENS_PRICE_INTERVAL: number = process.env.REACT_APP_UPDATE_TOKENS_PRICE_INTERVAL
    ? Number.parseInt(process.env.REACT_APP_UPDATE_ETHER_PRICE_INTERVAL as string, 10)
    : 3600000;

// Default value is enabled, 0 is disabled
export const UPDATE_ERC20_MARKETS: number = process.env.REACT_APP_UPDATE_ERC20_MARKETS_INTERVAL
    ? Number.parseInt(process.env.REACT_APP_UPDATE_ERC20_MARKETS_INTERVAL as string, 10)
    : 60000;

export const NOTIFICATIONS_LIMIT: number =
    Number.parseInt(process.env.REACT_APP_NOTIFICATIONS_LIMIT as string, 10) || 20;

export const GWEI_IN_WEI = new BigNumber(1000000000);

export const ONE_MINUTE_MS = 1000 * 60;

export const DEFAULT_GAS_PRICE = GWEI_IN_WEI.multipliedBy(6);

export const DEFAULT_ESTIMATED_TRANSACTION_TIME_MS = ONE_MINUTE_MS * 2;

export const GIT_COMMIT: string = process.env.REACT_APP_GIT_COMMIT || '';

export const START_BLOCK_LIMIT: number = Number.parseInt(process.env.REACT_APP_START_BLOCK_LIMIT as string, 10) || 1000;

export const LOGGER_ID: string = process.env.REACT_APP_LOGGER_ID || 'veridex';

export const ERC20_THEME_NAME: string = process.env.REACT_APP_ERC20_THEME_NAME || 'DARK_THEME';

export const ERC721_THEME_NAME: string = process.env.REACT_APP_ERC721_THEME_NAME || 'LIGHT_THEME';

export const COLLECTIBLES_SOURCE: string = process.env.REACT_APP_COLLECTIBLES_SOURCE || 'mocked';

export const COLLECTIBLE_NAME: string = process.env.REACT_APP_COLLECTIBLE_NAME || 'Unknown';
export const COLLECTIBLE_DESCRIPTION: string = process.env.REACT_APP_COLLECTIBLE_DESCRIPTION || 'Unknown';

const mockERC721Address = '0x07f96aa816c1f244cbc6ef114bb2b023ba54a2eb'; // Mock ERC721 in ganache
export const COLLECTIBLE_ADDRESS = process.env.REACT_APP_COLLECTIBLE_ADDRESS || mockERC721Address;

export const STEP_MODAL_DONE_STATUS_VISIBILITY_TIME: number =
    Number.parseInt(process.env.REACT_APP_STEP_MODAL_DONE_STATUS_VISIBILITY_TIME as string, 10) || 3500;

export const OPENSEA_API_KEY = process.env.REACT_APP_OPENSEA_API_KEY;

export const NETWORK_ID: number = Number.parseInt(process.env.REACT_APP_NETWORK_ID as string, 10) || Network.Mainnet;
// HACK(dekz): re-write the Ganache chain id which isn't network id
export const CHAIN_ID: number = process.env.REACT_APP_CHAIN_ID
    ? Number.parseInt(process.env.REACT_APP_CHAIN_ID as string, 10)
    : NETWORK_ID === 50
    ? 1337
    : NETWORK_ID;

export const NETWORK_NAME: string = Network[NETWORK_ID];

export const FILLS_LIMIT: number = Number.parseInt(process.env.REACT_APP_FILLS_LIMIT as string, 10) || 50;

export const TAKER_FEE_PERCENTAGE: string = process.env.REACT_APP_TAKER_FEE_PERCENTAGE || '0';

export const MAKER_FEE_PERCENTAGE: string = process.env.REACT_APP_MAKER_FEE_PERCENTAGE || '0';

export const USE_RELAYER_ORDER_CONFIG: boolean =
    process.env.REACT_APP_USE_RELAYER_ORDER_CONFIG === 'true' ? true : false;

export const USE_ORDERBOOK_PRICES: boolean = process.env.USE_ORDERBOOK_PRICES === 'true' ? true : false;

export const PROVIDER_TYPE_TO_NAME: { [key in ProviderType]: string } = {
    [ProviderType.Cipher]: 'Cipher',
    [ProviderType.EnjinWallet]: 'Enjin Wallet',
    [ProviderType.MetaMask]: 'MetaMask',
    [ProviderType.Mist]: 'Mist',
    [ProviderType.CoinbaseWallet]: 'Coinbase Wallet',
    [ProviderType.Parity]: 'Parity',
    [ProviderType.TrustWallet]: 'Trust Wallet',
    [ProviderType.Opera]: 'Opera Wallet',
    [ProviderType.Fallback]: 'Fallback',
};

export const ONE_SECOND_MS = 1000;

export const QUOTE_ORDER_EXPIRATION_BUFFER_MS = ONE_SECOND_MS * 30; // Ignore orders that expire in 30 seconds

const EXCLUDED_SOURCES = (() => {
    switch (CHAIN_ID) {
        case ChainId.Mainnet:
            return [];
        case ChainId.Kovan:
            return [ERC20BridgeSource.Kyber];
        default:
            return [ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Kyber, ERC20BridgeSource.Uniswap];
    }
})();

/*const gasSchedule: { [key in ERC20BridgeSource]: number } = {
    [ERC20BridgeSource.Native]: 1.5e5,
    [ERC20BridgeSource.Uniswap]: 3e5,
   // [ERC20BridgeSource.LiquidityProvider]: 3e5,
    [ERC20BridgeSource.Eth2Dai]: 5.5e5,
    [ERC20BridgeSource.Kyber]: 8e5,
    [ERC20BridgeSource.CurveUsdcDai]: 9e5,
    [ERC20BridgeSource.CurveUsdcDaiUsdt]: 9e5,
    [ERC20BridgeSource.CurveUsdcDaiUsdtTusd]: 10e5,
    [ERC20BridgeSource.CurveUsdcDaiUsdtBusd]: 10e5,
};*/

/*const feeSchedule: { [key in ERC20BridgeSource]: BigNumber } = Object.assign(
    {},
    ...(Object.keys(gasSchedule) as ERC20BridgeSource[]).map(k => ({
        [k]: new BigNumber(gasSchedule[k] + 1.5e5),
    })),
);*/

const DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE = 0.03; // 3% Slippage
// const DEFAULT_FALLBACK_SLIPPAGE_PERCENTAGE = 0.015; // 1.5% Slippage in a fallback route

export const ASSET_SWAPPER_MARKET_ORDERS_OPTS: Partial<SwapQuoteRequestOpts> = {
    noConflicts: true,
    excludedSources: EXCLUDED_SOURCES,
    bridgeSlippage: DEFAULT_QUOTE_SLIPPAGE_PERCENTAGE,
    // maxFallbackSlippage: DEFAULT_FALLBACK_SLIPPAGE_PERCENTAGE,
    numSamples: 13,
    sampleDistributionBase: 1.05,
    runLimit: 4096,
    dustFractionThreshold: 0.0025,
    // feeSchedule,
    // gasSchedule,
};
