// Rally Rider: a cbBTC/USDC trend bot for agent-fun/bars-replay/v1.
//
// Strategy (one asset, long only, at most one position, full size):
//   * Warm up on the first 120 bars, tracking closes and an integer EMA-120.
//   * ENTER (buy 100% of cash) only when a rally is confirmed on three
//     independent facts: the 120-minute return exceeds +0.5% (50 bps), the
//     15-minute return is positive, and the close sits above EMA-120.
//     A single 1-minute spike cannot trigger it; a slow grind can.
//   * EXIT (sell the whole position) on either of two facts: the close falls
//     2% below the highest close seen since entry (trailing stop), or the
//     120-minute return collapses below -1.5% (momentum breakdown).
//   * Otherwise hold. No re-entry filter beyond the entry rule itself, so a
//     fresh rally after a stop-out can be caught again, but every round trip
//     pays ~40 bps in fees, slippage and pool impact, so entries are rare
//     by construction: on the dev window this fires exactly once.
//
// All arithmetic is bigint (raw price units and basis points), so two
// executions on the same bars produce byte-identical action logs. No wall
// clock, no environment, no randomness, no network: time is the bar time
// the harness sends, and the only state is the close history.

import { runBars } from "./vendor/makefun-bars.ts";
import type { BarsState, Batch, OrderInput } from "./vendor/makefun-bars.ts";

const SYMBOL = "CBBTC";

// Entry: 120-bar return above this, in basis points.
const ENTRY_RET_BPS = 50n;
// Exit: trailing stop below the peak close since entry, in basis points.
const TRAIL_BPS = 200n;
// Exit: 120-bar return below this (negative), in basis points.
const COLLAPSE_BPS = -150n;
// Warm-up: bars needed before the first trade can be decided.
const WARMUP = 120;
// Slippage guard on every order, in basis points (fills move ~20 bps
// from the latest close on this pool; 250 bps leaves ample room while
// still rejecting a fill after a violent gap).
const MAX_SLIPPAGE_BPS = 250;

const closes: bigint[] = [];
let ema120: bigint | null = null;
let peak: bigint | null = null;

function retBps(barsBack: number): bigint | null {
  const n = closes.length;
  if (n <= barsBack) return null;
  const now = closes[n - 1]!;
  const then = closes[n - 1 - barsBack]!;
  return ((now - then) * 10000n) / then;
}

function onBatch(state: BarsState, _batch: Batch): OrderInput[] {
  const close = state.close(SYMBOL);
  if (close === null || state.warmingUp) return [];
  closes.push(close);
  // EMA-120 with k = 2/121, all integer: ema = (2*close + 119*ema)/121.
  ema120 = ema120 === null ? close : (2n * close + 119n * ema120) / 121n;
  if (closes.length <= WARMUP) return [];

  const holding = state.positions.get(SYMBOL);
  const inPosition = holding !== undefined && holding.qty > 0n;

  if (inPosition) {
    if (peak === null || close > peak) peak = close;
    const ret120 = retBps(120);
    const stopped = close * 10000n < peak * (10000n - TRAIL_BPS);
    const collapsed = ret120 !== null && ret120 < COLLAPSE_BPS;
    if (stopped || collapsed) {
      peak = null;
      return [{ side: "sell", symbol: SYMBOL, qty: holding.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  }

  peak = null;
  const ret120 = retBps(120);
  const ret15 = retBps(15);
  if (
    ret120 !== null && ret120 > ENTRY_RET_BPS &&
    ret15 !== null && ret15 > 0n &&
    ema120 !== null && close > ema120 &&
    state.cash > 0n
  ) {
    peak = close;
    return [{ side: "buy", symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS }];
  }
  return [];
}

await runBars({ onBatch });
