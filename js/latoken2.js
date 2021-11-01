'use strict';

//  ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const { ExchangeError, ArgumentsRequired, InvalidNonce, OrderNotFound, InvalidOrder, DDoSProtection, BadRequest, AuthenticationError } = require ('./base/errors');
const Precise = require ('./base/Precise');

//  ---------------------------------------------------------------------------

module.exports = class latoken extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'latoken',
            'name': 'Latoken',
            'countries': [ 'KY' ], // Cayman Islands
            'version': 'v2',
            'rateLimit': 2000,
            'certified': false,
            'userAgent': this.userAgents['chrome'],
            'has': {
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/61511972-24c39f00-aa01-11e9-9f7c-471f1d6e5214.jpg',
                'api': 'https://api.latoken.com',
                'www': 'https://latoken.com',
                'doc': [
                    'https://api.latoken.com',
                ],
            },
            'api': {
                'public': {
                    'get': {
                        'book/{currency}/{quote}': 1,
                        'chart/week': 1,
                        'chart/week/{currency}/{quote}': 1,
                        'currency': 1,
                        'currency/available': 1,
                        'currency/quotes': 1,
                        'currency/{currency}': 1,
                        'pair': 1,
                        'pair/available': 1,
                        'ticker': 1,
                        'ticker/{base}/{quote}': 1,
                        'time': 1,
                        'trade/history/{currency}/{quote}': 1,
                        'trade/fee/{currency}/{quote}': 1,
                        'trade/feeLevels': 1,
                        'transaction/bindings': 1,
                    },
                },
                'private': {
                    'get': {
                        'auth/account': 1,
                        'auth/account/currency/{currency}/{type}': 1,
                        'auth/order': 1,
                        'auth/order/getOrder/{id}': 1,
                        'auth/order/pair/{currency}/{quote}': 1,
                        'auth/order/pair/{currency}/{quote}/active': 1,
                        'auth/stopOrder': 1,
                        'auth/stopOrder/getOrder/{id}': 1,
                        'auth/stopOrder/pair/{currency}/{quote}': 1,
                        'auth/stopOrder/pair/{currency}/{quote}/active': 1,
                        'auth/trade': 1,
                        'auth/trade/pair/{currency}/{quote}': 1,
                        'auth/trade/fee/{currency}/{quote}': 1,
                        'auth/transaction': 1,
                        'auth/transaction/bindings': 1,
                        'auth/transaction/bindings/{currency}': 1,
                        'auth/transaction/{id}': 1,
                        'auth/transfer': 1,
                    },
                    'post': {
                        'auth/order/cancel': 1,
                        'auth/order/cancelAll': 1,
                        'auth/order/cancelAll/{currency}/{quote}': 1,
                        'auth/order/place': 1,
                        'auth/spot/deposit': 1,
                        'auth/spot/withdraw': 1,
                        'auth/stopOrder/cancel': 1,
                        'auth/stopOrder/cancelAll': 1,
                        'auth/stopOrder/cancelAll/{currency}/{quote}': 1,
                        'auth/stopOrder/place': 1,
                        'auth/transaction/depositAddress': 1,
                        'auth/transaction/withdraw': 1,
                        'auth/transaction/withdraw/cancel': 1,
                        'auth/transaction/withdraw/confirm': 1,
                        'auth/transaction/withdraw/resendCode': 1,
                        'auth/transfer/email': 1,
                        'auth/transfer/id': 1,
                        'auth/transfer/phone': 1,
                    },
                },
            },
            'fees': {
                'trading': {
                    'feeSide': 'get',
                    'tierBased': false,
                    'percentage': true,
                    'maker': this.parseNumber ('0.001'),
                    'taker': this.parseNumber ('0.001'),
                },
            },
            'commonCurrencies': {
                'MT': 'Monarch',
                'TPAY': 'Tetra Pay',
                'TSL': 'Treasure SL',
            },
            'options': {
            },
            'exceptions': {
                'exact': {
                    // INTERNAL_ERROR - internal server error. You can contact our support to solve this problem.
                    // SERVICE_UNAVAILABLE - requested information currently not available. You can contact our support to solve this problem or retry later.
                    // NOT_AUTHORIZED - user's query not authorized. Check if you are logged in.
                    // FORBIDDEN - you don't have enough access rights.
                    // BAD_REQUEST - some bad request, for example bad fields values or something else. Read response message for more information.
                    // NOT_FOUND - entity not found. Read message for more information.
                    // ACCESS_DENIED - access is denied. Probably you don't have enough access rights, you contact our support.
                    // REQUEST_REJECTED - user's request rejected for some reasons. Check error message.
                    // HTTP_MEDIA_TYPE_NOT_SUPPORTED - http media type not supported.
                    // MEDIA_TYPE_NOT_ACCEPTABLE - media type not acceptable
                    // METHOD_ARGUMENT_NOT_VALID - one of method argument is invalid. Check argument types and error message for more information.
                    // VALIDATION_ERROR - check errors field to get reasons.
                    // ACCOUNT_EXPIRED - restore your account or create a new one.
                    // BAD_CREDENTIALS - invalid username or password.
                    // COOKIE_THEFT - cookie has been stolen. Let's try reset your cookies.
                    // CREDENTIALS_EXPIRED - credentials expired.
                    // INSUFFICIENT_AUTHENTICATION - for example, 2FA required.
                    // UNKNOWN_LOCATION - user logged from unusual location, email confirmation required.
                    // TOO_MANY_REQUESTS - too many requests at the time. A response header X-Rate-Limit-Remaining indicates the number of allowed request per a period.
                },
                'broad': {
                },
            },
        });
    }

    nonce () {
        return this.milliseconds ();
    }

    async fetchTime (params = {}) {
        const response = await this.publicGetExchangeInfoTime (params);
        //
        //     {
        //         "time": "2019-04-18T9:00:00.0Z",
        //         "unixTimeSeconds": 1555578000,
        //         "unixTimeMiliseconds": 1555578000000
        //     }
        //
        return this.safeInteger (response, 'unixTimeMiliseconds');
    }

    async fetchMarkets (params = {}) {
        const response = await this.publicGetExchangeInfoPairs (params);
        //
        //     [
        //         {
        //             "pairId": 502,
        //             "symbol": "LAETH",
        //             "baseCurrency": "LA",
        //             "quotedCurrency": "ETH",
        //             "makerFee": 0.01,
        //             "takerFee": 0.01,
        //             "pricePrecision": 8,
        //             "amountPrecision": 8,
        //             "minQty": 0.1
        //         }
        //     ]
        //
        const result = [];
        for (let i = 0; i < response.length; i++) {
            const market = response[i];
            const id = this.safeString (market, 'symbol');
            // the exchange shows them inverted
            const baseId = this.safeString (market, 'baseCurrency');
            const quoteId = this.safeString (market, 'quotedCurrency');
            const numericId = this.safeInteger (market, 'pairId');
            const base = this.safeCurrencyCode (baseId);
            const quote = this.safeCurrencyCode (quoteId);
            const symbol = base + '/' + quote;
            const pricePrecisionString = this.safeString (market, 'pricePrecision');
            const priceLimit = this.parsePrecision (pricePrecisionString);
            const precision = {
                'price': parseInt (pricePrecisionString),
                'amount': this.safeInteger (market, 'amountPrecision'),
            };
            const limits = {
                'amount': {
                    'min': this.safeNumber (market, 'minQty'),
                    'max': undefined,
                },
                'price': {
                    'min': this.parseNumber (priceLimit),
                    'max': undefined,
                },
                'cost': {
                    'min': undefined,
                    'max': undefined,
                },
            };
            result.push ({
                'id': id,
                'numericId': numericId,
                'info': market,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'type': 'spot',
                'spot': true,
                'active': undefined, // assuming true
                'precision': precision,
                'limits': limits,
            });
        }
        return result;
    }

    async fetchCurrencies (params = {}) {
        const response = await this.publicGetExchangeInfoCurrencies (params);
        //
        //     [
        //         {
        //             "currencyId": 102,
        //             "symbol": "LA",
        //             "name": "Latoken",
        //             "precission": 8,
        //             "type": "ERC20",
        //             "fee": 0.1
        //         }
        //     ]
        //
        const result = {};
        for (let i = 0; i < response.length; i++) {
            const currency = response[i];
            const id = this.safeString (currency, 'symbol');
            const numericId = this.safeInteger (currency, 'currencyId');
            const code = this.safeCurrencyCode (id);
            const precision = this.safeInteger (currency, 'precission');
            const fee = this.safeNumber (currency, 'fee');
            const active = undefined;
            result[code] = {
                'id': id,
                'numericId': numericId,
                'code': code,
                'info': currency,
                'name': code,
                'active': active,
                'fee': fee,
                'precision': precision,
                'limits': {
                    'amount': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'withdraw': {
                        'min': undefined,
                        'max': undefined,
                    },
                },
            };
        }
        return result;
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        const response = await this.privateGetAccountBalances (params);
        //
        //     [
        //         {
        //             "currencyId": 102,
        //             "symbol": "LA",
        //             "name": "Latoken",
        //             "amount": 1054.66,
        //             "available": 900.66,
        //             "frozen": 154,
        //             "pending": 0
        //         }
        //     ]
        //
        const result = {
            'info': response,
            'timestamp': undefined,
            'datetime': undefined,
        };
        for (let i = 0; i < response.length; i++) {
            const balance = response[i];
            const currencyId = this.safeString (balance, 'symbol');
            const code = this.safeCurrencyCode (currencyId);
            const frozen = this.safeString (balance, 'frozen');
            const pending = this.safeString (balance, 'pending');
            const account = this.account ();
            account['used'] = Precise.stringAdd (frozen, pending);
            account['free'] = this.safeString (balance, 'available');
            account['total'] = this.safeString (balance, 'amount');
            result[code] = account;
        }
        return this.parseBalance (result);
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            'limit': 10,
        };
        if (limit !== undefined) {
            request['limit'] = limit; // default 10, max 100
        }
        const response = await this.publicGetMarketDataOrderBookSymbolLimit (this.extend (request, params));
        //
        //     {
        //         "pairId": 502,
        //         "symbol": "LAETH",
        //         "spread": 0.07,
        //         "asks": [
        //             { "price": 136.3, "quantity": 7.024 }
        //         ],
        //         "bids": [
        //             { "price": 136.2, "quantity": 6.554 }
        //         ]
        //     }
        //
        return this.parseOrderBook (response, symbol, undefined, 'bids', 'asks', 'price', 'quantity');
    }

    parseTicker (ticker, market = undefined) {
        //
        //     {
        //         "pairId":"63b41092-f3f6-4ea4-9e7c-4525ed250dad",
        //         "symbol":"ETHBTC",
        //         "volume":11317.037494474000000000,
        //         "open":0.020033000000000000,
        //         "low":0.019791000000000000,
        //         "high":0.020375000000000000,
        //         "close":0.019923000000000000,
        //         "priceChange":-0.1500
        //     }
        //
        const marketId = this.safeString (ticker, 'symbol');
        const symbol = this.safeSymbol (marketId, market);
        const open = this.safeNumber (ticker, 'open');
        const close = this.safeNumber (ticker, 'close');
        let change = undefined;
        if (open !== undefined && close !== undefined) {
            change = close - open;
        }
        const percentage = this.safeNumber (ticker, 'priceChange');
        const timestamp = this.nonce ();
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'low': this.safeNumber (ticker, 'low'),
            'high': this.safeNumber (ticker, 'high'),
            'bid': undefined,
            'bidVolume': undefined,
            'ask': undefined,
            'askVolume': undefined,
            'vwap': undefined,
            'open': open,
            'close': close,
            'last': close,
            'previousClose': undefined,
            'change': change,
            'percentage': percentage,
            'average': undefined,
            'baseVolume': undefined,
            'quoteVolume': this.safeNumber (ticker, 'volume'),
            'info': ticker,
        };
    }

    async fetchTicker (symbol, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        const response = await this.publicGetMarketDataTickerSymbol (this.extend (request, params));
        //
        //     {
        //         "pairId": 502,
        //         "symbol": "LAETH",
        //         "volume": 1023314.3202,
        //         "open": 134.82,
        //         "low": 133.95,
        //         "high": 136.22,
        //         "close": 135.12,
        //         "priceChange": 0.22
        //     }
        //
        return this.parseTicker (response, market);
    }

    async fetchTickers (symbols = undefined, params = {}) {
        await this.loadMarkets ();
        const response = await this.publicGetMarketDataTickers (params);
        //
        //     [
        //         {
        //             "pairId": 502,
        //             "symbol": "LAETH",
        //             "volume": 1023314.3202,
        //             "open": 134.82,
        //             "low": 133.95,
        //             "high": 136.22,
        //             "close": 135.12,
        //             "priceChange": 0.22
        //         }
        //     ]
        //
        const result = {};
        for (let i = 0; i < response.length; i++) {
            const ticker = this.parseTicker (response[i]);
            const symbol = ticker['symbol'];
            result[symbol] = ticker;
        }
        return this.filterByArray (result, 'symbol', symbols);
    }

    parseTrade (trade, market = undefined) {
        //
        // fetchTrades (public)
        //
        //     {
        //         side: 'buy',
        //         price: 0.33634,
        //         amount: 0.01,
        //         timestamp: 1564240008000 // milliseconds
        //     }
        //
        // fetchMyTrades (private)
        //
        //     {
        //         id: '1564223032.892829.3.tg15',
        //         orderId: '1564223032.671436.707548@1379:1',
        //         commission: 0,
        //         side: 'buy',
        //         price: 0.32874,
        //         amount: 0.607,
        //         timestamp: 1564223033 // seconds
        //     }
        //
        const type = undefined;
        let timestamp = this.safeInteger2 (trade, 'timestamp', 'time');
        if (timestamp !== undefined) {
            // 03 Jan 2009 - first block
            if (timestamp < 1230940800000) {
                timestamp *= 1000;
            }
        }
        const priceString = this.safeString (trade, 'price');
        const amountString = this.safeString (trade, 'amount');
        const price = this.parseNumber (priceString);
        const amount = this.parseNumber (amountString);
        const cost = this.parseNumber (Precise.stringMul (priceString, amountString));
        const side = this.safeString (trade, 'side');
        let symbol = undefined;
        if (market !== undefined) {
            symbol = market['symbol'];
        }
        const id = this.safeString (trade, 'id');
        const orderId = this.safeString (trade, 'orderId');
        const feeCost = this.safeNumber (trade, 'commission');
        let fee = undefined;
        if (feeCost !== undefined) {
            fee = {
                'cost': feeCost,
                'currency': undefined,
            };
        }
        return {
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'id': id,
            'order': orderId,
            'type': type,
            'takerOrMaker': undefined,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': cost,
            'fee': fee,
        };
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['limit'] = limit; // default 50, max 100
        }
        const response = await this.publicGetMarketDataTradesSymbol (this.extend (request, params));
        //
        //     {
        //         "pairId":370,
        //         "symbol":"ETHBTC",
        //         "tradeCount":51,
        //         "trades": [
        //             {
        //                 side: 'buy',
        //                 price: 0.33634,
        //                 amount: 0.01,
        //                 timestamp: 1564240008000 // milliseconds
        //             }
        //         ]
        //     }
        //
        const trades = this.safeValue (response, 'trades', []);
        return this.parseTrades (trades, market, since, limit);
    }

    async fetchMyTrades (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchMyTrades() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        const response = await this.privateGetOrderTrades (this.extend (request, params));
        //
        //     {
        //         "pairId": 502,
        //         "symbol": "LAETH",
        //         "tradeCount": 1,
        //         "trades": [
        //             {
        //                 id: '1564223032.892829.3.tg15',
        //                 orderId: '1564223032.671436.707548@1379:1',
        //                 commission: 0,
        //                 side: 'buy',
        //                 price: 0.32874,
        //                 amount: 0.607,
        //                 timestamp: 1564223033 // seconds
        //             }
        //         ]
        //     }
        //
        const trades = this.safeValue (response, 'trades', []);
        return this.parseTrades (trades, market, since, limit);
    }

    parseOrderStatus (status) {
        const statuses = {
            'active': 'open',
            'partiallyFilled': 'open',
            'filled': 'closed',
            'cancelled': 'canceled',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrder (order, market = undefined) {
        //
        // createOrder
        //
        //     {
        //         "orderId":"1563460093.134037.704945@0370:2",
        //         "cliOrdId":"",
        //         "pairId":370,
        //         "symbol":"ETHBTC",
        //         "side":"sell",
        //         "orderType":"limit",
        //         "price":1.0,
        //         "amount":1.0
        //     }
        //
        // cancelOrder, fetchOrder, fetchOpenOrders, fetchClosedOrders, fetchCanceledOrders
        //
        //     {
        //         "orderId": "1555492358.126073.126767@0502:2",
        //         "cliOrdId": "myNewOrder",
        //         "pairId": 502,
        //         "symbol": "LAETH",
        //         "side": "buy",
        //         "orderType": "limit",
        //         "price": 136.2,
        //         "amount": 0.57,
        //         "orderStatus": "partiallyFilled",
        //         "executedAmount": 0.27,
        //         "reaminingAmount": 0.3,
        //         "timeCreated": 155551580736,
        //         "timeFilled": 0
        //     }
        //
        const id = this.safeString (order, 'orderId');
        const timestamp = this.safeTimestamp (order, 'timeCreated');
        const marketId = this.safeString (order, 'symbol');
        const symbol = this.safeSymbol (marketId, market);
        const side = this.safeString (order, 'side');
        const type = this.safeString (order, 'orderType');
        const price = this.safeNumber (order, 'price');
        const amount = this.safeNumber (order, 'amount');
        const filled = this.safeNumber (order, 'executedAmount');
        const status = this.parseOrderStatus (this.safeString (order, 'orderStatus'));
        const timeFilled = this.safeTimestamp (order, 'timeFilled');
        let lastTradeTimestamp = undefined;
        if ((timeFilled !== undefined) && (timeFilled > 0)) {
            lastTradeTimestamp = timeFilled;
        }
        const clientOrderId = this.safeString (order, 'cliOrdId');
        return this.safeOrder ({
            'id': id,
            'clientOrderId': clientOrderId,
            'info': order,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': lastTradeTimestamp,
            'status': status,
            'symbol': symbol,
            'type': type,
            'timeInForce': undefined,
            'postOnly': undefined,
            'side': side,
            'price': price,
            'stopPrice': undefined,
            'cost': undefined,
            'amount': amount,
            'filled': filled,
            'average': undefined,
            'remaining': undefined,
            'fee': undefined,
            'trades': undefined,
        });
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        return this.fetchOrdersWithMethod ('private_get_order_active', symbol, since, limit, params);
    }

    async fetchClosedOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        return this.fetchOrdersByStatus ('filled', symbol, since, limit, params);
    }

    async fetchCanceledOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        return this.fetchOrdersByStatus ('cancelled', symbol, since, limit, params);
    }

    async fetchOrdersByStatus (status, symbol = undefined, since = undefined, limit = undefined, params = {}) {
        const request = {
            'status': status,
        };
        return this.fetchOrdersWithMethod ('private_get_order_status', symbol, since, limit, this.extend (request, params));
    }

    async fetchOrdersWithMethod (method, symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOrdersWithMethod() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['limit'] = limit; // default 100
        }
        const response = await this[method] (this.extend (request, params));
        //
        //     [
        //         {
        //             "orderId": "1555492358.126073.126767@0502:2",
        //             "cliOrdId": "myNewOrder",
        //             "pairId": 502,
        //             "symbol": "LAETH",
        //             "side": "buy",
        //             "orderType": "limit",
        //             "price": 136.2,
        //             "amount": 0.57,
        //             "orderStatus": "partiallyFilled",
        //             "executedAmount": 0.27,
        //             "reaminingAmount": 0.3,
        //             "timeCreated": 155551580736,
        //             "timeFilled": 0
        //         }
        //     ]
        //
        return this.parseOrders (response, market, since, limit);
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            'orderId': id,
        };
        const response = await this.privateGetOrderGetOrder (this.extend (request, params));
        //
        //     {
        //         "orderId": "1555492358.126073.126767@0502:2",
        //         "cliOrdId": "myNewOrder",
        //         "pairId": 502,
        //         "symbol": "LAETH",
        //         "side": "buy",
        //         "orderType": "limit",
        //         "price": 136.2,
        //         "amount": 0.57,
        //         "orderStatus": "partiallyFilled",
        //         "executedAmount": 0.27,
        //         "reaminingAmount": 0.3,
        //         "timeCreated": 155551580736,
        //         "timeFilled": 0
        //     }
        //
        return this.parseOrder (response);
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        await this.loadMarkets ();
        if (type !== 'limit') {
            throw new ExchangeError (this.id + ' allows limit orders only');
        }
        const request = {
            'symbol': this.marketId (symbol),
            'side': side,
            'price': this.priceToPrecision (symbol, price),
            'amount': this.amountToPrecision (symbol, amount),
            'orderType': type,
        };
        const method = this.safeString (this.options, 'createOrderMethod', 'private_post_order_new');
        const response = await this[method] (this.extend (request, params));
        //
        //     {
        //         "orderId":"1563460093.134037.704945@0370:2",
        //         "cliOrdId":"",
        //         "pairId":370,
        //         "symbol":"ETHBTC",
        //         "side":"sell",
        //         "orderType":"limit",
        //         "price":1.0,
        //         "amount":1.0
        //     }
        //
        return this.parseOrder (response);
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            'orderId': id,
        };
        const response = await this.privatePostOrderCancel (this.extend (request, params));
        //
        //     {
        //         "orderId": "1555492358.126073.126767@0502:2",
        //         "cliOrdId": "myNewOrder",
        //         "pairId": 502,
        //         "symbol": "LAETH",
        //         "side": "buy",
        //         "orderType": "limit",
        //         "price": 136.2,
        //         "amount": 0.57,
        //         "orderStatus": "partiallyFilled",
        //         "executedAmount": 0.27,
        //         "reaminingAmount": 0.3,
        //         "timeCreated": 155551580736,
        //         "timeFilled": 0
        //     }
        //
        return this.parseOrder (response);
    }

    async cancelAllOrders (symbol = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelAllOrders() requires a symbol argument');
        }
        await this.loadMarkets ();
        const marketId = this.marketId (symbol);
        const request = {
            'symbol': marketId,
        };
        const response = await this.privatePostOrderCancelAll (this.extend (request, params));
        //
        //     {
        //         "pairId": 502,
        //         "symbol": "LAETH",
        //         "cancelledOrders": [
        //             "1555492358.126073.126767@0502:2"
        //         ]
        //     }
        //
        const result = [];
        const canceledOrders = this.safeValue (response, 'cancelledOrders', []);
        for (let i = 0; i < canceledOrders.length; i++) {
            const order = this.parseOrder ({
                'symbol': marketId,
                'orderId': canceledOrders[i],
                'orderStatus': 'canceled',
            });
            result.push (order);
        }
        return result;
    }

    sign (path, api = 'public', method = 'GET', params = undefined, headers = undefined, body = undefined) {
        let request = '/api/' + this.version + '/' + this.implodeParams (path, params);
        let query = this.omit (params, this.extractParams (path));
        if (api === 'private') {
            const nonce = this.nonce ();
            query = this.extend ({
                'timestamp': nonce,
            }, query);
        }
        const urlencodedQuery = this.urlencode (query);
        if (Object.keys (query).length) {
            request += '?' + urlencodedQuery;
        }
        if (api === 'private') {
            this.checkRequiredCredentials ();
            const signature = this.hmac (this.encode (request), this.encode (this.secret), 'sha512');
            headers = {
                'X-LA-APIKEY': this.apiKey,
                'X-LA-SIGNATURE': signature,
            };
            if (method === 'POST') {
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
                body = urlencodedQuery;
            }
        }
        const url = this.urls['api'] + request;
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (!response) {
            return;
        }
        //
        //     { "message": "Request limit reached!", "details": "Request limit reached. Maximum allowed: 1 per 1s. Please try again in 1 second(s)." }
        //     { "error": { "message": "Pair 370 is not found","errorType":"RequestError","statusCode":400 }}
        //     { "error": { "message": "Signature or ApiKey is not valid","errorType":"RequestError","statusCode":400 }}
        //     { "error": { "message": "Request is out of time", "errorType": "RequestError", "statusCode":400 }}
        //     { "error": { "message": "Price needs to be greater than 0","errorType":"ValidationError","statusCode":400 }}
        //     { "error": { "message": "Side is not valid, Price needs to be greater than 0, Amount needs to be greater than 0, The Symbol field is required., OrderType is not valid","errorType":"ValidationError","statusCode":400 }}
        //     { "error": { "message": "Cancelable order whit ID 1563460289.571254.704945@0370:1 not found","errorType":"RequestError","statusCode":400 }}
        //     { "error": { "message": "Symbol must be specified","errorType":"RequestError","statusCode":400 }}
        //     { "error": { "message": "Order 1563460289.571254.704945@0370:1 is not found","errorType":"RequestError","statusCode":400 }}
        //
        const message = this.safeString (response, 'message');
        const feedback = this.id + ' ' + body;
        if (message !== undefined) {
            this.throwExactlyMatchedException (this.exceptions['exact'], message, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], message, feedback);
        }
        const error = this.safeValue (response, 'error', {});
        const errorMessage = this.safeString (error, 'message');
        if (errorMessage !== undefined) {
            this.throwExactlyMatchedException (this.exceptions['exact'], errorMessage, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], errorMessage, feedback);
            throw new ExchangeError (feedback); // unknown message
        }
    }
};
