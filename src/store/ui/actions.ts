import { MarketBuySwapQuote, MarketSellSwapQuote } from '@0x/asset-swapper';
import { ERC721TokenContract } from '@0x/contract-wrappers';
import { eip712Utils, signatureUtils } from '@0x/order-utils';
import { MetamaskSubprovider } from '@0x/subproviders';
import { EIP712TypedData } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { createAction } from 'typesafe-actions';

import { Config } from '../../common/config';
import { CHAIN_ID, FEE_PERCENTAGE, FEE_RECIPIENT, ZERO } from '../../common/constants';
import { getAvailableMarkets, updateAvailableMarkets } from '../../common/markets';
import { InsufficientOrdersAmountException } from '../../exceptions/insufficient_orders_amount_exception';
import { InsufficientTokenBalanceException } from '../../exceptions/insufficient_token_balance_exception';
import { SignedOrderException } from '../../exceptions/signed_order_exception';
import { getConfigFromNameOrDomain } from '../../services/config';
import { LocalStorage } from '../../services/local_storage';
import { Theme } from '../../themes/commons';
import { getThemeFromConfigDex } from '../../themes/theme_meta_data_utils';
import { ATokenData, Protocol } from '../../util/aave/types';
import { getCurrencyPairByTokensSymbol } from '../../util/known_currency_pairs';
import { getKnownTokens, getWethAssetData, isWeth } from '../../util/known_tokens';
import {
    buildLimitOrder,
    buildLimitOrderIEO,
    buildMarketLimitMatchingOrders,
    buildMarketOrders,
    isDutchAuction,
} from '../../util/orders';
import {
    createBasicBuyCollectibleSteps,
    createBorrowTokenSteps,
    createBuySellLimitMatchingSteps,
    createBuySellLimitSteps,
    createBuySellMarketSteps,
    createLendingTokenSteps,
    createRepayTokenSteps,
    createSellCollectibleSteps,
    createSwapMarketSteps,
} from '../../util/steps_modals_generation';
import { getExpirationTimeFromSeconds, getExpirationTimeOrdersFromConfig } from '../../util/time_utils';
import { tokenAmountInUnits, tokenAmountInUnitsToBigNumber } from '../../util/tokens';
import {
    Collectible,
    ConfigData,
    ConfigFile,
    ConfigRelayerData,
    Fill,
    GeneralConfig,
    iTokenData,
    MarketFill,
    Notification,
    NotificationKind,
    OrderFeeData,
    OrderSide,
    Step,
    StepKind,
    StepSubmitConfig,
    StepToggleTokenLock,
    StepTransferToken,
    StepUnLendingToken,
    StepWrapEth,
    ThunkCreator,
    Token,
    TokenBalance,
    TokenIEO,
    UserConfigData,
} from '../../util/types';
import { setCurrencyPair, setMarketTokens } from '../market/actions';
import { setFeePercentage, setFeeRecipient } from '../relayer/actions';
import * as selectors from '../selectors';
import { getUserConfigData } from '../selectors';
import { setSwapBaseToken, setSwapQuoteToken } from '../swap/actions';

export const setHasUnreadNotifications = createAction('ui/UNREAD_NOTIFICATIONS_set', resolve => {
    return (hasUnreadNotifications: boolean) => resolve(hasUnreadNotifications);
});

export const addNotifications = createAction('ui/NOTIFICATIONS_add', resolve => {
    return (newNotifications: Notification[]) => resolve(newNotifications);
});

export const setNotifications = createAction('ui/NOTIFICATIONS_set', resolve => {
    return (notifications: Notification[]) => resolve(notifications);
});

export const addFills = createAction('ui/FILLS_add', resolve => {
    return (newFills: Fill[]) => resolve(newFills);
});

export const setFills = createAction('ui/FILLS_set', resolve => {
    return (fills: Fill[]) => resolve(fills);
});

export const addMarketFills = createAction('ui/FILLS_MARKET_add', resolve => {
    return (newMarketFills: MarketFill) => resolve(newMarketFills);
});

export const setMarketFills = createAction('ui/FILLS_MARKET_set', resolve => {
    return (marketFills: MarketFill) => resolve(marketFills);
});

export const addUserMarketFills = createAction('ui/FILLS_USER_MARKET_add', resolve => {
    return (newUserMarketFills: Fill[]) => resolve(newUserMarketFills);
});

export const setUserMarketFills = createAction('ui/FILLS_USER_MARKET_set', resolve => {
    return (newUserMarketFills: MarketFill) => resolve(newUserMarketFills);
});

export const setTour = createAction('ui/TOUR_set', resolve => {
    return (setIsTour: boolean) => resolve(setIsTour);
});

export const setUserFills = createAction('ui/FILLS_USER_set', resolve => {
    return (userFills: Fill[]) => resolve(userFills);
});

export const addUserFills = createAction('ui/FILLS_USER_add', resolve => {
    return (userFills: Fill[]) => resolve(userFills);
});

export const setOrderSecondsExpirationTime = createAction('ui/ORDER_SECONDS_EXPIRATION_TIME_set', resolve => {
    return (orderSecondsExpirationTime: BigNumber | null) => resolve(orderSecondsExpirationTime);
});

export const setOrderPriceSelected = createAction('ui/ORDER_PRICE_SELECTED_set', resolve => {
    return (orderPriceSelected: BigNumber) => resolve(orderPriceSelected);
});

export const setOrderBuyPriceSelected = createAction('ui/ORDER_BUY_PRICE_SELECTED_set', resolve => {
    return (orderPriceSelected: BigNumber) => resolve(orderPriceSelected);
});

export const setOrderSellPriceSelected = createAction('ui/ORDER_SELL_PRICE_SELECTED_set', resolve => {
    return (orderPriceSelected: BigNumber) => resolve(orderPriceSelected);
});

export const setMakerAmountSelected = createAction('ui/MAKER_AMOUNT_SELECTED_set', resolve => {
    return (makerAmountSelected: BigNumber) => resolve(makerAmountSelected);
});

export const setStepsModalPendingSteps = createAction('ui/steps_modal/PENDING_STEPS_set', resolve => {
    return (pendingSteps: Step[]) => resolve(pendingSteps);
});

export const setStepsModalDoneSteps = createAction('ui/steps_modal/DONE_STEPS_set', resolve => {
    return (doneSteps: Step[]) => resolve(doneSteps);
});

export const setStepsModalCurrentStep = createAction('ui/steps_modal/CURRENT_STEP_set', resolve => {
    return (currentStep: Step | null) => resolve(currentStep);
});

export const stepsModalAdvanceStep = createAction('ui/steps_modal/advance_step');

export const stepsModalReset = createAction('ui/steps_modal/reset');

export const setModalTransfer = createAction('ui/TRANSFER_MODAL_set', resolve => {
    return (isOpen: boolean) => resolve(isOpen);
});

export const openSideBar = createAction('ui/OPEN_SIDEBAR_set', resolve => {
    return (isOpen: boolean) => resolve(isOpen);
});

export const openFiatOnRampModal = createAction('ui/OPEN_FIAT_ON_RAMP_set', resolve => {
    return (isOpen: boolean) => resolve(isOpen);
});

export const openFiatOnRampChooseModal = createAction('ui/OPEN_FIAT_ON_RAMP_CHOOSE_set', resolve => {
    return (isOpen: boolean) => resolve(isOpen);
});

export const setERC20Theme = createAction('ui/ERC20_THEME_set', resolve => {
    return (theme: Theme) => resolve(theme);
});

export const setThemeName = createAction('ui/THEME_NAME_set', resolve => {
    return (themeName: string | undefined) => resolve(themeName);
});

export const setERC20Layout = createAction('ui/ERC20_LAYOUT_set', resolve => {
    return (layout: string) => resolve(layout);
});

export const setDynamicLayout = createAction('ui/DYNAMIC_LAYOUT_set', resolve => {
    return (isDynamic: boolean) => resolve(isDynamic);
});

export const setGeneralConfig = createAction('ui/GENERAL_CONFIG_set', resolve => {
    return (generalConfig: GeneralConfig | undefined) => resolve(generalConfig);
});

export const setConfigData = createAction('ui/CONFIG_DATA_set', resolve => {
    return (config: ConfigData) => resolve(config);
});

export const setIsAffiliate = createAction('ui/IS_AFFILIATE_set', resolve => {
    return (isAffiliate: boolean) => resolve(isAffiliate);
});

export const setUserConfigData = createAction('ui/USER_CONFIG_DATA_set', resolve => {
    return (config: UserConfigData | null) => resolve(config);
});

export const setFiatType = createAction('ui/FIAT_TYPE_set', resolve => {
    return (fiatType: 'APPLE_PAY' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CARDS') => resolve(fiatType);
});

export const setNotKnownToken = createAction('ui/NOT_KNOWN_TOKEN_set', resolve => {
    return (isNotKnownToken: boolean) => resolve(isNotKnownToken);
});

export const startToggleTokenLockSteps: ThunkCreator = (token: Token, isUnlocked: boolean) => {
    return async dispatch => {
        const toggleTokenLockStep = isUnlocked ? getLockTokenStep(token) : getUnlockTokenStep(token);

        dispatch(setStepsModalCurrentStep(toggleTokenLockStep));
        dispatch(setStepsModalPendingSteps([]));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startWrapEtherSteps: ThunkCreator = (newWethBalance: BigNumber) => {
    return async (dispatch, getState) => {
        const state = getState();
        const currentWethBalance = selectors.getWethBalance(state);

        const wrapEthStep: StepWrapEth = {
            kind: StepKind.WrapEth,
            currentWethBalance,
            newWethBalance,
            context: 'standalone',
        };

        dispatch(setStepsModalCurrentStep(wrapEthStep));
        dispatch(setStepsModalPendingSteps([]));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startTranferTokenSteps: ThunkCreator = (
    amount: BigNumber,
    token: Token,
    address: string,
    isEth: boolean,
) => {
    return async dispatch => {
        const transferTokenStep: StepTransferToken = {
            kind: StepKind.TransferToken,
            amount,
            token,
            address,
            isEth,
        };

        dispatch(setStepsModalCurrentStep(transferTokenStep));
        dispatch(setStepsModalPendingSteps([]));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startSellCollectibleSteps: ThunkCreator = (
    collectible: Collectible,
    startingPrice: BigNumber,
    side: OrderSide,
    expirationDate: BigNumber,
    endingPrice: BigNumber | null,
) => {
    return async (dispatch, getState, { getContractWrappers }) => {
        const state = getState();

        const contractWrappers = await getContractWrappers();
        const ethAccount = selectors.getEthAccount(state);
        const selectedCollection = selectors.getCollectibleCollectionSelected(state);

        const erc721Token = new ERC721TokenContract(selectedCollection.address, contractWrappers.getProvider());
        const isUnlocked = await erc721Token
            .isApprovedForAll(ethAccount, contractWrappers.contractAddresses.erc721Proxy)
            .callAsync();
        const sellCollectibleSteps: Step[] = createSellCollectibleSteps(
            collectible,
            startingPrice,
            side,
            isUnlocked,
            expirationDate,
            endingPrice,
        );
        dispatch(setStepsModalCurrentStep(sellCollectibleSteps[0]));
        dispatch(setStepsModalPendingSteps(sellCollectibleSteps.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startBuyCollectibleSteps: ThunkCreator = (collectible: Collectible, ethAccount: string) => {
    return async (dispatch, getState, { getContractWrappers, getWeb3Wrapper }) => {
        if (!collectible.order) {
            throw new Error('Collectible is not for sale');
        }

        let buyCollectibleSteps;
        if (isDutchAuction(collectible.order)) {
            throw new Error('DutchAuction currently unsupported');
            // const state = getState();
            // const contractWrappers = await getContractWrappers();

            // const wethTokenBalance = selectors.getWethTokenBalance(state) as TokenBalance;

            // const { currentAmount } = await contractWrappers.dutchAuction.getAuctionDetails.callAsync(
            //     collectible.order,
            // );

            // buyCollectibleSteps = createDutchBuyCollectibleSteps(
            //     collectible.order,
            //     collectible,
            //     wethTokenBalance,
            //     currentAmount,
            // );
        } else {
            buyCollectibleSteps = createBasicBuyCollectibleSteps(collectible.order, collectible);
        }

        dispatch(setStepsModalCurrentStep(buyCollectibleSteps[0]));
        dispatch(setStepsModalPendingSteps(buyCollectibleSteps.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startBuySellLimitSteps: ThunkCreator = (
    amount: BigNumber,
    price: BigNumber,
    side: OrderSide,
    orderFeeData: OrderFeeData,
) => {
    return async (dispatch, getState) => {
        const state = getState();
        const baseToken = selectors.getBaseToken(state) as Token;
        const quoteToken = selectors.getQuoteToken(state) as Token;
        const tokenBalances = selectors.getTokenBalances(state) as TokenBalance[];
        const wethTokenBalance = selectors.getWethTokenBalance(state) as TokenBalance;
        const buySellLimitFlow: Step[] = createBuySellLimitSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            amount,
            price,
            side,
            orderFeeData,
        );

        dispatch(setStepsModalCurrentStep(buySellLimitFlow[0]));
        dispatch(setStepsModalPendingSteps(buySellLimitFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startMultipleBuySellLimitSteps: ThunkCreator = (
    amountBuy: BigNumber,
    priceBuy: BigNumber,
    orderBuyFeeData: OrderFeeData,
    amountSell: BigNumber,
    priceSell: BigNumber,
    orderSellFeeData: OrderFeeData,
) => {
    return async (dispatch, getState) => {
        const state = getState();
        const baseToken = selectors.getBaseToken(state) as Token;
        const quoteToken = selectors.getQuoteToken(state) as Token;
        const tokenBalances = selectors.getTokenBalances(state) as TokenBalance[];
        const wethTokenBalance = selectors.getWethTokenBalance(state) as TokenBalance;

        const buyLimitFlow: Step[] = createBuySellLimitSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            amountBuy,
            priceBuy,
            OrderSide.Buy,
            orderBuyFeeData,
        );

        const sellLimitFlow: Step[] = createBuySellLimitSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            amountSell,
            priceSell,
            OrderSide.Sell,
            orderSellFeeData,
        );
        buyLimitFlow.push(...sellLimitFlow);

        dispatch(setStepsModalCurrentStep(buyLimitFlow[0]));
        dispatch(setStepsModalPendingSteps(buyLimitFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startDexConfigSteps: ThunkCreator = (config: ConfigFile) => {
    return async (dispatch, _getState) => {
        const submitConfigStep: StepSubmitConfig = {
            kind: StepKind.SubmitConfig,
            config,
        };

        dispatch(setStepsModalCurrentStep(submitConfigStep));
        dispatch(setStepsModalPendingSteps([]));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startBuySellLimitIEOSteps: ThunkCreator = (
    amount: BigNumber,
    price: BigNumber,
    side: OrderSide,
    orderFeeData: OrderFeeData,
    baseToken: Token,
    quoteToken: Token,
) => {
    return async (dispatch, getState) => {
        const state = getState();
        const tokenBalanceIEO = selectors.getBaseTokenBalanceIEO(state) as TokenBalance;
        const wethTokenBalance = selectors.getWethTokenBalance(state) as TokenBalance;

        const buySellLimitFlow: Step[] = createBuySellLimitSteps(
            baseToken,
            quoteToken,
            [tokenBalanceIEO],
            wethTokenBalance,
            amount,
            price,
            side,
            orderFeeData,
            true,
        );

        dispatch(setStepsModalCurrentStep(buySellLimitFlow[0]));
        dispatch(setStepsModalPendingSteps(buySellLimitFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startBuySellLimitMatchingSteps: ThunkCreator = (
    amount: BigNumber,
    price: BigNumber,
    side: OrderSide,
    orderFeeData: OrderFeeData,
) => {
    return async (dispatch, getState) => {
        const state = getState();
        const baseToken = selectors.getBaseToken(state) as Token;
        const quoteToken = selectors.getQuoteToken(state) as Token;
        const tokenBalances = selectors.getTokenBalances(state) as TokenBalance[];
        const wethTokenBalance = selectors.getWethTokenBalance(state) as TokenBalance;
        const ethBalance = selectors.getEthBalance(state);
        const totalEthBalance = selectors.getTotalEthBalance(state);
        const quoteTokenBalance = selectors.getQuoteTokenBalance(state);
        const baseTokenBalance = selectors.getBaseTokenBalance(state);

        const allOrders =
            side === OrderSide.Buy ? selectors.getOpenSellOrders(state) : selectors.getOpenBuyOrders(state);
        const { ordersToFill, amounts, amountFill, amountsMaker } = buildMarketLimitMatchingOrders(
            {
                amount,
                price,
                orders: allOrders,
            },
            side,
        );

        if (ordersToFill.length === 0) {
            return 0;
        }
        const totalFilledAmount = amounts.reduce((total: BigNumber, currentValue: BigNumber) => {
            return total.plus(currentValue);
        }, new BigNumber(0));

        let price_avg;
        if (side === OrderSide.Buy) {
            const takerFilledAmount = tokenAmountInUnitsToBigNumber(totalFilledAmount, quoteToken.decimals);
            const makerFilledAmount = tokenAmountInUnitsToBigNumber(amountFill, baseToken.decimals);
            price_avg = takerFilledAmount.div(makerFilledAmount);
        } else {
            const totalMakerAmount = amountsMaker.reduce((total: BigNumber, currentValue: BigNumber) => {
                return total.plus(currentValue);
            }, new BigNumber(0));

            const makerFilledAmount = tokenAmountInUnitsToBigNumber(totalMakerAmount, quoteToken.decimals);
            const takerFilledAmount = tokenAmountInUnitsToBigNumber(amountFill, baseToken.decimals);

            price_avg = makerFilledAmount.div(takerFilledAmount);
        }

        if (side === OrderSide.Sell) {
            // When selling, user should have enough BASE Token
            if (baseTokenBalance && baseTokenBalance.balance.isLessThan(totalFilledAmount)) {
                throw new InsufficientTokenBalanceException(baseToken.symbol);
            }
        } else {
            let takerWethFee: BigNumber = new BigNumber(0);
            const wethAssetData = getWethAssetData();
            for (const or of ordersToFill) {
                if (or.takerFeeAssetData.toLowerCase() === wethAssetData && or.takerFee.gt(0)) {
                    takerWethFee = takerWethFee.plus(or.takerFee);
                }
            }
            // When buying and
            // if quote token is weth, should have enough ETH + WETH balance, or
            // if quote token is not weth, should have enough quote token balance
            const isEthAndWethNotEnoughBalance =
                isWeth(quoteToken.symbol) && totalEthBalance.isLessThan(totalFilledAmount.plus(takerWethFee));
            const isOtherQuoteTokenAndNotEnoughBalance =
                !isWeth(quoteToken.symbol) &&
                quoteTokenBalance &&
                quoteTokenBalance.balance.isLessThan(totalFilledAmount);
            if (isEthAndWethNotEnoughBalance || isOtherQuoteTokenAndNotEnoughBalance) {
                throw new InsufficientTokenBalanceException(quoteToken.symbol);
            }
        }

        const buySellLimitMatchingFlow: Step[] = createBuySellLimitMatchingSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            ethBalance,
            amountFill,
            side,
            price,
            price_avg,
            ordersToFill,
        );

        dispatch(setStepsModalCurrentStep(buySellLimitMatchingFlow[0]));
        dispatch(setStepsModalPendingSteps(buySellLimitMatchingFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startLendingTokenSteps: ThunkCreator = (
    amount: BigNumber,
    token: Token,
    defiToken: iTokenData | ATokenData,
    isEth: boolean,
    protocol: Protocol,
) => {
    return async (dispatch, getState) => {
        const state = getState();
        const ethBalance = selectors.getEthBalance(state);
        const wethBalance = selectors.getWethBalance(state);
        const totalEthBalance = selectors.getTotalEthBalance(state);
        const isEthAndWethNotEnoughBalance = isEth && totalEthBalance.isLessThan(amount);

        if (isEthAndWethNotEnoughBalance) {
            throw new InsufficientTokenBalanceException(token.symbol);
        }

        const lendingTokenFlow: Step[] = createLendingTokenSteps(
            defiToken,
            token,
            wethBalance,
            ethBalance,
            amount,
            isEth,
            protocol,
        );

        dispatch(setStepsModalCurrentStep(lendingTokenFlow[0]));
        dispatch(setStepsModalPendingSteps(lendingTokenFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startBorrowTokenSteps: ThunkCreator = (
    amount: BigNumber,
    token: Token,
    defiToken: iTokenData | ATokenData,
    isEth: boolean,
    protocol: Protocol,
) => {
    return async (dispatch, getState) => {
        const state = getState();
        const ethBalance = selectors.getEthBalance(state);
        const wethBalance = selectors.getWethBalance(state);
        const totalEthBalance = selectors.getTotalEthBalance(state);
        const isEthAndWethNotEnoughBalance = isEth && totalEthBalance.isLessThan(amount);

        if (isEthAndWethNotEnoughBalance) {
            throw new InsufficientTokenBalanceException(token.symbol);
        }

        const borrowTokenFlow: Step[] = createBorrowTokenSteps(
            defiToken,
            token,
            wethBalance,
            ethBalance,
            amount,
            isEth,
            protocol,
        );

        dispatch(setStepsModalCurrentStep(borrowTokenFlow[0]));
        dispatch(setStepsModalPendingSteps(borrowTokenFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startRepayTokenSteps: ThunkCreator = (
    amount: BigNumber,
    token: Token,
    defiToken: iTokenData | ATokenData,
    isEth: boolean,
    protocol: Protocol,
) => {
    return async (dispatch, getState) => {
        const state = getState();
        const ethBalance = selectors.getEthBalance(state);
        const wethBalance = selectors.getWethBalance(state);
        const totalEthBalance = selectors.getTotalEthBalance(state);
        const isEthAndWethNotEnoughBalance = isEth && totalEthBalance.isLessThan(amount);

        if (isEthAndWethNotEnoughBalance) {
            throw new InsufficientTokenBalanceException(token.symbol);
        }

        const repayTokenFlow: Step[] = createRepayTokenSteps(
            defiToken,
            token,
            wethBalance,
            ethBalance,
            amount,
            isEth,
            protocol,
        );

        dispatch(setStepsModalCurrentStep(repayTokenFlow[0]));
        dispatch(setStepsModalPendingSteps(repayTokenFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startUnLendingTokenSteps: ThunkCreator = (
    amount: BigNumber,
    token: Token,
    defiToken: iTokenData | ATokenData,
    isEth: boolean,
) => {
    return async dispatch => {
        const unLendingTokenStep: StepUnLendingToken = {
            kind: StepKind.UnLendingToken,
            amount,
            token,
            isEth,
            defiToken,
            isLending: false,
        };

        dispatch(setStepsModalCurrentStep(unLendingTokenStep));
        dispatch(setStepsModalPendingSteps([]));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startBuySellMarketSteps: ThunkCreator = (
    amount: BigNumber,
    side: OrderSide,
    orderFeeData: OrderFeeData,
) => {
    return async (dispatch, getState) => {
        const state = getState();
        const baseToken = selectors.getBaseToken(state) as Token;
        const quoteToken = selectors.getQuoteToken(state) as Token;
        const tokenBalances = selectors.getTokenBalances(state) as TokenBalance[];
        const wethTokenBalance = selectors.getWethTokenBalance(state) as TokenBalance;
        const ethBalance = selectors.getEthBalance(state);
        const totalEthBalance = selectors.getTotalEthBalance(state);
        const quoteTokenBalance = selectors.getQuoteTokenBalance(state);
        const baseTokenBalance = selectors.getBaseTokenBalance(state);

        const orders = side === OrderSide.Buy ? selectors.getOpenSellOrders(state) : selectors.getOpenBuyOrders(state);
        // tslint:disable-next-line:no-unused-variable
        const [ordersToFill, filledAmounts, canBeFilled] = buildMarketOrders(
            {
                amount,
                orders,
            },
            side,
        );
        if (!canBeFilled) {
            throw new InsufficientOrdersAmountException();
        }

        const totalFilledAmount = filledAmounts.reduce((total: BigNumber, currentValue: BigNumber) => {
            return total.plus(currentValue);
        }, ZERO);

        const price = totalFilledAmount.div(amount);

        if (side === OrderSide.Sell) {
            // When selling, user should have enough BASE Token
            if (baseTokenBalance && baseTokenBalance.balance.isLessThan(totalFilledAmount)) {
                throw new InsufficientTokenBalanceException(baseToken.symbol);
            }
        } else {
            let takerWethFee: BigNumber = new BigNumber(0);
            const wethAssetData = getWethAssetData();
            for (const or of ordersToFill) {
                if (or.takerFeeAssetData.toLowerCase() === wethAssetData && or.takerFee.gt(0)) {
                    takerWethFee = takerWethFee.plus(or.takerFee);
                }
            }
            // When buying and
            // if quote token is weth, should have enough ETH + WETH balance, or
            // if quote token is not weth, should have enough quote token balance
            const isEthAndWethNotEnoughBalance =
                isWeth(quoteToken.symbol) && totalEthBalance.isLessThan(totalFilledAmount.plus(takerWethFee));
            const ifOtherQuoteTokenAndNotEnoughBalance =
                !isWeth(quoteToken.symbol) &&
                quoteTokenBalance &&
                quoteTokenBalance.balance.isLessThan(totalFilledAmount);
            if (isEthAndWethNotEnoughBalance || ifOtherQuoteTokenAndNotEnoughBalance) {
                throw new InsufficientTokenBalanceException(quoteToken.symbol);
            }
        }

        const buySellMarketFlow: Step[] = createBuySellMarketSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            ethBalance,
            amount,
            side,
            price,
            ordersToFill,
        );

        dispatch(setStepsModalCurrentStep(buySellMarketFlow[0]));
        dispatch(setStepsModalPendingSteps(buySellMarketFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const startSwapMarketSteps: ThunkCreator = (
    amount: BigNumber,
    side: OrderSide,
    quote: MarketSellSwapQuote | MarketBuySwapQuote,
) => {
    return async (dispatch, getState) => {
        const state = getState();
        const baseToken = selectors.getSwapBaseToken(state) as Token;
        const quoteToken = selectors.getSwapQuoteToken(state) as Token;
        const tokenBalances = selectors.getTokenBalances(state) as TokenBalance[];
        const wethTokenBalance = selectors.getWethTokenBalance(state) as TokenBalance;
        const ethBalance = selectors.getEthBalance(state);
        const totalEthBalance = selectors.getTotalEthBalance(state);
        const quoteTokenBalance = selectors.getSwapQuoteTokenBalance(state);
        const baseTokenBalance = selectors.getSwapBaseTokenBalance(state);

        if (side === OrderSide.Sell) {
            const isEthAndWethNotEnoughBalance = isWeth(baseToken.symbol) && totalEthBalance.isLessThan(amount);
            const ifOtherBaseTokenAndNotEnoughBalance =
                !isWeth(baseToken.symbol) && baseTokenBalance && baseTokenBalance.balance.isLessThan(amount);
            // When selling, user should have enough BASE Token
            if (isEthAndWethNotEnoughBalance || ifOtherBaseTokenAndNotEnoughBalance) {
                throw new InsufficientTokenBalanceException(baseToken.symbol);
            }
        } else {
            const totalFilledAmount = quote.bestCaseQuoteInfo.takerAssetAmount;
            // When buying and
            // if quote token is weth, should have enough ETH + WETH balance, or
            // if quote token is not weth, should have enough quote token balance
            const isEthAndWethNotEnoughBalance =
                isWeth(quoteToken.symbol) && totalEthBalance.isLessThan(totalFilledAmount);
            const ifOtherQuoteTokenAndNotEnoughBalance =
                !isWeth(quoteToken.symbol) &&
                quoteTokenBalance &&
                quoteTokenBalance.balance.isLessThan(totalFilledAmount);
            if (isEthAndWethNotEnoughBalance || ifOtherQuoteTokenAndNotEnoughBalance) {
                throw new InsufficientTokenBalanceException(quoteToken.symbol);
            }
        }
        const bestQuote = quote.bestCaseQuoteInfo;
        const isSell = side === OrderSide.Sell;
        const quoteTokenAmount = isSell ? bestQuote.makerAssetAmount : bestQuote.takerAssetAmount;
        const baseTokenAmount = isSell ? bestQuote.takerAssetAmount : bestQuote.makerAssetAmount;

        const quoteTokenAmountUnits = new BigNumber(tokenAmountInUnits(quoteTokenAmount, quoteToken.decimals, 18));
        const baseTokenAmountUnits = new BigNumber(tokenAmountInUnits(baseTokenAmount, baseToken.decimals, 18));
        const price = quoteTokenAmountUnits.div(baseTokenAmountUnits);

        const buySellMarketFlow: Step[] = createSwapMarketSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            ethBalance,
            amount,
            side,
            price,
            quote,
        );

        dispatch(setStepsModalCurrentStep(buySellMarketFlow[0]));
        dispatch(setStepsModalPendingSteps(buySellMarketFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};

const getUnlockTokenStep = (token: Token): StepToggleTokenLock => {
    return {
        kind: StepKind.ToggleTokenLock,
        token,
        isUnlocked: false,
        context: 'standalone',
    };
};

const getLockTokenStep = (token: Token): StepToggleTokenLock => {
    return {
        kind: StepKind.ToggleTokenLock,
        token,
        isUnlocked: true,
        context: 'standalone',
    };
};

export const createSignedOrder: ThunkCreator = (amount: BigNumber, price: BigNumber, side: OrderSide) => {
    return async (dispatch, getState, { getContractWrappers, getWeb3Wrapper }) => {
        const state = getState();
        const ethAccount = selectors.getEthAccount(state);
        const baseToken = selectors.getBaseToken(state) as Token;
        const quoteToken = selectors.getQuoteToken(state) as Token;
        const isAffiliate = selectors.getIsAffiliate(state);
        let affiliateAddress;
        if (isAffiliate) {
            affiliateAddress = selectors.getFeeRecipient(state);
        }

        const orderSecondsExpirationTime = selectors.getOrderSecondsExpirationTime(state);
        const expirationTimeSeconds = orderSecondsExpirationTime
            ? getExpirationTimeFromSeconds(orderSecondsExpirationTime)
            : getExpirationTimeOrdersFromConfig();
        try {
            const web3Wrapper = await getWeb3Wrapper();
            const contractWrappers = await getContractWrappers();

            const order = await buildLimitOrder(
                {
                    account: ethAccount,
                    amount,
                    price,
                    baseTokenAddress: baseToken.address,
                    quoteTokenAddress: quoteToken.address,
                    exchangeAddress: contractWrappers.exchange.address,
                },
                side,
                expirationTimeSeconds,
                affiliateAddress,
            );

            const provider = new MetamaskSubprovider(web3Wrapper.getProvider());
            return signatureUtils.ecSignOrderAsync(provider, order, ethAccount);
        } catch (error) {
            throw new SignedOrderException(error.message);
        }
    };
};

export const createSignedOrderIEO: ThunkCreator = (amount: BigNumber, price: BigNumber, side: OrderSide) => {
    return async (_dispatch, getState, { getContractWrappers, getWeb3Wrapper }) => {
        const state = getState();
        const ethAccount = selectors.getEthAccount(state);
        const baseToken = selectors.getBaseTokenIEO(state) as TokenIEO;
        const wethTokenBalance = selectors.getWethTokenBalance(state) as TokenBalance;
        if (!wethTokenBalance) {
            return;
        }
        const quoteToken = wethTokenBalance.token;
        try {
            const web3Wrapper = await getWeb3Wrapper();
            const contractWrappers = await getContractWrappers();

            const order = await buildLimitOrderIEO(
                {
                    account: ethAccount,
                    amount,
                    price,
                    baseTokenAddress: baseToken.address,
                    quoteTokenAddress: quoteToken.address,
                    exchangeAddress: contractWrappers.exchange.address,
                },
                side,
                baseToken.endDate,
            );
            const provider = new MetamaskSubprovider(web3Wrapper.getProvider());
            return signatureUtils.ecSignOrderAsync(provider, order, ethAccount);
        } catch (error) {
            throw new SignedOrderException(error.message);
        }
    };
};

export const createConfigSignature: ThunkCreator = (message: string) => {
    return async (_dispatch, getState, { getWeb3Wrapper }) => {
        const state = getState();
        const ethAccount = selectors.getEthAccount(state);
        try {
            const web3Wrapper = await getWeb3Wrapper();
            const provider = new MetamaskSubprovider(web3Wrapper.getProvider());

            const msgParams: EIP712TypedData = {
                types: {
                    EIP712Domain: [
                        { name: 'name', type: 'string' },
                        { name: 'version', type: 'string' },
                        { name: 'chainId', type: 'uint256' },
                        { name: 'verifyingContract', type: 'address' },
                    ],
                    Message: [
                        { name: 'message', type: 'string' },
                        { name: 'terms', type: 'string' },
                    ],
                },
                primaryType: 'Message',
                domain: {
                    name: 'Veridex',
                    version: '1',
                    chainId: CHAIN_ID,
                    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
                },
                message: {
                    message: 'I want to create/edit this DEX',
                    terms: 'Powered by Switch',
                },
            };
            const web3Metamask = new Web3Wrapper(provider);

            const typedData = eip712Utils.createTypedData(
                msgParams.primaryType,
                msgParams.types,
                msgParams.message,
                // @ts-ignore
                msgParams.domain,
            );
            const signature = await web3Metamask.signTypedDataAsync(ethAccount.toLowerCase(), typedData);
            return { signature, message: JSON.stringify(typedData), owner: ethAccount };
        } catch (error) {
            throw new SignedOrderException(error.message);
        }
    };
};

export const addMarketBuySellNotification: ThunkCreator = (
    id: string,
    amount: BigNumber,
    token: Token,
    side: OrderSide,
    tx: Promise<any>,
) => {
    return async dispatch => {
        dispatch(
            addNotifications([
                {
                    id,
                    kind: NotificationKind.Market,
                    amount,
                    token,
                    side,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );
    };
};

export const addTransferTokenNotification: ThunkCreator = (
    id: string,
    amount: BigNumber,
    token: Token,
    address: string,
    tx: Promise<any>,
) => {
    return async dispatch => {
        dispatch(
            addNotifications([
                {
                    id,
                    kind: NotificationKind.TokenTransferred,
                    amount,
                    token,
                    address,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );
    };
};

export const addLendingTokenNotification: ThunkCreator = (
    id: string,
    amount: BigNumber,
    token: Token,
    address: string,
    tx: Promise<any>,
) => {
    return async dispatch => {
        dispatch(
            addNotifications([
                {
                    id,
                    kind: NotificationKind.LendingComplete,
                    amount,
                    token,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );
    };
};

export const addUnLendingTokenNotification: ThunkCreator = (
    id: string,
    amount: BigNumber,
    token: Token,
    address: string,
    tx: Promise<any>,
) => {
    return async dispatch => {
        dispatch(
            addNotifications([
                {
                    id,
                    kind: NotificationKind.UnLendingComplete,
                    amount,
                    token,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );
    };
    // tslint:disable-next-line: max-file-line-count
};

export const addBorrowTokenNotification: ThunkCreator = (
    id: string,
    amount: BigNumber,
    token: Token,
    address: string,
    tx: Promise<any>,
) => {
    return async dispatch => {
        dispatch(
            addNotifications([
                {
                    id,
                    kind: NotificationKind.BorrowComplete,
                    amount,
                    token,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );
    };
};

export const addRepayTokenNotification: ThunkCreator = (
    id: string,
    amount: BigNumber,
    token: Token,
    address: string,
    tx: Promise<any>,
) => {
    return async dispatch => {
        dispatch(
            addNotifications([
                {
                    id,
                    kind: NotificationKind.RepayComplete,
                    amount,
                    token,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );
    };
    // tslint:disable-next-line: max-file-line-count
};

export const initTheme: ThunkCreator = (themeName: string | null) => {
    return async dispatch => {
        if (themeName) {
            dispatch(setThemeName(themeName));
            const theme = getThemeFromConfigDex(themeName);
            dispatch(setERC20Theme(theme));
        } else {
            dispatch(setThemeName(Config.getConfig().theme_name));
            const theme = getThemeFromConfigDex();
            dispatch(setERC20Theme(theme));
        }
    };
};

export const initUserConfigData: ThunkCreator = () => {
    return async (dispatch, getState) => {
        try {
            const state = getState();
            const userConfig = getUserConfigData(state);
            if (!userConfig) {
                return;
            }
            const configInstance = Config.getInstance();
            configInstance._setConfig(userConfig.config);
            const known_tokens = getKnownTokens();
            known_tokens.updateTokens(Config.getConfig().tokens);
            updateAvailableMarkets(Config.getConfig().pairs);
            // Sometimes the markets only are available after the config arrive
            const parsedUrl = new URL(window.location.href.replace('#/', ''));
            const base = parsedUrl.searchParams.get('base') || getAvailableMarkets()[0].base;
            const quote = parsedUrl.searchParams.get('quote') || getAvailableMarkets()[0].quote;
            let currencyPair;
            try {
                currencyPair = getCurrencyPairByTokensSymbol(base, quote);
            } catch (e) {
                currencyPair = getCurrencyPairByTokensSymbol(
                    getAvailableMarkets()[0].base,
                    getAvailableMarkets()[0].quote,
                );
            }
            dispatch(setCurrencyPair(currencyPair));
            const themeName = localStorage.getThemeName() || Config.getConfig().theme_name;
            dispatch(initTheme(themeName));
        } catch (e) {
            return;
        }
    };
    // tslint:disable-next-line: max-file-line-count
};

export const initConfigData: ThunkCreator = (queryString: string | undefined, domain: string | undefined) => {
    return async dispatch => {
        try {
            let configRelayerData: ConfigRelayerData | undefined;
            if (domain) {
                configRelayerData = await getConfigFromNameOrDomain({ domain });
            }
            if (queryString) {
                const name = queryString.toLowerCase();
                configRelayerData = await getConfigFromNameOrDomain({ name });
            }
            if (!configRelayerData) {
                return;
            }

            const configFile: ConfigFile = JSON.parse(configRelayerData.config);

            const configData: ConfigData = { ...configRelayerData, config: configFile };
            dispatch(setConfigData(configData));
            const configInstance = Config.getInstance();
            configInstance._setConfig(configFile);
            const known_tokens = getKnownTokens();
            known_tokens.updateTokens(Config.getConfig().tokens);
            updateAvailableMarkets(Config.getConfig().pairs);
            // Sometimes the markets only are available after the config arrive
            const parsedUrl = new URL(window.location.href.replace('#/', ''));
            const base = parsedUrl.searchParams.get('base') || getAvailableMarkets()[0].base;
            const quote = parsedUrl.searchParams.get('quote') || getAvailableMarkets()[0].quote;
            let currencyPair;
            try {
                currencyPair = getCurrencyPairByTokensSymbol(base, quote);
                const tokenBase = known_tokens.getTokenBySymbol(base);
                const tokenQuote = known_tokens.getTokenBySymbol(quote);

                dispatch(setSwapBaseToken(tokenBase));
                dispatch(setSwapQuoteToken(tokenQuote));
                dispatch(setCurrencyPair(currencyPair));
                dispatch(
                    setMarketTokens({
                        baseToken: tokenBase,
                        quoteToken: tokenQuote,
                    }),
                );
            } catch (e) {
                currencyPair = getCurrencyPairByTokensSymbol(
                    getAvailableMarkets()[0].base,
                    getAvailableMarkets()[0].quote,
                );
                const tokenBase = known_tokens.getTokenBySymbol(getAvailableMarkets()[0].base);
                const tokenQuote = known_tokens.getTokenBySymbol(getAvailableMarkets()[0].quote);
                dispatch(setSwapBaseToken(tokenBase));
                dispatch(setSwapQuoteToken(tokenQuote));
                dispatch(
                    setMarketTokens({
                        baseToken: tokenBase,
                        quoteToken: tokenQuote,
                    }),
                );
            }

            dispatch(setGeneralConfig(Config.getConfig().general));
            const localStorage = new LocalStorage(window.localStorage);
            const themeName = localStorage.getThemeName() || Config.getConfig().theme_name;
            dispatch(initTheme(themeName));
            let feeRecipient = FEE_RECIPIENT;
            let feePercentage = FEE_PERCENTAGE;
            //    Uncomment when affiliated dex is running
            const general = Config.getConfig().general;
            if (general) {
                feeRecipient = general.feeRecipient || FEE_RECIPIENT;
                feePercentage = general.feePercentage || FEE_PERCENTAGE;
            }
            dispatch(setFeeRecipient(feeRecipient.toLowerCase()));
            dispatch(setFeePercentage(feePercentage));
            dispatch(setIsAffiliate(true));
        } catch (e) {
            return;
        }
    };
    // tslint:disable-next-line: max-file-line-count
};
