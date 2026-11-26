# Snowin Ventures — Quantitative Treasury & Market Microstructure Rules

## Strict Backtesting & Capital Management Guardrails
1. **Zero Look-Ahead Bias**: Never use negative shifts (`.shift(-N)`), future bar closes, or full-sample normalization before train/test splits when evaluating Limit Order Book (LOB) imbalances or Cumulative Volume Delta (CVD).
2. **Exact Currency Arithmetic**: Use `decimal.Decimal` or integer paise for INR treasury ledgers, margin calculations, brokerage, STT, and slippage — never binary `float()`.
3. **Transaction Cost Realism**: Every Sensex, Nifty, Silver, or Copper backtest must deduct realistic bid-ask spread, exchange fees, STT, and slippage before reporting Sharpe, Sortino, or Max Drawdown.
4. **Data Isolation**: Headless treasury and backtest runs execute with outbound web fetch disabled via `.gemini/policies/audit.toml`.
