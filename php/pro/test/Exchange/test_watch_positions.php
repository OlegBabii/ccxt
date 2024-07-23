<?php
namespace ccxt;

// ----------------------------------------------------------------------------

// PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
// https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

// -----------------------------------------------------------------------------
use React\Async;
use React\Promise;
include_once PATH_TO_CCXT . '/test/exchange/base/test_position.php';
include_once PATH_TO_CCXT . '/test/exchange/base/test_shared_methods.php';

function test_watch_positions($exchange, $skipped_properties, $symbol) {
    return Async\async(function () use ($exchange, $skipped_properties, $symbol) {
        $method = 'watchPositions';
        $now = $exchange->milliseconds();
        $ends = $now + 15000;
        while ($now < $ends) {
            $response = null;
            try {
                $response = Async\await($exchange->watch_positions([$symbol]));
            } catch(\Throwable $e) {
                if (!is_temporary_failure($e)) {
                    throw $e;
                }
                $now = $exchange->milliseconds();
                continue;
            }
            assert_non_emtpy_array($exchange, $skipped_properties, $method, $response, $symbol);
            $now = $exchange->milliseconds();
            for ($i = 0; $i < count($response); $i++) {
                test_position($exchange, $skipped_properties, $method, $response[$i], null, $now);
            }
            assert_timestamp_order($exchange, $method, $symbol, $response);
            //
            // Test with specific symbol
            //
            $positions_for_symbols = null;
            try {
                $positions_for_symbols = Async\await($exchange->watch_positions([$symbol]));
            } catch(\Throwable $e) {
                if (!is_temporary_failure($e)) {
                    throw $e;
                }
                $now = $exchange->milliseconds();
                continue;
            }
            assert(gettype($positions_for_symbols) === 'array' && array_keys($positions_for_symbols) === array_keys(array_keys($positions_for_symbols)), $exchange->id . ' ' . $method . ' must return an array, returned ' . $exchange->json($positions_for_symbols));
            // max theoretical 4 positions: two for one-way-mode and two for two-way mode
            assert(count($positions_for_symbols) <= 4, $exchange->id . ' ' . $method . ' positions length for particular symbol should be less than 4, returned ' . $exchange->json($positions_for_symbols));
            $now = $exchange->milliseconds();
            for ($i = 0; $i < count($positions_for_symbols); $i++) {
                test_position($exchange, $skipped_properties, $method, $positions_for_symbols[$i], $symbol, $now);
            }
            assert_timestamp_order($exchange, $method, $symbol, $positions_for_symbols);
        }
    }) ();
}
