<?php

namespace ccxtpro;

// PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
// https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

use Exception; // a common import

class poloniex extends \ccxt\poloniex {

    use ClientTrait;

    public function describe () {
        return array_replace_recursive(parent::describe (), array(
            'has' => array(
                'ws' => true,
                'watchTicker' => true,
                'watchTickers' => false, // for now
                'watchTrades' => true,
                'watchOrderBook' => true,
                'watchBalance' => false, // not implemented yet
                'watchOHLCV' => false, // missing on the exchange side
            ),
            'urls' => array(
                'api' => array(
                    'ws' => 'wss://api2.poloniex.com',
                ),
            ),
            'options' => array(
                'tradesLimit' => 1000,
            ),
        ));
    }

    public function handle_tickers ($client, $message) {
        //
        //     array(
        //         1002,
        //         null,
        //         array(
        //             50,               // currency pair id
        //             '0.00663930',     // $last trade price
        //             '0.00663924',     // lowest ask
        //             '0.00663009',     // highest bid
        //             '0.01591824',     // percent $change in $last 24 hours
        //             '176.03923205',   // 24h base volume
        //             '26490.59208176', // 24h quote volume
        //             0,                // is frozen
        //             '0.00678580',     // highest price
        //             '0.00648216'      // lowest price
        //         )
        //     )
        //
        $channelId = $this->safe_string($message, 0);
        $subscribed = $this->safe_value($message, 1);
        if ($subscribed) {
            // skip subscription confirmation
            return;
        }
        $ticker = $this->safe_value($message, 2);
        $numericId = $this->safe_string($ticker, 0);
        $market = $this->safe_value($this->options['marketsByNumericId'], $numericId);
        if ($market === null) {
            // todo handle $market not found, reject corresponging futures
            return;
        }
        $symbol = $this->safe_string($market, 'symbol');
        $timestamp = $this->milliseconds ();
        $open = null;
        $change = null;
        $average = null;
        $last = $this->safe_float($ticker, 1);
        $relativeChange = $this->safe_float($ticker, 4);
        if ($relativeChange !== -1) {
            $open = $last / $this->sum (1, $relativeChange);
            $change = $last - $open;
            $average = $this->sum ($last, $open) / 2;
        }
        $result = array(
            'symbol' => $symbol,
            'timestamp' => $timestamp,
            'datetime' => $this->iso8601 ($timestamp),
            'high' => $this->safe_float($ticker, 8),
            'low' => $this->safe_float($ticker, 9),
            'bid' => $this->safe_float($ticker, 3),
            'bidVolume' => null,
            'ask' => $this->safe_float($ticker, 2),
            'askVolume' => null,
            'vwap' => null,
            'open' => $open,
            'close' => $last,
            'last' => $last,
            'previousClose' => null,
            'change' => $change,
            'percentage' => $relativeChange * 100,
            'average' => $average,
            'baseVolume' => $this->safe_float($ticker, 6),
            'quoteVolume' => $this->safe_float($ticker, 5),
            'info' => $ticker,
        );
        $this->tickers[$symbol] = $result;
        $messageHash = $channelId . ':' . $numericId;
        $client->resolve ($result, $messageHash);
    }

    public function watch_balance ($params = array ()) {
        $this->load_markets();
        $this->balance = $this->fetchBalance ($params);
        $channelId = '1000';
        $subscribe = array(
            'command' => 'subscribe',
            'channel' => $channelId,
        );
        $messageHash = $channelId . ':b:e';
        $url = $this->urls['api']['ws'];
        return $this->watch($url, $messageHash, $subscribe, $channelId);
    }

    public function watch_ticker ($symbol, $params = array ()) {
        $this->load_markets();
        $market = $this->market ($symbol);
        $numericId = $this->safe_string($market, 'numericId');
        $channelId = '1002';
        $messageHash = $channelId . ':' . $numericId;
        $url = $this->urls['api']['ws'];
        $subscribe = array(
            'command' => 'subscribe',
            'channel' => $channelId,
        );
        return $this->watch($url, $messageHash, $subscribe, $channelId);
    }

    public function watch_tickers ($symbols = null, $params = array ()) {
        $this->load_markets();
        $channelId = '1002';
        $messageHash = $channelId;
        $url = $this->urls['api']['ws'];
        $subscribe = array(
            'command' => 'subscribe',
            'channel' => $channelId,
        );
        $future = $this->watch($url, $messageHash, $subscribe, $channelId);
        return $this->after ($future, $this->filterByArray, 'symbol', $symbols);
    }

    public function load_markets ($reload = false, $params = array ()) {
        $markets = parent::load_markets($reload, $params);
        $marketsByNumericId = $this->safe_value($this->options, 'marketsByNumericId');
        if (($marketsByNumericId === null) || $reload) {
            $marketsByNumericId = array();
            for ($i = 0; $i < count($this->symbols); $i++) {
                $symbol = $this->symbols[$i];
                $market = $this->markets[$symbol];
                $numericId = $this->safe_string($market, 'numericId');
                $marketsByNumericId[$numericId] = $market;
            }
            $this->options['marketsByNumericId'] = $marketsByNumericId;
        }
        return $markets;
    }

    public function watch_trades ($symbol, $since = null, $limit = null, $params = array ()) {
        $this->load_markets();
        $market = $this->market ($symbol);
        $numericId = $this->safe_string($market, 'numericId');
        $messageHash = 'trades:' . $numericId;
        $url = $this->urls['api']['ws'];
        $subscribe = array(
            'command' => 'subscribe',
            'channel' => $numericId,
        );
        $future = $this->watch($url, $messageHash, $subscribe, $numericId);
        return $this->after ($future, array($this, 'filter_by_since_limit'), $since, $limit, 'timestamp', true);
    }

    public function watch_order_book ($symbol, $limit = null, $params = array ()) {
        $this->load_markets();
        $market = $this->market ($symbol);
        $numericId = $this->safe_string($market, 'numericId');
        $messageHash = 'orderbook:' . $numericId;
        $url = $this->urls['api']['ws'];
        $subscribe = array(
            'command' => 'subscribe',
            'channel' => $numericId,
        );
        $future = $this->watch($url, $messageHash, $subscribe, $numericId);
        return $this->after ($future, array($this, 'limit_order_book'), $symbol, $limit, $params);
    }

    public function limit_order_book ($orderbook, $symbol, $limit = null, $params = array ()) {
        return $orderbook->limit ($limit);
    }

    public function watch_heartbeat ($params = array ()) {
        $this->load_markets();
        $channelId = '1010';
        $url = $this->urls['api']['ws'];
        return $this->watch($url, $channelId);
    }

    public function sign_message ($client, $messageHash, $message, $params = array ()) {
        if (mb_strpos($messageHash, '1000') === 0) {
            $throwOnError = false;
            if ($this->check_required_credentials($throwOnError)) {
                $nonce = $this->nonce ();
                $payload = $this->urlencode (array( 'nonce' => $nonce ));
                $signature = $this->hmac ($this->encode ($payload), $this->encode ($this->secret), 'sha512');
                $message = array_merge($message, array(
                    'key' => $this->apiKey,
                    'payload' => $payload,
                    'sign' => $signature,
                ));
            }
        }
        return $message;
    }

    public function handle_heartbeat ($client, $message) {
        //
        // every second (approx) if no other updates are sent
        //
        //     array( 1010 )
        //
        $channelId = '1010';
        $client->resolve ($message, $channelId);
    }

    public function handle_trade ($client, $trade, $market = null) {
        //
        // public trades
        //
        //     array(
        //         "t", // $trade
        //         "42706057", // $id
        //         1, // 1 = buy, 0 = sell
        //         "0.05567134", // $price
        //         "0.00181421", // $amount
        //         1522877119, // $timestamp
        //     )
        //
        $id = $this->safe_string($trade, 1);
        $isBuy = $this->safe_integer($trade, 2);
        $side = $isBuy ? 'buy' : 'sell';
        $price = $this->safe_float($trade, 3);
        $amount = $this->safe_float($trade, 4);
        $timestamp = $this->safe_timestamp($trade, 5);
        $symbol = null;
        if ($market !== null) {
            $symbol = $market['symbol'];
        }
        return array(
            'info' => $trade,
            'timestamp' => $timestamp,
            'datetime' => $this->iso8601 ($timestamp),
            'symbol' => $symbol,
            'id' => $id,
            'order' => null,
            'type' => null,
            'takerOrMaker' => null,
            'side' => $side,
            'price' => $price,
            'amount' => $amount,
            'cost' => $price * $amount,
            'fee' => null,
        );
    }

    public function handle_order_book_and_trades ($client, $message) {
        //
        // first response
        //
        //     [
        //         14, // channelId === $market['numericId']
        //         8767, // $nonce
        //         array(
        //             array(
        //                 "$i", // initial $snapshot
        //                 {
        //                     "currencyPair" => "BTC_BTS",
        //                     "orderBook" => array(
        //                         array( "0.00001853" => "2537.5637", "0.00001854" => "1567238.172367" ), // asks, $price, size
        //                         array( "0.00001841" => "3645.3647", "0.00001840" => "1637.3647" ) // bids
        //                     )
        //                 }
        //             )
        //         )
        //     ]
        //
        // subsequent updates
        //
        //     array(
        //         14,
        //         8768,
        //         array(
        //             array( "o", 1, "0.00001823", "5534.6474" ), // $orderbook $delta, bids, $price, size
        //             array( "o", 0, "0.00001824", "6575.464" ), // $orderbook $delta, asks, $price, size
        //             array( "t", "42706057", 1, "0.05567134", "0.00181421", 1522877119 ) // $trade, id, $side (1 for buy, 0 for sell), $price, size, timestamp
        //         )
        //     )
        //
        $marketId = (string) $message[0];
        $nonce = $message[1];
        $data = $message[2];
        $market = $this->safe_value($this->options['marketsByNumericId'], $marketId);
        $symbol = $this->safe_string($market, 'symbol');
        $orderbookUpdatesCount = 0;
        $tradesCount = 0;
        $stored = $this->safe_value($this->trades, $symbol, array());
        for ($i = 0; $i < count($data); $i++) {
            $delta = $data[$i];
            if ($delta[0] === 'i') {
                $snapshot = $this->safe_value($delta[1], 'orderBook', array());
                $sides = array( 'asks', 'bids' );
                $this->orderbooks[$symbol] = $this->order_book();
                $orderbook = $this->orderbooks[$symbol];
                for ($j = 0; $j < count($snapshot); $j++) {
                    $side = $sides[$j];
                    $bookside = $orderbook[$side];
                    $orders = $snapshot[$j];
                    $prices = is_array($orders) ? array_keys($orders) : array();
                    for ($k = 0; $k < count($prices); $k++) {
                        $price = $prices[$k];
                        $amount = $orders[$price];
                        $bookside->store (floatval ($price), floatval ($amount));
                    }
                }
                $orderbook['nonce'] = $nonce;
                $orderbookUpdatesCount = $this->sum ($orderbookUpdatesCount, 1);
            } else if ($delta[0] === 'o') {
                $orderbook = $this->orderbooks[$symbol];
                $side = $delta[1] ? 'bids' : 'asks';
                $bookside = $orderbook[$side];
                $price = floatval ($delta[2]);
                $amount = floatval ($delta[3]);
                $bookside->store ($price, $amount);
                $orderbookUpdatesCount = $this->sum ($orderbookUpdatesCount, 1);
                $orderbook['nonce'] = $nonce;
            } else if ($delta[0] === 't') {
                $trade = $this->handle_trade($client, $delta, $market);
                $stored[] = $trade;
                $storedLength = is_array($stored) ? count($stored) : 0;
                if ($storedLength > $this->options['tradesLimit']) {
                    array_shift($stored);
                }
                $tradesCount = $this->sum ($tradesCount, 1);
            }
        }
        if ($orderbookUpdatesCount) {
            // resolve the $orderbook future
            $messageHash = 'orderbook:' . $marketId;
            $orderbook = $this->orderbooks[$symbol];
            $client->resolve ($orderbook, $messageHash);
        }
        if ($tradesCount) {
            $this->trades[$symbol] = $stored;
            // resolve the trades future
            $messageHash = 'trades:' . $marketId;
            // todo => incremental trades
            $client->resolve ($this->trades[$symbol], $messageHash);
        }
    }

    public function handle_account_notifications ($client, $message) {
        // not implemented yet
        return $message;
    }

    public function handle_message ($client, $message) {
        $channelId = $this->safe_string($message, 0);
        $methods = array(
            // '<numericId>' => 'handleOrderBookAndTrades', // Price Aggregated Book
            '1000' => array($this, 'handle_account_notifications'), // Beta
            '1002' => array($this, 'handle_tickers'), // Ticker Data
            // '1003' => null, // 24 Hour Exchange Volume
            '1010' => array($this, 'handle_heartbeat'),
        );
        $method = $this->safe_value($methods, $channelId);
        if ($method === null) {
            $market = $this->safe_value($this->options['marketsByNumericId'], $channelId);
            if ($market === null) {
                return $message;
            } else {
                return $this->handle_order_book_and_trades($client, $message);
            }
        } else {
            $method($client, $message);
        }
    }
}
