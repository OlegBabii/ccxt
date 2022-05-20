'use strict';

//  ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const { ArgumentsRequired, ExchangeError, InvalidNonce, AuthenticationError, PermissionDenied, NotSupported } = require ('./base/errors');
const Precise = require ('./base/Precise');

//  ---------------------------------------------------------------------------

module.exports = class bit2c extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'bit2c',
            'name': 'Bit2C',
            'countries': [ 'IL' ], // Israel
            'rateLimit': 3000,
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': false,
                'swap': false,
                'future': false,
                'option': false,
                'addMargin': false,
                'cancelOrder': true,
                'createOrder': true,
                'createReduceOnlyOrder': false,
                'fetchBalance': true,
                'fetchBorrowRate': false,
                'fetchBorrowRateHistories': false,
                'fetchBorrowRateHistory': false,
                'fetchBorrowRates': false,
                'fetchBorrowRatesPerSymbol': false,
                'fetchDepositAddress': true,
                'fetchFundingHistory': false,
                'fetchFundingRate': false,
                'fetchFundingRateHistory': false,
                'fetchFundingRates': false,
                'fetchIndexOHLCV': false,
                'fetchLeverage': false,
                'fetchLeverageTiers': false,
                'fetchMarkOHLCV': false,
                'fetchMyTrades': true,
                'fetchOpenInterestHistory': false,
                'fetchOpenOrders': true,
                'fetchOrderBook': true,
                'fetchPosition': false,
                'fetchPositions': false,
                'fetchPositionsRisk': false,
                'fetchPremiumIndexOHLCV': false,
                'fetchTicker': true,
                'fetchTrades': true,
                'fetchTradingFee': false,
                'fetchTradingFees': true,
                'fetchTransfer': false,
                'fetchTransfers': false,
                'reduceMargin': false,
                'setLeverage': false,
                'setMarginMode': false,
                'setPositionMode': false,
                'transfer': false,
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/27766119-3593220e-5ece-11e7-8b3a-5a041f6bcc3f.jpg',
                'api': 'https://bit2c.co.il',
                'www': 'https://www.bit2c.co.il',
                'referral': 'https://bit2c.co.il/Aff/63bfed10-e359-420c-ab5a-ad368dab0baf',
                'doc': [
                    'https://www.bit2c.co.il/home/api',
                    'https://github.com/OferE/bit2c',
                ],
            },
            'api': {
                'public': {
                    'get': [
                        'Exchanges/{pair}/Ticker',
                        'Exchanges/{pair}/orderbook',
                        'Exchanges/{pair}/trades',
                        'Exchanges/{pair}/lasttrades',
                    ],
                },
                'private': {
                    'post': [
                        'Merchant/CreateCheckout',
                        'Funds/AddCoinFundsRequest',
                        'Order/AddFund',
                        'Order/AddOrder',
                        'Order/AddOrderMarketPriceBuy',
                        'Order/AddOrderMarketPriceSell',
                        'Order/CancelOrder',
                        'Order/AddCoinFundsRequest',
                        'Order/AddStopOrder',
                        'Payment/GetMyId',
                        'Payment/Send',
                        'Payment/Pay',
                    ],
                    'get': [
                        'Account/Balance',
                        'Account/Balance/v2',
                        'Order/MyOrders',
                        'Order/GetById',
                        'Order/AccountHistory',
                        'Order/OrderHistory',
                    ],
                },
            },
            'markets': {
                'BTC/NIS': { 'id': 'BtcNis', 'symbol': 'BTC/NIS', 'base': 'BTC', 'quote': 'NIS', 'baseId': 'Btc', 'quoteId': 'Nis', 'type': 'spot', 'spot': true },
                'ETH/NIS': { 'id': 'EthNis', 'symbol': 'ETH/NIS', 'base': 'ETH', 'quote': 'NIS', 'baseId': 'Eth', 'quoteId': 'Nis', 'type': 'spot', 'spot': true },
                'BCH/NIS': { 'id': 'BchabcNis', 'symbol': 'BCH/NIS', 'base': 'BCH', 'quote': 'NIS', 'baseId': 'Bchabc', 'quoteId': 'Nis', 'type': 'spot', 'spot': true },
                'LTC/NIS': { 'id': 'LtcNis', 'symbol': 'LTC/NIS', 'base': 'LTC', 'quote': 'NIS', 'baseId': 'Ltc', 'quoteId': 'Nis', 'type': 'spot', 'spot': true },
                'ETC/NIS': { 'id': 'EtcNis', 'symbol': 'ETC/NIS', 'base': 'ETC', 'quote': 'NIS', 'baseId': 'Etc', 'quoteId': 'Nis', 'type': 'spot', 'spot': true },
                'BTG/NIS': { 'id': 'BtgNis', 'symbol': 'BTG/NIS', 'base': 'BTG', 'quote': 'NIS', 'baseId': 'Btg', 'quoteId': 'Nis', 'type': 'spot', 'spot': true },
                'BSV/NIS': { 'id': 'BchsvNis', 'symbol': 'BSV/NIS', 'base': 'BSV', 'quote': 'NIS', 'baseId': 'Bchsv', 'quoteId': 'Nis', 'type': 'spot', 'spot': true },
                'GRIN/NIS': { 'id': 'GrinNis', 'symbol': 'GRIN/NIS', 'base': 'GRIN', 'quote': 'NIS', 'baseId': 'Grin', 'quoteId': 'Nis', 'type': 'spot', 'spot': true },
            },
            'fees': {
                'trading': {
                    'maker': this.parseNumber ('0.005'),
                    'taker': this.parseNumber ('0.005'),
                },
            },
            'options': {
                'fetchTradesMethod': 'public_get_exchanges_pair_trades',
            },
            'exceptions': {
                'exact': {
                    'Please provide valid APIkey': AuthenticationError, // { "error" : "Please provide valid APIkey" }
                },
                'broad': {
                    // { "error": "Please provide valid nonce in Request Nonce (1598218490) is not bigger than last nonce (1598218490)."}
                    // { "error": "Please provide valid nonce in Request UInt64.TryParse failed for nonce :" }
                    'Please provide valid nonce': InvalidNonce,
                    'please approve new terms of use on site': PermissionDenied, // { "error" : "please approve new terms of use on site." }
                },
            },
        });
    }

    parseBalance (response) {
        const result = {
            'info': response,
            'timestamp': undefined,
            'datetime': undefined,
        };
        const codes = Object.keys (this.currencies);
        for (let i = 0; i < codes.length; i++) {
            const code = codes[i];
            const account = this.account ();
            const currency = this.currency (code);
            const uppercase = currency['id'].toUpperCase ();
            if (uppercase in response) {
                account['free'] = this.safeString (response, 'AVAILABLE_' + uppercase);
                account['total'] = this.safeString (response, uppercase);
            }
            result[code] = account;
        }
        return this.safeBalance (result);
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        const response = await this.privateGetAccountBalanceV2 (params);
        //
        //     {
        //         "AVAILABLE_NIS": 0.0,
        //         "NIS": 0.0,
        //         "LOCKED_NIS": 0.0,
        //         "AVAILABLE_BTC": 0.0,
        //         "BTC": 0.0,
        //         "LOCKED_BTC": 0.0,
        //         "AVAILABLE_ETH": 0.0,
        //         "ETH": 0.0,
        //         "LOCKED_ETH": 0.0,
        //         "AVAILABLE_BCHSV": 0.0,
        //         "BCHSV": 0.0,
        //         "LOCKED_BCHSV": 0.0,
        //         "AVAILABLE_BCHABC": 0.0,
        //         "BCHABC": 0.0,
        //         "LOCKED_BCHABC": 0.0,
        //         "AVAILABLE_LTC": 0.0,
        //         "LTC": 0.0,
        //         "LOCKED_LTC": 0.0,
        //         "AVAILABLE_ETC": 0.0,
        //         "ETC": 0.0,
        //         "LOCKED_ETC": 0.0,
        //         "AVAILABLE_BTG": 0.0,
        //         "BTG": 0.0,
        //         "LOCKED_BTG": 0.0,
        //         "AVAILABLE_GRIN": 0.0,
        //         "GRIN": 0.0,
        //         "LOCKED_GRIN": 0.0,
        //         "Fees": {
        //             "BtcNis": { "FeeMaker": 1.0, "FeeTaker": 1.0 },
        //             "EthNis": { "FeeMaker": 1.0, "FeeTaker": 1.0 },
        //             "BchabcNis": { "FeeMaker": 1.0, "FeeTaker": 1.0 },
        //             "LtcNis": { "FeeMaker": 1.0, "FeeTaker": 1.0 },
        //             "EtcNis": { "FeeMaker": 1.0, "FeeTaker": 1.0 },
        //             "BtgNis": { "FeeMaker": 1.0, "FeeTaker": 1.0 },
        //             "LtcBtc": { "FeeMaker": 1.0, "FeeTaker": 1.0 },
        //             "BchsvNis": { "FeeMaker": 1.0, "FeeTaker": 1.0 },
        //             "GrinNis": { "FeeMaker": 1.0, "FeeTaker": 1.0 }
        //         }
        //     }
        //
        return this.parseBalance (response);
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        /**
         * @method
         * @name bit2c#fetchOrderBook
         * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @param {str} symbol unified symbol of the market to fetch the order book for
         * @param {int|undefined} limit the maximum amount of order book entries to return
         * @param {dict} params extra parameters specific to the bit2c api endpoint
         * @returns {dict} A dictionary of [order book structures]{@link https://docs.ccxt.com/en/latest/manual.html#order-book-structure} indexed by market symbols
         */
        await this.loadMarkets ();
        const request = {
            'pair': this.marketId (symbol),
        };
        const orderbook = await this.publicGetExchangesPairOrderbook (this.extend (request, params));
        return this.parseOrderBook (orderbook, symbol);
    }

    parseTicker (ticker, market = undefined) {
        const symbol = this.safeSymbol (undefined, market);
        const timestamp = this.milliseconds ();
        const averagePrice = this.safeString (ticker, 'av');
        const baseVolume = this.safeString (ticker, 'a');
        const last = this.safeString (ticker, 'll');
        return this.safeTicker ({
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': undefined,
            'low': undefined,
            'bid': this.safeString (ticker, 'h'),
            'bidVolume': undefined,
            'ask': this.safeString (ticker, 'l'),
            'askVolume': undefined,
            'vwap': undefined,
            'open': undefined,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': undefined,
            'percentage': undefined,
            'average': averagePrice,
            'baseVolume': baseVolume,
            'quoteVolume': undefined,
            'info': ticker,
        }, market, false);
    }

    async fetchTicker (symbol, params = {}) {
        /**
         * @method
         * @name bit2c#fetchTicker
         * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
         * @param {str} symbol unified symbol of the market to fetch the ticker for
         * @param {dict} params extra parameters specific to the bit2c api endpoint
         * @returns {dict} a [ticker structure]{@link https://docs.ccxt.com/en/latest/manual.html#ticker-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'pair': market['id'],
        };
        const response = await this.publicGetExchangesPairTicker (this.extend (request, params));
        return this.parseTicker (response, market);
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const method = this.options['fetchTradesMethod']; // public_get_exchanges_pair_trades or public_get_exchanges_pair_lasttrades
        const request = {
            'pair': market['id'],
        };
        if (since !== undefined) {
            request['date'] = parseInt (since);
        }
        if (limit !== undefined) {
            request['limit'] = limit; // max 100000
        }
        const response = await this[method] (this.extend (request, params));
        //
        //     [
        //         {"date":1651785980,"price":127975.68,"amount":0.3750321,"isBid":true,"tid":1261018},
        //         {"date":1651785980,"price":127987.70,"amount":0.0389527820303982335802581029,"isBid":true,"tid":1261020},
        //         {"date":1651786701,"price":128084.03,"amount":0.0015614749161156156626239821,"isBid":true,"tid":1261022},
        //     ]
        //
        if (typeof response === 'string') {
            throw new ExchangeError (response);
        }
        return this.parseTrades (response, market, since, limit);
    }

    async fetchTradingFees (params = {}) {
        await this.loadMarkets ();
        const response = await this.privateGetAccountBalance (params);
        //
        //     {
        //         "AVAILABLE_NIS": 0.0,
        //         "NIS": 0.0,
        //         "LOCKED_NIS": 0.0,
        //         "AVAILABLE_BTC": 0.0,
        //         "BTC": 0.0,
        //         "LOCKED_BTC": 0.0,
        //         ...
        //         "Fees": {
        //             "BtcNis": { "FeeMaker": 1.0, "FeeTaker": 1.0 },
        //             "EthNis": { "FeeMaker": 1.0, "FeeTaker": 1.0 },
        //             ...
        //         }
        //     }
        //
        const fees = this.safeValue (response, 'Fees', {});
        const keys = Object.keys (fees);
        const result = {};
        for (let i = 0; i < keys.length; i++) {
            const marketId = keys[i];
            const symbol = this.safeSymbol (marketId);
            const fee = this.safeValue (fees, marketId);
            const makerString = this.safeString (fee, 'FeeMaker');
            const takerString = this.safeString (fee, 'FeeTaker');
            const maker = this.parseNumber (Precise.stringDiv (makerString, '100'));
            const taker = this.parseNumber (Precise.stringDiv (takerString, '100'));
            result[symbol] = {
                'info': fee,
                'symbol': symbol,
                'taker': taker,
                'maker': maker,
                'percentage': true,
                'tierBased': false,
            };
        }
        return result;
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        await this.loadMarkets ();
        let method = 'privatePostOrderAddOrder';
        const request = {
            'Amount': amount,
            'Pair': this.marketId (symbol),
        };
        if (type === 'market') {
            method += 'MarketPrice' + this.capitalize (side);
        } else {
            request['Price'] = price;
            request['Total'] = amount * price;
            request['IsBid'] = (side === 'buy');
        }
        const response = await this[method] (this.extend (request, params));
        return {
            'info': response,
            'id': response['NewOrder']['id'],
        };
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        const request = {
            'id': id,
        };
        return await this.privatePostOrderCancelOrder (this.extend (request, params));
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOpenOrders() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'pair': market['id'],
        };
        const response = await this.privateGetOrderMyOrders (this.extend (request, params));
        const orders = this.safeValue (response, market['id'], {});
        const asks = this.safeValue (orders, 'ask', []);
        const bids = this.safeValue (orders, 'bid', []);
        return this.parseOrders (this.arrayConcat (asks, bids), market, since, limit);
    }

    parseOrder (order, market = undefined) {
        const timestamp = this.safeInteger (order, 'created');
        const price = this.safeString (order, 'price');
        const amount = this.safeString (order, 'amount');
        market = this.safeMarket (undefined, market);
        let side = this.safeValue (order, 'type');
        if (side === 0) {
            side = 'buy';
        } else if (side === 1) {
            side = 'sell';
        }
        const id = this.safeString (order, 'id');
        const status = this.safeString (order, 'status');
        return this.safeOrder ({
            'id': id,
            'clientOrderId': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'status': status,
            'symbol': market['symbol'],
            'type': undefined,
            'timeInForce': undefined,
            'postOnly': undefined,
            'side': side,
            'price': price,
            'stopPrice': undefined,
            'amount': amount,
            'filled': undefined,
            'remaining': undefined,
            'cost': undefined,
            'trades': undefined,
            'fee': undefined,
            'info': order,
            'average': undefined,
        }, market);
    }

    async fetchMyTrades (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let market = undefined;
        const request = {};
        if (limit !== undefined) {
            request['take'] = limit;
        }
        request['take'] = limit;
        if (since !== undefined) {
            request['toTime'] = this.yyyymmdd (this.milliseconds (), '.');
            request['fromTime'] = this.yyyymmdd (since, '.');
        }
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['pair'] = market['id'];
        }
        const response = await this.privateGetOrderOrderHistory (this.extend (request, params));
        //
        //     [
        //         {
        //             "ticks":1574767951,
        //             "created":"26/11/19 13:32",
        //             "action":1,
        //             "price":"1000",
        //             "pair":"EthNis",
        //             "reference":"EthNis|10867390|10867377",
        //             "fee":"0.5",
        //             "feeAmount":"0.08",
        //             "feeCoin":"₪",
        //             "firstAmount":"-0.015",
        //             "firstAmountBalance":"9",
        //             "secondAmount":"14.93",
        //             "secondAmountBalance":"130,233.28",
        //             "firstCoin":"ETH",
        //             "secondCoin":"₪"
        //         },
        //         {
        //             "ticks":1574767951,
        //             "created":"26/11/19 13:32",
        //             "action":0,
        //             "price":"1000",
        //             "pair":"EthNis",
        //             "reference":"EthNis|10867390|10867377",
        //             "fee":"0.5",
        //             "feeAmount":"0.08",
        //             "feeCoin":"₪",
        //             "firstAmount":"0.015",
        //             "firstAmountBalance":"9.015",
        //             "secondAmount":"-15.08",
        //             "secondAmountBalance":"130,218.35",
        //             "firstCoin":"ETH",
        //             "secondCoin":"₪"
        //         }
        //     ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    parseTrade (trade, market = undefined) {
        //
        // public fetchTrades
        //
        //     {
        //         "date":1651785980,
        //         "price":127975.68,
        //         "amount":0.3750321,
        //         "isBid":true,
        //         "tid":1261018
        //     }
        //
        // private fetchMyTrades
        //
        //     {
        //         "ticks":1574767951,
        //         "created":"26/11/19 13:32",
        //         "action":1,
        //         "price":"1000",
        //         "pair":"EthNis",
        //         "reference":"EthNis|10867390|10867377",
        //         "fee":"0.5",
        //         "feeAmount":"0.08",
        //         "feeCoin":"₪",
        //         "firstAmount":"-0.015",
        //         "firstAmountBalance":"9",
        //         "secondAmount":"14.93",
        //         "secondAmountBalance":"130,233.28",
        //         "firstCoin":"ETH",
        //         "secondCoin":"₪"
        //     }
        //
        let timestamp = undefined;
        let id = undefined;
        let price = undefined;
        let amount = undefined;
        let orderId = undefined;
        let fee = undefined;
        let side = undefined;
        const reference = this.safeString (trade, 'reference');
        if (reference !== undefined) {
            timestamp = this.safeTimestamp (trade, 'ticks');
            price = this.safeString (trade, 'price');
            amount = this.safeString (trade, 'firstAmount');
            const reference_parts = reference.split ('|'); // reference contains 'pair|orderId|tradeId'
            const marketId = this.safeString (trade, 'pair');
            market = this.safeMarket (marketId, market);
            market = this.safeMarket (reference_parts[0], market);
            orderId = reference_parts[1];
            id = reference_parts[2];
            side = this.safeInteger (trade, 'action');
            if (side === 0) {
                side = 'buy';
            } else if (side === 1) {
                side = 'sell';
            }
            const feeCost = this.safeString (trade, 'feeAmount');
            if (feeCost !== undefined) {
                fee = {
                    'cost': feeCost,
                    'currency': 'NIS',
                };
            }
        } else {
            timestamp = this.safeTimestamp (trade, 'date');
            id = this.safeString (trade, 'tid');
            price = this.safeString (trade, 'price');
            amount = this.safeString (trade, 'amount');
            side = this.safeValue (trade, 'isBid');
            if (side !== undefined) {
                if (side) {
                    side = 'buy';
                } else {
                    side = 'sell';
                }
            }
        }
        market = this.safeMarket (undefined, market);
        return this.safeTrade ({
            'info': trade,
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': market['symbol'],
            'order': orderId,
            'type': undefined,
            'side': side,
            'takerOrMaker': undefined,
            'price': price,
            'amount': amount,
            'cost': undefined,
            'fee': fee,
        }, market);
    }

    isFiat (code) {
        return code === 'NIS';
    }

    async fetchDepositAddress (code, params = {}) {
        await this.loadMarkets ();
        const currency = this.currency (code);
        if (this.isFiat (code)) {
            throw new NotSupported (this.id + ' fetchDepositAddress() does not support fiat currencies');
        }
        const request = {
            'Coin': currency['id'],
        };
        const response = await this.privatePostFundsAddCoinFundsRequest (this.extend (request, params));
        //
        //     {
        //         'address': '0xf14b94518d74aff2b1a6d3429471bcfcd3881d42',
        //         'hasTx': False
        //     }
        //
        return this.parseDepositAddress (response, currency);
    }

    parseDepositAddress (depositAddress, currency = undefined) {
        //
        //     {
        //         'address': '0xf14b94518d74aff2b1a6d3429471bcfcd3881d42',
        //         'hasTx': False
        //     }
        //
        const address = this.safeString (depositAddress, 'address');
        this.checkAddress (address);
        const code = this.safeCurrencyCode (undefined, currency);
        return {
            'currency': code,
            'network': undefined,
            'address': address,
            'tag': undefined,
            'info': depositAddress,
        };
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = this.urls['api'] + '/' + this.implodeParams (path, params);
        if (api === 'public') {
            url += '.json';
        } else {
            this.checkRequiredCredentials ();
            const nonce = this.nonce ();
            const query = this.extend ({
                'nonce': nonce,
            }, params);
            const auth = this.urlencode (query);
            if (method === 'GET') {
                if (Object.keys (query).length) {
                    url += '?' + auth;
                }
            } else {
                body = auth;
            }
            const signature = this.hmac (this.encode (auth), this.encode (this.secret), 'sha512', 'base64');
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'key': this.apiKey,
                'sign': signature,
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (httpCode, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return; // fallback to default error handler
        }
        //
        //     { "error" : "please approve new terms of use on site." }
        //     { "error": "Please provide valid nonce in Request Nonce (1598218490) is not bigger than last nonce (1598218490)."}
        //
        const error = this.safeString (response, 'error');
        if (error !== undefined) {
            const feedback = this.id + ' ' + body;
            this.throwExactlyMatchedException (this.exceptions['exact'], error, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], error, feedback);
            throw new ExchangeError (feedback); // unknown message
        }
    }
};

