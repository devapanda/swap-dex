import { BigNumber } from '@0x/utils';
import React from 'react';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components';

import { METAMASK_EXTENSION_URL } from '../../../common/constants';
import { initWallet, setWeb3State } from '../../../store/actions';
import {
    getEthAccount,
    getTotalEthBalance,
    getWallet,
    getWeb3State,
    getWethTokenBalance,
} from '../../../store/selectors';
import { Theme } from '../../../themes/commons';
import { errorsWallet } from '../../../util/error_messages';
import { isWeth } from '../../../util/known_tokens';
import { tokenAmountInUnits, tokenSymbolToDisplayString } from '../../../util/tokens';
import { ButtonVariant, StoreState, TokenBalance, Wallet, Web3State } from '../../../util/types';
import { Button } from '../../common/button';
import { Card } from '../../common/card';
import { ErrorCard, ErrorIcons, FontSize } from '../../common/error_card';
import { IconType, Tooltip } from '../../common/tooltip';

const LabelWrapper = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-between;
    flex-shrink: 0;
    padding: 8px 0;
`;

const Label = styled.span`
    align-items: center;
    color: ${props => props.theme.componentsTheme.textColorCommon};
    display: flex;
    flex-shrink: 0;
    font-size: 16px;
    line-height: 1.2;
`;

const Value = styled.span`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-feature-settings: 'tnum' 1;
    flex-shrink: 0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
    text-align: right;
    white-space: nowrap;
`;

const WalletStatusBadge = styled.div<{ web3State?: Web3State }>`
    background-color: ${props =>
        props.web3State === Web3State.Done
            ? props.theme.componentsTheme.green
            : props.theme.componentsTheme.errorButtonBackground};
    border-radius: 50%;
    height: 8px;
    margin-right: 6px;
    width: 8px;
`;

const WalletStatusTitle = styled.h3`
    color: ${props => props.theme.componentsTheme.textLight};
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    margin: 0;
    padding: 0;
    text-align: right;
`;

const WalletStatusContainer = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-between;
`;

const WalletCard = styled(Card)`
    max-width: 450px;
    max-height: 150px;
`;

const TooltipStyled = styled(Tooltip)`
    margin-left: 10px;
`;

interface ErrorCardStyledProps {
    cursor?: string;
}

const ErrorCardStyled = styled(ErrorCard)<ErrorCardStyledProps>`
    cursor: ${props => props.cursor};
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 100%;
    z-index: 5;
`;

ErrorCardStyled.defaultProps = {
    cursor: 'pointer',
};

const WalletErrorContainer = styled.div`
    height: 140px;
    position: relative;
`;

const WalletErrorText = styled.p`
    font-size: 16px;
    font-weight: normal;
    line-height: 23px;
    margin: 0;
    padding: 20px 0;
`;

const SimplifiedTextBox = styled.div<{ top?: string; bottom?: string; left?: string; right?: string }>`
    ${props => (props.bottom ? `bottom: ${props.bottom};` : '')}
    ${props => (props.left ? `left: ${props.left};` : '')}
    ${props => (props.right ? `right: ${props.right};` : '')}
    ${props => (props.top ? `top: ${props.top};` : '')}
    position: absolute;
    z-index: 1;

    rect {
        fill: ${props => props.theme.componentsTheme.simplifiedTextBoxColor};
    }
`;

const ButtonStyled = styled(Button)`
    width: 100%;
`;

interface StateProps {
    web3State: Web3State;
    ethAccount: string;
    quoteTokenBalance: TokenBalance | null;
    totalEthBalance: BigNumber;
    wallet: Wallet | null;
}

interface DispatchProps {
    onConnectWallet: () => any;
    onConnectingWallet: () => any;
    onChooseWallet: () => any;
}

interface OwnProps {
    theme: Theme;
}

type Props = StateProps & DispatchProps & OwnProps;

interface State {
    modalBuyEthIsOpen: boolean;
}

const simplifiedTextBoxBig = () => {
    return (
        <svg width="67" height="14" viewBox="0 0 67 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="67" height="14" rx="4" />
        </svg>
    );
};

const simplifiedTextBoxSmall = () => {
    return (
        <svg width="56" height="14" viewBox="0 0 56 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="14" rx="4" />
        </svg>
    );
};

const getWalletContent = (web3State: Web3State, wallet: Wallet | null) => {
    if (wallet) {
        return (
            <WalletStatusContainer>
                <WalletStatusBadge web3State={web3State} />
                <WalletStatusTitle>{wallet}</WalletStatusTitle>
            </WalletStatusContainer>
        );
    } else {
        return;
    }
};

const getWalletTitle = (web3State: Web3State) => {
    let title = 'Wallet Balance';

    if (web3State === Web3State.NotInstalled) {
        title = 'No wallet found';
    }
    if (web3State === Web3State.Connect) {
        title = 'Connect';
    }
    if (web3State === Web3State.Connecting) {
        title = 'Connecting';
    }

    return title;
};

const openMetamaskExtensionUrl = () => {
    const win = window.open(METAMASK_EXTENSION_URL, '_blank');
    if (win) {
        win.focus();
    }
};

class IEOWalletEthBalance extends React.Component<Props, State> {
    public readonly state: State = {
        modalBuyEthIsOpen: false,
    };

    public render = () => {
        const { web3State, wallet } = this.props;
        const walletContent = this._getWalletContent();
        return (
            <WalletCard
                title={getWalletTitle(web3State)}
                action={getWalletContent(web3State, wallet)}
                minHeightBody={'0px'}
            >
                {walletContent}
            </WalletCard>
        );
    };

    private readonly _getWalletContent = () => {
        let content: any = null;
        const {
            web3State,
            onConnectWallet,
            onChooseWallet,
            quoteTokenBalance,
            totalEthBalance,
            onConnectingWallet,
            wallet,
        } = this.props;

        if (quoteTokenBalance) {
            const quoteToken = quoteTokenBalance.token;
            const quoteTokenBalanceAmount = isWeth(quoteTokenBalance.token.symbol)
                ? totalEthBalance
                : quoteTokenBalance.balance;
            const quoteBalanceString = tokenAmountInUnits(
                quoteTokenBalanceAmount,
                quoteToken.decimals,
                quoteToken.displayDecimals,
            );

            const toolTip = isWeth(quoteToken.symbol) ? (
                <TooltipStyled description="Showing ETH + wETH balance" iconType={IconType.Fill} />
            ) : null;
            const quoteTokenLabel = isWeth(quoteToken.symbol) ? 'ETH' : tokenSymbolToDisplayString(quoteToken.symbol);

            /*const openFiatOnRamp = () => {
                onClickOpenFiatOnRampModal();
            };*/
            /*const joinAsMaker = () => {
                joinAsMakerToPool(ethAccount);
            };*/

            content = (
                <>
                    <LabelWrapper>
                        <Label>
                            {quoteTokenLabel}
                            {toolTip}
                        </Label>
                        <Value>{quoteBalanceString}</Value>
                    </LabelWrapper>
                    {/*  <ButtonStyled onClick={openFiatOnRamp} variant={ButtonVariant.Buy}>
                        Buy ETH
            </ButtonStyled>
                <ButtonStyled onClick={joinAsMaker} variant={ButtonVariant.Buy}>
                           Join As Market Maker
                </ButtonStyled>*/}
                </>
            );
        }

        if (web3State === Web3State.Locked) {
            content = (
                <WalletErrorContainer>
                    <ErrorCardStyled
                        fontSize={FontSize.Large}
                        icon={ErrorIcons.Lock}
                        onClick={onConnectWallet}
                        text={errorsWallet.mmConnect}
                        textAlign="center"
                    />
                    <SimplifiedTextBox top="0" left="0">
                        {simplifiedTextBoxBig()}
                    </SimplifiedTextBox>
                    <SimplifiedTextBox top="0" right="0">
                        {simplifiedTextBoxBig()}
                    </SimplifiedTextBox>
                    <SimplifiedTextBox bottom="0" left="0">
                        {simplifiedTextBoxSmall()}
                    </SimplifiedTextBox>
                    <SimplifiedTextBox bottom="0" right="0">
                        {simplifiedTextBoxSmall()}
                    </SimplifiedTextBox>
                </WalletErrorContainer>
            );
        }
        if (web3State === Web3State.Connect) {
            content = (
                <WalletErrorContainer>
                    <ErrorCardStyled
                        fontSize={FontSize.Large}
                        icon={ErrorIcons.Lock}
                        onClick={onConnectingWallet}
                        text={'Connect Your Wallet'}
                        textAlign="center"
                    />
                </WalletErrorContainer>
            );
        }
        if (web3State === Web3State.Connecting) {
            content = (
                <WalletErrorContainer>
                    <ErrorCardStyled
                        fontSize={FontSize.Large}
                        icon={ErrorIcons.Lock}
                        onClick={onChooseWallet}
                        text={'Connecting Your Wallet'}
                        textAlign="center"
                    />
                </WalletErrorContainer>
            );
        }

        if (web3State === Web3State.NotInstalled) {
            content = (
                <>
                    <WalletErrorText>Install Metamask wallet to make trades.</WalletErrorText>
                    <ButtonStyled variant={ButtonVariant.Tertiary} onClick={openMetamaskExtensionUrl}>
                        {errorsWallet.mmGetExtension}
                    </ButtonStyled>
                </>
            );
        }

        if (web3State === Web3State.Loading) {
            let loadingText = errorsWallet.mmLoading;
            if (wallet) {
                loadingText = `Please wait while we load ${wallet}`;
            }
            content = (
                <>
                    <ButtonStyled variant={ButtonVariant.Tertiary}>{loadingText}</ButtonStyled>
                </>
            );
        }

        if (web3State === Web3State.Error) {
            content = (
                <WalletErrorContainer>
                    <ErrorCardStyled
                        cursor={'default'}
                        fontSize={FontSize.Large}
                        icon={ErrorIcons.Warning}
                        text={errorsWallet.mmWrongNetwork}
                        textAlign="center"
                    />
                    <SimplifiedTextBox top="0" left="0">
                        {simplifiedTextBoxBig()}
                    </SimplifiedTextBox>
                    <SimplifiedTextBox top="0" right="0">
                        {simplifiedTextBoxBig()}
                    </SimplifiedTextBox>
                    <SimplifiedTextBox bottom="0" left="0">
                        {simplifiedTextBoxSmall()}
                    </SimplifiedTextBox>
                    <SimplifiedTextBox bottom="0" right="0">
                        {simplifiedTextBoxSmall()}
                    </SimplifiedTextBox>
                </WalletErrorContainer>
            );
        }

        return content;
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        web3State: getWeb3State(state),
        ethAccount: getEthAccount(state),
        quoteTokenBalance: getWethTokenBalance(state),
        totalEthBalance: getTotalEthBalance(state),
        wallet: getWallet(state),
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        onChooseWallet: () => dispatch(setWeb3State(Web3State.Connect)),
        onConnectingWallet: () => dispatch(setWeb3State(Web3State.Connecting)),
        onConnectWallet: () => dispatch(initWallet()),
    };
};

const IEOWalletEthBalanceContainer = withTheme(connect(mapStateToProps, mapDispatchToProps)(IEOWalletEthBalance));

export { IEOWalletEthBalance, IEOWalletEthBalanceContainer };
