# -*- coding: utf-8 -*-

# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

from ccxtpro.base.exchange import Exchange
import ccxt.async_support as ccxt


class bitstamp(Exchange, ccxt.bitstamp):

    def describe(self):
        return self.deep_extend(super(bitstamp, self).describe(), {
            'has': {
                'ws': True,
                'watchOrderBook': True,
                'watchTrades': True,
                'watchOHLCV': False,
                'watchTicker': False,
                'watchTickers': False,
            },
            'urls': {
                'api': {
                    'ws': 'wss://ws.bitstamp.net',
                },
            },
            'options': {
                'watchOrderBook': {
                    'type': 'order_book',  # detail_order_book, diff_order_book
                },
                'tradesLimit': 1000,
                'OHLCVLimit': 1000,
            },
        })

    async def watch_order_book(self, symbol, limit=None, params={}):
        await self.load_markets()
        market = self.market(symbol)
        options = self.safe_value(self.options, 'watchOrderBook', {})
        type = self.safe_string(options, 'type', 'order_book')
        messageHash = type + '_' + market['id']
        url = self.urls['api']['ws']
        request = {
            'event': 'bts:subscribe',
            'data': {
                'channel': messageHash,
            },
        }
        subscription = {
            'messageHash': messageHash,
            'type': type,
            'symbol': symbol,
            'method': self.handle_order_book_subscription,
            'limit': limit,
            'params': params,
        }
        message = self.extend(request, params)
        future = self.watch(url, messageHash, message, messageHash, subscription)
        return await self.after(future, self.limit_order_book, symbol, limit, params)

    def limit_order_book(self, orderbook, symbol, limit=None, params={}):
        return orderbook.limit(limit)

    async def fetch_order_book_snapshot(self, client, message, subscription):
        symbol = self.safe_string(subscription, 'symbol')
        limit = self.safe_integer(subscription, 'limit')
        params = self.safe_value(subscription, 'params')
        messageHash = self.safe_string(subscription, 'messageHash')
        # todo: self is a synch blocking call in ccxt.php - make it async
        snapshot = await self.fetch_order_book(symbol, limit, params)
        orderbook = self.safe_value(self.orderbooks, symbol)
        if orderbook is not None:
            orderbook.reset(snapshot)
            # unroll the accumulated deltas
            messages = orderbook.cache
            for i in range(0, len(messages)):
                message = messages[i]
                self.handle_order_book_message(client, message, orderbook)
            self.orderbooks[symbol] = orderbook
            client.resolve(orderbook, messageHash)

    def handle_delta(self, bookside, delta):
        price = self.safe_float(delta, 0)
        amount = self.safe_float(delta, 1)
        id = self.safe_string(delta, 2)
        if id is None:
            bookside.store(price, amount)
        else:
            bookside.store(price, amount, id)

    def handle_deltas(self, bookside, deltas):
        for i in range(0, len(deltas)):
            self.handle_delta(bookside, deltas[i])

    def handle_order_book_message(self, client, message, orderbook, nonce=None):
        data = self.safe_value(message, 'data', {})
        microtimestamp = self.safe_integer(data, 'microtimestamp')
        if (nonce is not None) and (microtimestamp <= nonce):
            return orderbook
        self.handle_deltas(orderbook['asks'], self.safe_value(data, 'asks', []))
        self.handle_deltas(orderbook['bids'], self.safe_value(data, 'bids', []))
        orderbook['nonce'] = microtimestamp
        timestamp = int(microtimestamp / 1000)
        orderbook['timestamp'] = timestamp
        orderbook['datetime'] = self.iso8601(timestamp)
        return orderbook

    def handle_order_book(self, client, message):
        #
        # initial snapshot is fetched with ccxt's fetchOrderBook
        # the feed does not include a snapshot, just the deltas
        #
        #     {
        #         data: {
        #             timestamp: '1583656800',
        #             microtimestamp: '1583656800237527',
        #             bids: [
        #                 ["8732.02", "0.00002478", "1207590500704256"],
        #                 ["8729.62", "0.01600000", "1207590502350849"],
        #                 ["8727.22", "0.01800000", "1207590504296448"],
        #             ],
        #             asks: [
        #                 ["8735.67", "2.00000000", "1207590693249024"],
        #                 ["8735.67", "0.01700000", "1207590693634048"],
        #                 ["8735.68", "1.53294500", "1207590692048896"],
        #             ],
        #         },
        #         event: 'data',
        #         channel: 'detail_order_book_btcusd'
        #     }
        #
        channel = self.safe_string(message, 'channel')
        subscription = self.safe_value(client.subscriptions, channel)
        symbol = self.safe_string(subscription, 'symbol')
        type = self.safe_string(subscription, 'type')
        orderbook = self.safe_value(self.orderbooks, symbol)
        if orderbook is None:
            return message
        if type == 'order_book':
            orderbook.reset({})
            self.handle_order_book_message(client, message, orderbook)
            client.resolve(orderbook, channel)
            # replace top bids and asks
        elif type == 'detail_order_book':
            orderbook.reset({})
            self.handle_order_book_message(client, message, orderbook)
            client.resolve(orderbook, channel)
            # replace top bids and asks
        elif type == 'diff_order_book':
            # process incremental deltas
            nonce = self.safe_integer(orderbook, 'nonce')
            if nonce is None:
                # buffer the events you receive from the stream
                orderbook.cache.append(message)
            else:
                try:
                    self.handle_order_book_message(client, message, orderbook, nonce)
                    client.resolve(orderbook, channel)
                except Exception as e:
                    if symbol in self.orderbooks:
                        del self.orderbooks[symbol]
                    if channel in client.subscriptions:
                        del client.subscriptions[channel]
                    client.reject(e, channel)

    async def watch_trades(self, symbol, since=None, limit=None, params={}):
        await self.load_markets()
        market = self.market(symbol)
        options = self.safe_value(self.options, 'watchTrades', {})
        type = self.safe_string(options, 'type', 'live_trades')
        messageHash = type + '_' + market['id']
        url = self.urls['api']['ws']
        request = {
            'event': 'bts:subscribe',
            'data': {
                'channel': messageHash,
            },
        }
        subscription = {
            'messageHash': messageHash,
            'type': type,
            'symbol': symbol,
            'method': self.handle_order_book_subscription,
            'limit': limit,
            'params': params,
        }
        message = self.extend(request, params)
        future = self.watch(url, messageHash, message, messageHash, subscription)
        return await self.after(future, self.filterBySinceLimit, since, limit)

    def parse_trade(self, trade, market=None):
        #
        #     {
        #         e: 'trade',       # event type
        #         E: 1579481530911,  # event time
        #         s: 'ETHBTC',      # symbol
        #         t: 158410082,     # trade id
        #         p: '0.01914100',  # price
        #         q: '0.00700000',  # quantity
        #         b: 586187049,     # buyer order id
        #         a: 586186710,     # seller order id
        #         T: 1579481530910,  # trade time
        #         m: False,         # is the buyer the market maker
        #         M: True           # binance docs say it should be ignored
        #     }
        #
        event = self.safe_string(trade, 'e')
        if event is None:
            return super(bitstamp, self).parse_trade(trade, market)
        id = self.safe_string(trade, 't')
        timestamp = self.safe_integer(trade, 'T')
        price = self.safe_float(trade, 'p')
        amount = self.safe_float(trade, 'q')
        cost = None
        if (price is not None) and (amount is not None):
            cost = price * amount
        symbol = None
        marketId = self.safe_string(trade, 's')
        if marketId in self.markets_by_id:
            market = self.markets_by_id[marketId]
        if (symbol is None) and (market is not None):
            symbol = market['symbol']
        side = None
        takerOrMaker = None
        orderId = None
        if 'm' in trade:
            side = 'sell' if trade['m'] else 'buy'  # self is reversed intentionally
            takerOrMaker = 'maker' if trade['m'] else 'taker'
        return {
            'info': trade,
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'symbol': symbol,
            'id': id,
            'order': orderId,
            'type': None,
            'takerOrMaker': takerOrMaker,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': cost,
            'fee': None,
        }

    def handle_trade(self, client, message):
        #
        #     {
        #         data: {
        #             buy_order_id: 1207733769326592,
        #             amount_str: "0.14406384",
        #             timestamp: "1583691851",
        #             microtimestamp: "1583691851934000",
        #             id: 106833903,
        #             amount: 0.14406384,
        #             sell_order_id: 1207733765476352,
        #             price_str: "8302.92",
        #             type: 0,
        #             price: 8302.92
        #         },
        #         event: "trade",
        #         channel: "live_trades_btcusd"
        #     }
        #
        # the trade streams push raw trade information in real-time
        # each trade has a unique buyer and seller
        channel = self.safe_string(message, 'channel')
        data = self.safe_value(message, 'data')
        subscription = self.safe_value(client.subscriptions, channel)
        symbol = self.safe_string(subscription, 'symbol')
        market = self.market(symbol)
        trade = self.parse_trade(data, market)
        array = self.safe_value(self.trades, symbol, [])
        array.append(trade)
        length = len(array)
        if length > self.options['tradesLimit']:
            array.pop(0)
        self.trades[symbol] = array
        client.resolve(array, channel)

    def sign_message(self, client, messageHash, message, params={}):
        # todo: implement binance signMessage
        return message

    def handle_order_book_subscription(self, client, message, subscription):
        type = self.safe_string(subscription, 'type')
        symbol = self.safe_string(subscription, 'symbol')
        if symbol in self.orderbooks:
            del self.orderbooks[symbol]
        if type == 'order_book':
            limit = self.safe_integer(subscription, 'limit', 100)
            self.orderbooks[symbol] = self.order_book({}, limit)
        elif type == 'detail_order_book':
            limit = self.safe_integer(subscription, 'limit', 100)
            self.orderbooks[symbol] = self.indexed_order_book({}, limit)
        elif type == 'diff_order_book':
            limit = self.safe_integer(subscription, 'limit')
            self.orderbooks[symbol] = self.order_book({}, limit)
            # fetch the snapshot in a separate async call
            self.spawn(self.fetch_order_book_snapshot, client, message, subscription)

    def handle_subscription_status(self, client, message):
        #
        #     {
        #         'event': "bts:subscription_succeeded",
        #         'channel': "detail_order_book_btcusd",
        #         'data': {},
        #     }
        #
        channel = self.safe_string(message, 'channel')
        subscription = self.safe_value(client.subscriptions, channel, {})
        method = self.safe_value(subscription, 'method')
        if method is not None:
            method(client, message, subscription)
        return message

    def handle_subject(self, client, message):
        #
        #     {
        #         data: {
        #             timestamp: '1583656800',
        #             microtimestamp: '1583656800237527',
        #             bids: [
        #                 ["8732.02", "0.00002478", "1207590500704256"],
        #                 ["8729.62", "0.01600000", "1207590502350849"],
        #                 ["8727.22", "0.01800000", "1207590504296448"],
        #             ],
        #             asks: [
        #                 ["8735.67", "2.00000000", "1207590693249024"],
        #                 ["8735.67", "0.01700000", "1207590693634048"],
        #                 ["8735.68", "1.53294500", "1207590692048896"],
        #             ],
        #         },
        #         event: 'data',
        #         channel: 'detail_order_book_btcusd'
        #     }
        #
        channel = self.safe_string(message, 'channel')
        subscription = self.safe_value(client.subscriptions, channel)
        type = self.safe_string(subscription, 'type')
        methods = {
            'live_trades': self.handle_trade,
            # 'live_orders': self.handle_order_book,
            'order_book': self.handle_order_book,
            'detail_order_book': self.handle_order_book,
            'diff_order_book': self.handle_order_book,
        }
        method = self.safe_value(methods, type)
        if method is None:
            return message
        else:
            return method(client, message)

    def handle_error_message(self, client, message):
        return message

    def handle_message(self, client, message):
        if not self.handle_error_message(client, message):
            return
        #
        #     {
        #         'event': "bts:subscription_succeeded",
        #         'channel': "detail_order_book_btcusd",
        #         'data': {},
        #     }
        #
        #     {
        #         data: {
        #             timestamp: '1583656800',
        #             microtimestamp: '1583656800237527',
        #             bids: [
        #                 ["8732.02", "0.00002478", "1207590500704256"],
        #                 ["8729.62", "0.01600000", "1207590502350849"],
        #                 ["8727.22", "0.01800000", "1207590504296448"],
        #             ],
        #             asks: [
        #                 ["8735.67", "2.00000000", "1207590693249024"],
        #                 ["8735.67", "0.01700000", "1207590693634048"],
        #                 ["8735.68", "1.53294500", "1207590692048896"],
        #             ],
        #         },
        #         event: 'data',
        #         channel: 'detail_order_book_btcusd'
        #     }
        #
        event = self.safe_string(message, 'event')
        if event == 'bts:subscription_succeeded':
            return self.handle_subscription_status(client, message)
        else:
            return self.handle_subject(client, message)
