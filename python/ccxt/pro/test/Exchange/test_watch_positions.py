import os
import sys

root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.append(root)

# ----------------------------------------------------------------------------

# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

# ----------------------------------------------------------------------------
# -*- coding: utf-8 -*-

from ccxt.test.exchange.base import test_position  # noqa E402
from ccxt.test.exchange.base import test_shared_methods  # noqa E402

async def test_watch_positions(exchange, skipped_properties, symbol):
    method = 'watchPositions'
    now = exchange.milliseconds()
    ends = now + 15000
    while now < ends:
        response = None
        try:
            response = await exchange.watch_positions([symbol])
        except Exception as e:
            if not test_shared_methods.is_temporary_failure(e):
                raise e
            now = exchange.milliseconds()
            continue
        test_shared_methods.assert_non_emtpy_array(exchange, skipped_properties, method, response, symbol)
        now = exchange.milliseconds()
        for i in range(0, len(response)):
            test_position(exchange, skipped_properties, method, response[i], None, now)
        test_shared_methods.assert_timestamp_order(exchange, method, symbol, response)
        #
        # Test with specific symbol
        #
        positions_for_symbols = None
        try:
            positions_for_symbols = await exchange.watch_positions([symbol])
        except Exception as e:
            if not test_shared_methods.is_temporary_failure(e):
                raise e
            now = exchange.milliseconds()
            continue
        assert isinstance(positions_for_symbols, list), exchange.id + ' ' + method + ' must return an array, returned ' + exchange.json(positions_for_symbols)
        # max theoretical 4 positions: two for one-way-mode and two for two-way mode
        assert len(positions_for_symbols) <= 4, exchange.id + ' ' + method + ' positions length for particular symbol should be less than 4, returned ' + exchange.json(positions_for_symbols)
        now = exchange.milliseconds()
        for i in range(0, len(positions_for_symbols)):
            test_position(exchange, skipped_properties, method, positions_for_symbols[i], symbol, now)
        test_shared_methods.assert_timestamp_order(exchange, method, symbol, positions_for_symbols)
