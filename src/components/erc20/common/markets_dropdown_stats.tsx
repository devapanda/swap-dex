import { BigNumber } from '@0x/utils';
import React, { HTMLAttributes } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { MARKET_MAKER_APP_BASE_PATH } from '../../../common/constants';
import { getMarketFilters } from '../../../common/markets';
import { changeMarket, goToHome } from '../../../store/actions';
import {
    getBaseToken,
    getCurrencyPair,
    getCurrentRoutePath,
    getMarkets,
    getMarketsStats,
} from '../../../store/selectors';
import { themeBreakPoints, themeDimensions } from '../../../themes/commons';
import { getKnownTokens } from '../../../util/known_tokens';
import { filterMarketsByString, filterMarketsByTokenSymbol, marketToString } from '../../../util/markets';
import { isMobile } from '../../../util/screen';
import { formatTokenSymbol } from '../../../util/tokens';
import { CurrencyPair, Filter, Market, RelayerMarketStats, StoreState, Token } from '../../../util/types';
import { CardBase } from '../../common/card_base';
import { Dropdown } from '../../common/dropdown';
import { withWindowWidth } from '../../common/hoc/withWindowWidth';
import { ChevronDownIcon } from '../../common/icons/chevron_down_icon';
import { MagnifierIcon } from '../../common/icons/magnifier_icon';
import { TokenIcon } from '../../common/icons/token_icon';
import { CustomTDFirst, CustomTDLast, Table, TBody, THead, THFirst, THLast, TR } from '../../common/table';

interface PropsDivElement extends HTMLAttributes<HTMLDivElement> {}

interface DispatchProps {
    changeMarket: (currencyPair: CurrencyPair) => any;
    goToHome: () => any;
}

interface PropsToken {
    baseToken: Token | null;
    currencyPair: CurrencyPair;
    markets: Market[] | null;
    marketsStats: RelayerMarketStats[] | null | undefined;
    currentRoute: string;
}
interface OwnProps {
    windowWidth: number;
}

type Props = PropsDivElement & PropsToken & DispatchProps & OwnProps;

interface State {
    selectedFilter: Filter;
    search: string;
    isUserOnDropdown: boolean;
}

interface TokenFiltersTabProps {
    active: boolean;
    onClick: number;
}

interface MarketRowProps {
    active: boolean;
}

const rowHeight = '48px';

const MarketsDropdownWrapper = styled(Dropdown)``;

const MarketsDropdownHeader = styled.div`
    align-items: center;
    display: flex;
`;

const MarketsDropdownHeaderText = styled.span`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-size: 18px;
    font-weight: 600;
    line-height: 26px;
    margin-right: 10px;
`;

const MarketsDropdownBody = styled(CardBase)`
    box-shadow: ${props => props.theme.componentsTheme.boxShadow};
    max-height: 100%;
    max-width: 100%;
    width: 401px;
    @media (max-width: ${themeBreakPoints.sm}) {
        position: relative;
        max-width: 340px;
        left: -70px;
    }
`;

const MarketsFilters = styled.div`
    align-items: center;
    border-bottom: 1px solid ${props => props.theme.componentsTheme.dropdownBorderColor};
    display: flex;
    justify-content: space-between;
    min-height: ${rowHeight};
    padding: 8px 8px 8px ${themeDimensions.horizontalPadding};
    @media (max-width: ${themeBreakPoints.sm}) {
        display: inline;
    }
`;

const MarketsFiltersLabel = styled.h2`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-size: 16px;
    font-weight: 600;
    line-height: normal;
    margin: 0 auto 0 0;
    @media (max-width: ${themeBreakPoints.sm}) {
        padding: 8px 8px 8px ${themeDimensions.horizontalPadding};
    }
`;

const TokenFiltersTabs = styled.div`
    align-items: center;
    display: flex;
    margin-right: 10px;
`;

const TokenFiltersTab = styled.span<TokenFiltersTabProps>`
    color: ${props =>
        props.active ? props.theme.componentsTheme.textColorCommon : props.theme.componentsTheme.lightGray};
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    user-select: none;

    &:after {
        color: ${props => props.theme.componentsTheme.lightGray};
        content: '/';
        margin: 0 6px;
    }

    &:last-child:after {
        display: none;
    }
`;

const searchFieldHeight = '32px';
const searchFieldWidth = '142px';

const SearchWrapper = styled.div`
    height: ${searchFieldHeight};
    position: relative;
    width: ${searchFieldWidth};
`;

const SearchField = styled.input`
    background: ${props => props.theme.componentsTheme.marketsSearchFieldBackgroundColor};
    border-radius: ${themeDimensions.borderRadius};
    border: 1px solid ${props => props.theme.componentsTheme.marketsSearchFieldBorderColor};
    color: ${props => props.theme.componentsTheme.marketsSearchFieldTextColor};
    font-size: 13px;
    height: ${searchFieldHeight};
    left: 0;
    outline: none;
    padding: 0 15px 0 30px;
    position: absolute;
    top: 0;
    width: ${searchFieldWidth};
    z-index: 1;

    &:focus {
        border-color: ${props => props.theme.componentsTheme.marketsSearchFieldBorderColor};
    }
`;

const MagnifierIconWrapper = styled.div`
    line-height: 30px;
    height: 100%;
    left: 11px;
    position: absolute;
    top: 0;
    width: 14px;
    z-index: 12;
`;

const TableWrapper = styled.div`
    max-height: 420px;
    overflow: auto;
    position: relative;
`;

const verticalCellPadding = `
    padding-bottom: 10px;
    padding-top: 10px;
`;

const tableHeaderFontWeight = `
    font-weight: 700;
`;

const TRStyled = styled(TR)<MarketRowProps>`
    background-color: ${props => (props.active ? props.theme.componentsTheme.rowActive : 'transparent')};
    cursor: ${props => (props.active ? 'default' : 'pointer')};

    &:hover {
        background-color: ${props => props.theme.componentsTheme.rowActive};
    }

    &:last-child > td {
        border-bottom-left-radius: ${themeDimensions.borderRadius};
        border-bottom-right-radius: ${themeDimensions.borderRadius};
        border-bottom: none;
    }
`;

// Has a special left-padding: needs a specific selector to override the theme
const THFirstStyled = styled(THFirst)`
    ${verticalCellPadding}
    ${tableHeaderFontWeight}

    &, &:last-child {
        padding-left: 21.6px;
    }
`;

const THLastStyled = styled(THLast)`
    ${verticalCellPadding};
    ${tableHeaderFontWeight}
`;

const CustomTDFirstStyled = styled(CustomTDFirst)`
    ${verticalCellPadding};
`;

const CustomTDLastStyled = styled(CustomTDLast)`
    ${verticalCellPadding};
`;

const TokenIconAndLabel = styled.div`
    align-items: center;
    display: flex;
    justify-content: flex-start;
`;

const FilterSearchContainer = styled.div`
    @media (max-width: ${themeBreakPoints.sm}) {
        display: flex;
        justify-content: space-between;
        padding: 8px 8px 8px ${themeDimensions.horizontalPadding};
    }
`;

const TokenLabel = styled.div`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 0 12px;
`;

const DropdownTokenIcon = styled(TokenIcon)`
    margin-right: 10px;
    vertical-align: top;
`;

class MarketsDropdownStats extends React.Component<Props, State> {
    public readonly state: State = {
        selectedFilter: getMarketFilters()[0],
        search: '',
        isUserOnDropdown: false,
    };

    private readonly _dropdown = React.createRef<Dropdown>();

    public render = () => {
        const { currencyPair, baseToken, windowWidth, ...restProps } = this.props;

        const header = (
            <MarketsDropdownHeader>
                <MarketsDropdownHeaderText>
                    {baseToken ? (
                        <DropdownTokenIcon
                            symbol={baseToken.symbol}
                            primaryColor={baseToken.primaryColor}
                            isInline={true}
                            icon={baseToken.icon}
                        />
                    ) : null}
                    {formatTokenSymbol(currencyPair.base)}/{formatTokenSymbol(currencyPair.quote)}
                </MarketsDropdownHeaderText>
                <ChevronDownIcon />
            </MarketsDropdownHeader>
        );
        const FilterSearchContent = isMobile(windowWidth) ? (
            <>
                <MarketsFiltersLabel>Markets</MarketsFiltersLabel>
                <FilterSearchContainer>
                    {this._getTokensFilterTabs()}
                    {this._getSearchField()}
                </FilterSearchContainer>
            </>
        ) : (
            <>
                <MarketsFiltersLabel>Markets</MarketsFiltersLabel>
                {this._getTokensFilterTabs()}
                {this._getSearchField()}
            </>
        );

        const body = (
            <MarketsDropdownBody>
                <MarketsFilters onMouseOver={this._setUserOnDropdown} onMouseOut={this._removeUserOnDropdown}>
                    {FilterSearchContent}
                </MarketsFilters>
                <TableWrapper>{this._getMarkets()}</TableWrapper>
            </MarketsDropdownBody>
        );
        return (
            <MarketsDropdownWrapper
                body={body}
                header={header}
                ref={this._dropdown}
                shouldCloseDropdownOnClickOutside={!this.state.isUserOnDropdown}
                {...restProps}
            />
        );
    };

    private readonly _setUserOnDropdown = () => {
        this.setState({ isUserOnDropdown: true });
    };

    private readonly _removeUserOnDropdown = () => {
        this.setState({ isUserOnDropdown: false });
    };

    private readonly _getTokensFilterTabs = () => {
        return (
            <TokenFiltersTabs>
                {getMarketFilters().map((filter: Filter, index) => {
                    return (
                        <TokenFiltersTab
                            active={filter === this.state.selectedFilter}
                            key={index}
                            onClick={this._setTokensFilterTab.bind(this, filter)}
                        >
                            {filter.text}
                        </TokenFiltersTab>
                    );
                })}
            </TokenFiltersTabs>
        );
    };

    private readonly _setTokensFilterTab: any = (filter: Filter) => {
        this.setState({ selectedFilter: filter });
    };

    private readonly _getSearchField = () => {
        return (
            <SearchWrapper>
                <MagnifierIconWrapper>{MagnifierIcon()}</MagnifierIconWrapper>
                <SearchField onChange={this._handleChange} value={this.state.search} />
            </SearchWrapper>
        );
    };

    private readonly _handleChange = (e: any) => {
        const search = e.currentTarget.value;

        this.setState({
            search,
        });
    };

    private readonly _getMarkets = () => {
        const { baseToken, currencyPair, markets, marketsStats } = this.props;
        const { search, selectedFilter } = this.state;

        if (!baseToken || !markets) {
            return null;
        }

        const filteredMarkets =
            selectedFilter == null || selectedFilter.value === null
                ? markets
                : filterMarketsByTokenSymbol(markets, selectedFilter.value);
        const searchedMarkets = filterMarketsByString(filteredMarkets, search);

        return (
            <Table>
                <THead>
                    <TR>
                        <THFirstStyled styles={{ textAlign: 'left' }}>Market</THFirstStyled>
                        <THLastStyled styles={{ textAlign: 'center' }}>Last Price</THLastStyled>
                    </TR>
                </THead>
                <TBody>
                    {searchedMarkets.map((market, index) => {
                        const isActive =
                            market.currencyPair.base === currencyPair.base &&
                            market.currencyPair.quote === currencyPair.quote;
                        const setSelectedMarket = () => this._setSelectedMarket(market.currencyPair);
                        try {
                            const token = getKnownTokens().getTokenBySymbol(market.currencyPair.base);

                            const baseSymbol = formatTokenSymbol(market.currencyPair.base).toUpperCase();
                            const quoteSymbol = formatTokenSymbol(market.currencyPair.quote).toUpperCase();
                            const marketStats =
                                marketsStats &&
                                marketsStats.find(m => m.pair.toUpperCase() === marketToString(market.currencyPair));

                            return (
                                <TRStyled active={isActive} key={index} onClick={setSelectedMarket}>
                                    <CustomTDFirstStyled styles={{ textAlign: 'left', borderBottom: true }}>
                                        <TokenIconAndLabel>
                                            <TokenIcon
                                                symbol={token.symbol}
                                                primaryColor={token.primaryColor}
                                                icon={token.icon}
                                            />
                                            <TokenLabel>
                                                {baseSymbol} / {quoteSymbol}
                                            </TokenLabel>
                                        </TokenIconAndLabel>
                                    </CustomTDFirstStyled>
                                    <CustomTDLastStyled
                                        styles={{ textAlign: 'center', borderBottom: true, tabular: true }}
                                    >
                                        {this._getLastPrice(market, marketStats)}
                                    </CustomTDLastStyled>
                                </TRStyled>
                            );
                        } catch {
                            return null;
                        }
                    })}
                </TBody>
            </Table>
        );
    };

    private readonly _setSelectedMarket: any = (currencyPair: CurrencyPair) => {
        this.props.changeMarket(currencyPair);

        if (!this.props.currentRoute.includes(MARKET_MAKER_APP_BASE_PATH)) {
            this.props.goToHome();
        }

        if (this._dropdown.current) {
            this._dropdown.current.closeDropdown();
        }
    };

    private readonly _getLastPrice: any = (market: Market, marketStat: RelayerMarketStats) => {
        if (marketStat && marketStat.last_price) {
            return new BigNumber(marketStat.last_price).toFixed(market.currencyPair.config.pricePrecision);
        }

        return '-';
    };
}

const mapStateToProps = (state: StoreState): PropsToken => {
    return {
        baseToken: getBaseToken(state),
        currencyPair: getCurrencyPair(state),
        markets: getMarkets(state),
        marketsStats: getMarketsStats(state),
        currentRoute: getCurrentRoutePath(state),
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        changeMarket: (currencyPair: CurrencyPair) => dispatch(changeMarket(currencyPair)),
        goToHome: () => dispatch(goToHome()),
    };
};

const MarketsDropdownStatsContainer = withWindowWidth(
    connect(mapStateToProps, mapDispatchToProps)(MarketsDropdownStats),
);

export { MarketsDropdownStats, MarketsDropdownStatsContainer };
