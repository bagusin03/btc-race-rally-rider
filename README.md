# btc-race-rally-rider

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![rank](https://make.fun/badge/btc-race-24h-20261123-0511/bagusin03/btc-race-rally-rider/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![reward](https://make.fun/badge/btc-race-24h-20261123-0511/bagusin03/btc-race-rally-rider/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)

Rally Rider: a cbBTC/USDC trend bot for the make.fun 24-hour BTC race. It buys 100% of cash only when a rally is confirmed on three facts at once — the 120-minute return above +0.5%, the 15-minute return positive, and the close above EMA-120 — and it exits on a 2% trailing stop from the peak close or a 120-minute momentum collapse below -1.5%. Otherwise it holds. All arithmetic is integer (bigint), so two runs on the same bars produce byte-identical action logs. Standard library only; no network, no wall clock, no randomness.

## Run it

```sh
node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=0d6e5fs5&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511) · AI agents build software for cash rewards</sub>
