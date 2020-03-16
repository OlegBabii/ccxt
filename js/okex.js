'use strict';

//  ---------------------------------------------------------------------------

const ccxt = require ('ccxt');
const { ExchangeError } = require ('ccxt/js/base/errors');

//  ---------------------------------------------------------------------------

module.exports = class okex extends ccxt.okex {
    describe () {
        return this.deepExtend (super.describe (), {
            'has': {
                'ws': true,
                'watchTicker': true,
                // 'watchTickers': false,
                'watchOrderBook': true,
                // 'watchTrades': true,
                // 'watchBalance': false, // for now
                // 'watchOHLCV': false, // missing on the exchange side in v1
            },
            'urls': {
                'api': {
                    'ws': 'wss://real.okex.com:8443/ws/v3',
                },
            },
            'options': {
                'watchOrderBook': {
                    'limit': 400, // max
                },
                'ws': {
                    'inflate': true,
                },
            },
        });
    }

    async subscribe (channel, symbol, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const url = this.urls['api']['ws'];
        const messageHash = market['type'] + '/' + channel + ':' + market['id'];
        const request = {
            'op': 'subscribe',
            'args': [ messageHash ],
        };
        return await this.watch (url, messageHash, this.deepExtend (request, params), messageHash);
    }

    async watchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        const future = this.subscribe ('trades', symbol, params);
        return await this.after (future, this.filterBySinceLimit, since, limit);
    }

    async watchTicker (symbol, params = {}) {
        return await this.subscribe ('ticker', symbol, params);
    }

    handleTrades (client, message, subscription) {
        //
        // initial snapshot
        //
        //     [
        //         2,
        //             [
        //             [ null, 1580565020, 9374.9, 0.005 ],
        //             [ null, 1580565004, 9374.9, 0.005 ],
        //             [ null, 1580565003, 9374.9, 0.005 ],
        //         ]
        //     ]
        //
        // when a trade does not have an id yet
        //
        //     // channel id, update type, seq, time, price, amount
        //     [ 2, 'te', '28462857-BTCUSD', 1580565041, 9374.9, 0.005 ],
        //
        // when a trade already has an id
        //
        //     // channel id, update type, seq, trade id, time, price, amount
        //     [ 2, 'tu', '28462857-BTCUSD', 413357662, 1580565041, 9374.9, 0.005 ]
        //
        const messageHash = this.safeValue (subscription, 'messageHash');
        const marketId = this.safeString (subscription, 'pair');
        if (marketId in this.markets_by_id) {
            const market = this.markets_by_id[marketId];
            const symbol = market['symbol'];
            const data = this.safeValue (message, 1);
            const stored = this.safeValue (this.trades, symbol, []);
            if (Array.isArray (data)) {
                const trades = this.parseTrades (data, market);
                for (let i = 0; i < trades.length; i++) {
                    stored.push (trades[i]);
                    const storedLength = stored.length;
                    if (storedLength > this.options['tradesLimit']) {
                        stored.shift ();
                    }
                }
            } else {
                const second = this.safeString (message, 1);
                if (second !== 'tu') {
                    return;
                }
                const trade = this.parseTrade (message, market);
                stored.push (trade);
                const length = stored.length;
                if (length > this.options['tradesLimit']) {
                    stored.shift ();
                }
            }
            this.trades[symbol] = stored;
            client.resolve (stored, messageHash);
        }
        return message;
    }

    parseTrade (trade, market = undefined) {
        //
        // snapshot trade
        //
        //     // null, time, price, amount
        //     [ null, 1580565020, 9374.9, 0.005 ],
        //
        // when a trade does not have an id yet
        //
        //     // channel id, update type, seq, time, price, amount
        //     [ 2, 'te', '28462857-BTCUSD', 1580565041, 9374.9, 0.005 ],
        //
        // when a trade already has an id
        //
        //     // channel id, update type, seq, trade id, time, price, amount
        //     [ 2, 'tu', '28462857-BTCUSD', 413357662, 1580565041, 9374.9, 0.005 ]
        //
        if (!Array.isArray (trade)) {
            return super.parseTrade (trade, market);
        }
        const tradeLength = trade.length;
        const event = this.safeString (trade, 1);
        let id = undefined;
        if (event === 'tu') {
            id = this.safeString (trade, tradeLength - 4);
        }
        const timestamp = this.safeTimestamp (trade, tradeLength - 3);
        const price = this.safeFloat (trade, tradeLength - 2);
        let amount = this.safeFloat (trade, tradeLength - 1);
        let side = undefined;
        if (amount !== undefined) {
            side = (amount > 0) ? 'buy' : 'sell';
            amount = Math.abs (amount);
        }
        let cost = undefined;
        if ((price !== undefined) && (amount !== undefined)) {
            cost = price * amount;
        }
        const seq = this.safeString (trade, 2);
        const parts = seq.split ('-');
        const marketId = this.safeString (parts, 1);
        let symbol = undefined;
        if (marketId in this.markets_by_id) {
            market = this.markets_by_id[marketId];
        }
        if ((symbol === undefined) && (market !== undefined)) {
            symbol = market['symbol'];
        }
        const takerOrMaker = undefined;
        const orderId = undefined;
        return {
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'id': id,
            'order': orderId,
            'type': undefined,
            'takerOrMaker': takerOrMaker,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': cost,
            'fee': undefined,
        };
    }

    handleTicker (client, message) {
        //
        //     {
        //         table: 'spot/ticker',
        //         data: [
        //             {
        //                 last: '4634.1',
        //                 open_24h: '5305.6',
        //                 best_bid: '4631.6',
        //                 high_24h: '5950',
        //                 low_24h: '4448.8',
        //                 base_volume_24h: '147913.11435388',
        //                 quote_volume_24h: '756850119.99108082',
        //                 best_ask: '4631.7',
        //                 instrument_id: 'BTC-USDT',
        //                 timestamp: '2020-03-16T13:16:25.677Z',
        //                 best_bid_size: '0.12348942',
        //                 best_ask_size: '0.00100014',
        //                 last_qty: '0.00331822'
        //             }
        //         ]
        //     }
        //
        const table = this.safeString (message, 'table');
        const data = this.safeValue (message, 'data', []);
        for (let i = 0; i < data.length; i++) {
            const ticker = this.parseTicker (data[i]);
            const symbol = ticker['symbol'];
            const marketId = this.safeString (ticker['info'], 'instrument_id');
            const messageHash = table + ':' + marketId;
            this.tickers[symbol] = ticker;
            client.resolve (ticker, messageHash);
        }
        return message;
    }

    async watchOrderBook (symbol, limit = undefined, params = {}) {
        const future = this.subscribe ('depth', symbol, params);
        return await this.after (future, this.limitOrderBook, symbol, limit, params);
    }

    limitOrderBook (orderbook, symbol, limit = undefined, params = {}) {
        return orderbook.limit (limit);
    }

    handleDelta (bookside, delta) {
        const price = this.safeFloat (delta, 0);
        const amount = this.safeFloat (delta, 1);
        bookside.store (price, amount);
    }

    handleDeltas (bookside, deltas) {
        for (let i = 0; i < deltas.length; i++) {
            this.handleDelta (bookside, deltas[i]);
        }
    }

    handleOrderBookMessage (client, message, orderbook) {
        //
        //     {
        //         instrument_id: "BTC-USDT",
        //         asks: [
        //             ["4568.5", "0.49723138", "2"],
        //             ["4568.7", "0.5013", "1"],
        //             ["4569.1", "0.4398", "1"],
        //         ],
        //         bids: [
        //             ["4568.4", "0.84187666", "5"],
        //             ["4568.3", "0.75661506", "6"],
        //             ["4567.8", "2.01", "2"],
        //         ],
        //         timestamp: "2020-03-16T11:11:43.388Z",
        //         checksum: 473370408
        //     }
        //
        const asks = this.safeValue (message, 'asks', []);
        const bids = this.safeValue (message, 'bids', []);
        this.handleDeltas (orderbook['asks'], asks);
        this.handleDeltas (orderbook['bids'], bids);
        const timestamp = this.parse8601 (this.safeString (message, 'timestamp'));
        orderbook['timestamp'] = timestamp;
        orderbook['datetime'] = this.iso8601 (timestamp);
        return orderbook;
    }

    handleOrderBook (client, message) {
        //
        // first message (snapshot)
        //
        //     {
        //         table: "spot/depth",
        //         action: "partial",
        //         data: [
        //             {
        //                 instrument_id: "BTC-USDT",
        //                 asks: [
        //                     ["4568.5", "0.49723138", "2"],
        //                     ["4568.7", "0.5013", "1"],
        //                     ["4569.1", "0.4398", "1"],
        //                 ],
        //                 bids: [
        //                     ["4568.4", "0.84187666", "5"],
        //                     ["4568.3", "0.75661506", "6"],
        //                     ["4567.8", "2.01", "2"],
        //                 ],
        //                 timestamp: "2020-03-16T11:11:43.388Z",
        //                 checksum: 473370408
        //             }
        //         ]
        //     }
        //
        // subsequent updates
        //
        //     {
        //         table: "spot/depth",
        //         action: "update",
        //         data: [
        //             {
        //                 instrument_id:   "BTC-USDT",
        //                 asks: [
        //                     ["4598.8", "0", "0"],
        //                     ["4599.1", "0", "0"],
        //                     ["4600.3", "0", "0"],
        //                 ],
        //                 bids: [
        //                     ["4598.5", "0.08", "1"],
        //                     ["4598.2", "0.0337323", "1"],
        //                     ["4598.1", "0.12681801", "3"],
        //                 ],
        //                 timestamp: "2020-03-16T11:20:35.139Z",
        //                 checksum: 740786981
        //             }
        //         ]
        //     }
        //
        const action = this.safeString (message, 'action');
        const data = this.safeValue (message, 'data', []);
        const table = this.safeString (message, 'table');
        if (action === 'partial') {
            for (let i = 0; i < data.length; i++) {
                const update = data[i];
                const marketId = this.safeString (update, 'instrument_id');
                if (marketId in this.markets_by_id) {
                    const market = this.markets_by_id[marketId];
                    const symbol = market['symbol'];
                    const options = this.safeValue (this.options, 'watchOrderBook', {});
                    // default limit is 400 bidasks
                    const limit = this.safeInteger (options, 'limit', 400);
                    const orderbook = this.orderBook ({}, limit);
                    this.orderbooks[symbol] = orderbook;
                    this.handleOrderBookMessage (client, update, orderbook);
                    const messageHash = table + ':' + marketId;
                    client.resolve (orderbook, messageHash);
                }
            }
        } else {
            for (let i = 0; i < data.length; i++) {
                const update = data[i];
                const marketId = this.safeString (update, 'instrument_id');
                if (marketId in this.markets_by_id) {
                    const market = this.markets_by_id[marketId];
                    const symbol = market['symbol'];
                    if (symbol in this.orderbooks) {
                        const orderbook = this.orderbooks[symbol];
                        this.handleOrderBookMessage (client, update, orderbook);
                        const messageHash = table + ':' + marketId;
                        client.resolve (orderbook, messageHash);
                    }
                }
            }
        }
        return message;
    }

    handleHeartbeat (client, message) {
        //
        // every second (approx) if no other updates are sent
        //
        //     { "event": "heartbeat" }
        //
        const event = this.safeString (message, 'event');
        client.resolve (message, event);
    }

    handleSystemStatus (client, message) {
        //
        // todo: answer the question whether handleSystemStatus should be renamed
        // and unified as handleStatus for any usage pattern that
        // involves system status and maintenance updates
        //
        //     {
        //         event: 'info',
        //         version: 2,
        //         serverId: 'e293377e-7bb7-427e-b28c-5db045b2c1d1',
        //         platform: { status: 1 }, // 1 for operative, 0 for maintenance
        //     }
        //
        return message;
    }

    handleSubscriptionStatus (client, message) {
        //
        //     {"event":"subscribe","channel":"spot/depth:BTC-USDT"}
        //
        // const channel = this.safeString (message, 'channel');
        // client.subscriptions[channel] = message;
        return message;
    }

    signMessage (client, messageHash, message, params = {}) {
        // todo: bitfinex signMessage not implemented yet
        return message;
    }

    handleErrorMessage (client, message) {
        //
        //     {"event":"error","message":"Unrecognized request: {\"event\":\"subscribe\",\"channel\":\"spot/depth:BTC-USDT\"}","errorCode":30039}
        //
        return message;
    }

    handleMessage (client, message) {
        if (!this.handleErrorMessage (client, message)) {
            return;
        }
        //
        //     {"event":"error","message":"Unrecognized request: {\"event\":\"subscribe\",\"channel\":\"spot/depth:BTC-USDT\"}","errorCode":30039}
        //     {"event":"subscribe","channel":"spot/depth:BTC-USDT"}
        //     {
        //         table: "spot/depth",
        //         action: "partial",
        //         data: [
        //             {
        //                 instrument_id:   "BTC-USDT",
        //                 asks: [
        //                     ["5301.8", "0.03763319", "1"],
        //                     ["5302.4", "0.00305", "2"],
        //                 ],
        //                 bids: [
        //                     ["5301.7", "0.58911427", "6"],
        //                     ["5301.6", "0.01222922", "4"],
        //                 ],
        //                 timestamp: "2020-03-16T03:25:00.440Z",
        //                 checksum: -2088736623
        //             }
        //         ]
        //     }
        //
        const table = this.safeString (message, 'table');
        if (table === undefined) {
            const event = this.safeString (message, 'event');
            if (event !== undefined) {
                const methods = {
                    // 'info': this.handleSystemStatus,
                    // 'book': 'handleOrderBook',
                    'subscribe': this.handleSubscriptionStatus,
                };
                const method = this.safeValue (methods, event);
                if (method === undefined) {
                    log (message);
                    process.exit ();
                    return message;
                } else {
                    return method.call (this, client, message);
                }
            }
        } else {
            const parts = table.split ('/');
            const name = this.safeString (parts, 1);
            const methods = {
                'depth': this.handleOrderBook,
                'ticker': this.handleTicker,
                // ...
            }
            const method = this.safeValue (methods, name);
            if (method === undefined) {
                console.log ('handleMessage', message);
                process.exit ();
                return message;
            } else {
                return method.call (this, client, message);
            }
        }
    }
};
