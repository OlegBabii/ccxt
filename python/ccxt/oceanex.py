# -*- coding: utf-8 -*-

# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

from ccxt.base.exchange import Exchange
from ccxt.base.errors import ExchangeError
from ccxt.base.errors import AuthenticationError
from ccxt.base.errors import PermissionDenied
from ccxt.base.errors import ArgumentsRequired
from ccxt.base.errors import BadRequest
from ccxt.base.errors import InsufficientFunds
from ccxt.base.errors import InvalidOrder
from ccxt.base.errors import OrderNotFound


class oceanex(Exchange):

    def describe(self):
        return self.deep_extend(super(oceanex, self).describe(), {
            'id': 'oceanex',
            'name': 'OceanEx',
            'countries': ['US'],
            'version': 'v1',
            'rateLimit': 3000,
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/58385970-794e2d80-8001-11e9-889c-0567cd79b78e.jpg',
                'api': 'https://api.oceanex.pro',
                'www': 'https://www.oceanex.pro.com',
                'doc': 'https://api.oceanex.pro/doc/v1',
                'referral': 'https://oceanex.pro/signup?referral=VE24QX',
            },
            'has': {
                'fetchMarkets': True,
                'fetchCurrencies': False,
                'fetchTicker': True,
                'fetchTickers': True,
                'fetchOrderBook': True,
                'fetchOrderBooks': True,
                'fetchTrades': True,
                'fetchTradingLimits': False,
                'fetchTradingFees': False,
                'fetchAllTradingFees': True,
                'fetchFundingFees': False,
                'fetchTime': True,
                'fetchOrder': True,
                'fetchOrders': True,
                'fetchOpenOrders': True,
                'fetchClosedOrders': True,
                'fetchBalance': True,
                'createMarketOrder': True,
                'createOrder': True,
                'cancelOrder': True,
                'cancelOrders': True,
                'cancelAllOrders': True,
            },
            'timeframes': {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '4h': '4h',
                '12h': '12h',
                '1d': '1d',
                '1w': '1w',
            },
            'api': {
                'public': {
                    'get': [
                        'markets',
                        'tickers/{pair}',
                        'tickers_multi',
                        'order_book',
                        'order_book/multi',
                        'fees/trading',
                        'trades',
                        'timestamp',
                    ],
                },
                'private': {
                    'get': [
                        'key',
                        'members/me',
                        'orders',
                        'orders/filter',
                    ],
                    'post': [
                        'orders',
                        'orders/multi',
                        'order/delete',
                        'order/delete/multi',
                        'orders/clear',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'tierBased': False,
                    'percentage': True,
                    'maker': 0.1 / 100,
                    'taker': 0.1 / 100,
                },
            },
            'commonCurrencies': {
                'PLA': 'Plair',
            },
            'exceptions': {
                'codes': {
                    '-1': BadRequest,
                    '-2': BadRequest,
                    '1001': BadRequest,
                    '1004': ArgumentsRequired,
                    '1006': AuthenticationError,
                    '1008': AuthenticationError,
                    '1010': AuthenticationError,
                    '1011': PermissionDenied,
                    '2001': AuthenticationError,
                    '2002': InvalidOrder,
                    '2004': OrderNotFound,
                    '9003': PermissionDenied,
                },
                'exact': {
                    'market does not have a valid value': BadRequest,
                    'side does not have a valid value': BadRequest,
                    'Account::AccountError: Cannot lock funds': InsufficientFunds,
                    'The account does not exist': AuthenticationError,
                },
            },
        })

    def fetch_markets(self, params={}):
        request = {'show_details': True}
        response = self.publicGetMarkets(self.extend(request, params))
        result = []
        markets = self.safe_value(response, 'data')
        for i in range(0, len(markets)):
            market = markets[i]
            id = self.safe_value(market, 'id')
            name = self.safe_value(market, 'name')
            baseId, quoteId = name.split('/')
            base = self.safe_currency_code(baseId)
            quote = self.safe_currency_code(quoteId)
            baseId = baseId.lower()
            quoteId = quoteId.lower()
            symbol = base + '/' + quote
            result.append({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'active': True,
                'info': market,
                'precision': {
                    'amount': self.safe_value(market, 'amount_precision'),
                    'price': self.safe_value(market, 'price_precision'),
                    'base': self.safe_value(market, 'ask_precision'),
                    'quote': self.safe_value(market, 'bid_precision'),
                },
                'limits': {
                    'amount': {
                        'min': None,
                        'max': None,
                    },
                    'price': {
                        'min': None,
                        'max': None,
                    },
                    'cost': {
                        'min': self.safe_value(market, 'minimum_trading_amount'),
                        'max': None,
                    },
                },
            })
        return result

    def fetch_ticker(self, symbol, params={}):
        self.load_markets()
        market = self.market(symbol)
        request = {
            'pair': market['id'],
        }
        response = self.publicGetTickersPair(self.extend(request, params))
        #
        #     {
        #         "code":0,
        #         "message":"Operation successful",
        #         "data": {
        #             "at":1559431729,
        #             "ticker": {
        #                 "buy":"0.0065",
        #                 "sell":"0.00677",
        #                 "low":"0.00677",
        #                 "high":"0.00677",
        #                 "last":"0.00677",
        #                 "vol":"2000.0"
        #             }
        #         }
        #     }
        #
        data = self.safe_value(response, 'data', {})
        return self.parse_ticker(data, market)

    def fetch_tickers(self, symbols=None, params={}):
        self.load_markets()
        if symbols is None:
            symbols = self.symbols
        marketIds = self.market_ids(symbols)
        request = {'markets': marketIds}
        response = self.publicGetTickersMulti(self.extend(request, params))
        #
        #     {
        #         "code":0,
        #         "message":"Operation successful",
        #         "data": {
        #             "at":1559431729,
        #             "ticker": {
        #                 "buy":"0.0065",
        #                 "sell":"0.00677",
        #                 "low":"0.00677",
        #                 "high":"0.00677",
        #                 "last":"0.00677",
        #                 "vol":"2000.0"
        #             }
        #         }
        #     }
        #
        data = self.safe_value(response, 'data')
        result = {}
        for i in range(0, len(data)):
            ticker = data[i]
            marketId = self.safe_string(ticker, 'market')
            market = self.safe_market(marketId)
            symbol = market['symbol']
            result[symbol] = self.parse_ticker(ticker, market)
        return self.filter_by_array(result, 'symbol', symbols)

    def parse_ticker(self, data, market=None):
        #
        #         {
        #             "at":1559431729,
        #             "ticker": {
        #                 "buy":"0.0065",
        #                 "sell":"0.00677",
        #                 "low":"0.00677",
        #                 "high":"0.00677",
        #                 "last":"0.00677",
        #                 "vol":"2000.0"
        #             }
        #         }
        #
        ticker = self.safe_value(data, 'ticker', {})
        timestamp = self.safe_timestamp(data, 'at')
        return {
            'symbol': market['symbol'],
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'high': self.safe_number(ticker, 'high'),
            'low': self.safe_number(ticker, 'low'),
            'bid': self.safe_number(ticker, 'buy'),
            'bidVolume': None,
            'ask': self.safe_number(ticker, 'sell'),
            'askVolume': None,
            'vwap': None,
            'open': None,
            'close': self.safe_number(ticker, 'last'),
            'last': self.safe_number(ticker, 'last'),
            'previousClose': None,
            'change': None,
            'percentage': None,
            'average': None,
            'baseVolume': self.safe_number(ticker, 'volume'),
            'quoteVolume': None,
            'info': ticker,
        }

    def fetch_order_book(self, symbol, limit=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        request = {
            'market': market['id'],
        }
        if limit is not None:
            request['limit'] = limit
        response = self.publicGetOrderBook(self.extend(request, params))
        #
        #     {
        #         "code":0,
        #         "message":"Operation successful",
        #         "data": {
        #             "timestamp":1559433057,
        #             "asks": [
        #                 ["100.0","20.0"],
        #                 ["4.74","2000.0"],
        #                 ["1.74","4000.0"],
        #             ],
        #             "bids":[
        #                 ["0.0065","5482873.4"],
        #                 ["0.00649","4781956.2"],
        #                 ["0.00648","2876006.8"],
        #             ],
        #         }
        #     }
        #
        orderbook = self.safe_value(response, 'data', {})
        timestamp = self.safe_timestamp(orderbook, 'timestamp')
        return self.parse_order_book(orderbook, timestamp)

    def fetch_order_books(self, symbols=None, limit=None, params={}):
        self.load_markets()
        if symbols is None:
            symbols = self.symbols
        marketIds = self.market_ids(symbols)
        request = {
            'markets': marketIds,
        }
        if limit is not None:
            request['limit'] = limit
        response = self.publicGetOrderBookMulti(self.extend(request, params))
        #
        #     {
        #         "code":0,
        #         "message":"Operation successful",
        #         "data": [
        #             {
        #                 "timestamp":1559433057,
        #                 "market": "bagvet",
        #                 "asks": [
        #                     ["100.0","20.0"],
        #                     ["4.74","2000.0"],
        #                     ["1.74","4000.0"],
        #                 ],
        #                 "bids":[
        #                     ["0.0065","5482873.4"],
        #                     ["0.00649","4781956.2"],
        #                     ["0.00648","2876006.8"],
        #                 ],
        #             },
        #             ...,
        #         ],
        #     }
        #
        data = self.safe_value(response, 'data', [])
        result = {}
        for i in range(0, len(data)):
            orderbook = data[i]
            marketId = self.safe_string(orderbook, 'market')
            symbol = self.safe_symbol(marketId)
            timestamp = self.safe_timestamp(orderbook, 'timestamp')
            result[symbol] = self.parse_order_book(orderbook, timestamp)
        return result

    def fetch_trades(self, symbol, since=None, limit=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        request = {
            'market': market['id'],
        }
        if limit is not None:
            request['limit'] = limit
        response = self.publicGetTrades(self.extend(request, params))
        data = self.safe_value(response, 'data')
        return self.parse_trades(data, market, since, limit)

    def parse_trade(self, trade, market=None):
        side = self.safe_value(trade, 'side')
        if side == 'bid':
            side = 'buy'
        elif side == 'ask':
            side = 'sell'
        marketId = self.safe_value(trade, 'market')
        symbol = self.safe_symbol(marketId, market)
        timestamp = self.safe_timestamp(trade, 'created_on')
        if timestamp is None:
            timestamp = self.parse8601(self.safe_string(trade, 'created_at'))
        return {
            'info': trade,
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'symbol': symbol,
            'id': self.safe_string(trade, 'id'),
            'order': None,
            'type': 'limit',
            'takerOrMaker': None,
            'side': side,
            'price': self.safe_number(trade, 'price'),
            'amount': self.safe_number(trade, 'volume'),
            'cost': None,
            'fee': None,
        }

    def fetch_time(self, params={}):
        response = self.publicGetTimestamp(params)
        #
        #     {"code":0,"message":"Operation successful","data":1559433420}
        #
        return self.safe_timestamp(response, 'data')

    def fetch_all_trading_fees(self, params={}):
        response = self.publicGetFeesTrading(params)
        data = self.safe_value(response, 'data')
        result = {}
        for i in range(0, len(data)):
            group = data[i]
            maker = self.safe_value(group, 'ask_fee', {})
            taker = self.safe_value(group, 'bid_fee', {})
            marketId = self.safe_string(group, 'market')
            symbol = self.safe_symbol(marketId)
            result[symbol] = {
                'info': group,
                'symbol': symbol,
                'maker': self.safe_number(maker, 'value'),
                'taker': self.safe_number(taker, 'value'),
            }
        return result

    def fetch_key(self, params={}):
        response = self.privateGetKey(params)
        return self.safe_value(response, 'data')

    def fetch_balance(self, params={}):
        self.load_markets()
        response = self.privateGetMembersMe(params)
        data = self.safe_value(response, 'data')
        balances = self.safe_value(data, 'accounts')
        result = {'info': response}
        for i in range(0, len(balances)):
            balance = balances[i]
            currencyId = self.safe_value(balance, 'currency')
            code = self.safe_currency_code(currencyId)
            account = self.account()
            account['free'] = self.safe_number(balance, 'balance')
            account['used'] = self.safe_number(balance, 'locked')
            result[code] = account
        return self.parse_balance(result)

    def create_order(self, symbol, type, side, amount, price=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        request = {
            'market': market['id'],
            'side': side,
            'ord_type': type,
            'volume': self.amount_to_precision(symbol, amount),
        }
        if type == 'limit':
            request['price'] = self.price_to_precision(symbol, price)
        response = self.privatePostOrders(self.extend(request, params))
        data = self.safe_value(response, 'data')
        return self.parse_order(data, market)

    def fetch_order(self, id, symbol=None, params={}):
        ids = id
        if not isinstance(id, list):
            ids = [id]
        self.load_markets()
        market = None
        if symbol is not None:
            market = self.market(symbol)
        request = {'ids': ids}
        response = self.privateGetOrders(self.extend(request, params))
        data = self.safe_value(response, 'data')
        dataLength = len(data)
        if data is None:
            raise OrderNotFound(self.id + ' could not found matching order')
        if isinstance(id, list):
            return self.parse_orders(data, market)
        if dataLength == 0:
            raise OrderNotFound(self.id + ' could not found matching order')
        return self.parse_order(data[0], market)

    def fetch_open_orders(self, symbol=None, since=None, limit=None, params={}):
        request = {
            'states': ['wait'],
        }
        return self.fetch_orders(symbol, since, limit, self.extend(request, params))

    def fetch_closed_orders(self, symbol=None, since=None, limit=None, params={}):
        request = {
            'states': ['done', 'cancel'],
        }
        return self.fetch_orders(symbol, since, limit, self.extend(request, params))

    def fetch_orders(self, symbol=None, since=None, limit=None, params={}):
        if symbol is None:
            raise ArgumentsRequired(self.id + ' fetchOrders() requires a `symbol` argument')
        self.load_markets()
        market = self.market(symbol)
        states = self.safe_value(params, 'states', ['wait', 'done', 'cancel'])
        query = self.omit(params, 'states')
        request = {
            'market': market['id'],
            'states': states,
            'need_price': 'True',
        }
        if limit is not None:
            request['limit'] = limit
        response = self.privateGetOrdersFilter(self.extend(request, query))
        data = self.safe_value(response, 'data', [])
        result = []
        for i in range(0, len(data)):
            orders = self.safe_value(data[i], 'orders', [])
            status = self.parse_order_status(self.safe_value(data[i], 'state'))
            parsedOrders = self.parse_orders(orders, market, since, limit, {'status': status})
            result = self.array_concat(result, parsedOrders)
        return result

    def parse_order(self, order, market=None):
        #
        #     {
        #         "created_at": "2019-01-18T00:38:18Z",
        #         "trades_count": 0,
        #         "remaining_volume": "0.2",
        #         "price": "1001.0",
        #         "created_on": "1547771898",
        #         "side": "buy",
        #         "volume": "0.2",
        #         "state": "wait",
        #         "ord_type": "limit",
        #         "avg_price": "0.0",
        #         "executed_volume": "0.0",
        #         "id": 473797,
        #         "market": "veteth"
        #     }
        #
        status = self.parse_order_status(self.safe_value(order, 'state'))
        marketId = self.safe_string_2(order, 'market', 'market_id')
        symbol = self.safe_symbol(marketId, market)
        timestamp = self.safe_timestamp(order, 'created_on')
        if timestamp is None:
            timestamp = self.parse8601(self.safe_string(order, 'created_at'))
        return self.safe_order({
            'info': order,
            'id': self.safe_string(order, 'id'),
            'clientOrderId': None,
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'lastTradeTimestamp': None,
            'symbol': symbol,
            'type': self.safe_value(order, 'ord_type'),
            'timeInForce': None,
            'postOnly': None,
            'side': self.safe_value(order, 'side'),
            'price': self.safe_number(order, 'price'),
            'stopPrice': None,
            'average': self.safe_number(order, 'avg_price'),
            'amount': self.safe_number(order, 'volume'),
            'remaining': self.safe_number(order, 'remaining_volume'),
            'filled': self.safe_number(order, 'executed_volume'),
            'status': status,
            'cost': None,
            'trades': None,
            'fee': None,
        })

    def parse_order_status(self, status):
        statuses = {
            'wait': 'open',
            'done': 'closed',
            'cancel': 'canceled',
        }
        return self.safe_string(statuses, status, status)

    def create_orders(self, symbol, orders, params={}):
        self.load_markets()
        market = self.market(symbol)
        request = {
            'market': market['id'],
            'orders': orders,
        }
        # orders: [{"side":"buy", "volume":.2, "price":1001}, {"side":"sell", "volume":0.2, "price":1002}]
        response = self.privatePostOrdersMulti(self.extend(request, params))
        data = response['data']
        return self.parse_orders(data)

    def cancel_order(self, id, symbol=None, params={}):
        self.load_markets()
        response = self.privatePostOrderDelete(self.extend({'id': id}, params))
        data = self.safe_value(response, 'data')
        return self.parse_order(data)

    def cancel_orders(self, ids, symbol=None, params={}):
        self.load_markets()
        response = self.privatePostOrderDeleteMulti(self.extend({'ids': ids}, params))
        data = self.safe_value(response, 'data')
        return self.parse_orders(data)

    def cancel_all_orders(self, symbol=None, params={}):
        self.load_markets()
        response = self.privatePostOrdersClear(params)
        data = self.safe_value(response, 'data')
        return self.parse_orders(data)

    def sign(self, path, api='public', method='GET', params={}, headers=None, body=None):
        url = self.urls['api'] + '/' + self.version + '/' + self.implode_params(path, params)
        query = self.omit(params, self.extract_params(path))
        if api == 'public':
            if path == 'tickers_multi' or path == 'order_book/multi':
                request = '?'
                markets = self.safe_value(params, 'markets')
                for i in range(0, len(markets)):
                    request += 'markets[]=' + markets[i] + '&'
                limit = self.safe_value(params, 'limit')
                if limit is not None:
                    request += 'limit=' + limit
                url += request
            elif query:
                url += '?' + self.urlencode(query)
        elif api == 'private':
            self.check_required_credentials()
            request = {
                'uid': self.apiKey,
                'data': query,
            }
            # to set the private key:
            # fs = require('fs')
            # exchange.secret = fs.readFileSync('oceanex.pem', 'utf8')
            jwt_token = self.jwt(request, self.encode(self.secret), 'RS256')
            url += '?user_jwt=' + jwt_token
        headers = {'Content-Type': 'application/json'}
        return {'url': url, 'method': method, 'body': body, 'headers': headers}

    def handle_errors(self, code, reason, url, method, headers, body, response, requestHeaders, requestBody):
        #
        #     {"code":1011,"message":"This IP '5.228.233.138' is not allowed","data":{}}
        #
        if response is None:
            return
        errorCode = self.safe_string(response, 'code')
        message = self.safe_string(response, 'message')
        if (errorCode is not None) and (errorCode != '0'):
            feedback = self.id + ' ' + body
            self.throw_exactly_matched_exception(self.exceptions['codes'], errorCode, feedback)
            self.throw_exactly_matched_exception(self.exceptions['exact'], message, feedback)
            raise ExchangeError(feedback)
