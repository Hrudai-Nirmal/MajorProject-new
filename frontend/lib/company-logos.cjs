/** Local PNGs from images.financialmodelingprep.com/symbol/{symbol}.png (Indian listings use .NS). */
const logoTickers = "AAPL ABNB BAJFINANCE BHARTIARTL CAT DIXON F GOOGL HDFCBANK HINDUNILVR IBM ICICIBANK INFY JPM KO LT MARUTI MSFT NVDA ONGC PFE PG RELIANCE SUNPHARMA TATAMOTORS TCS V VBL VZ WIPRO WMT XOM".split(" ");
const aliases = new Map([["HDFC","HDFCBANK"],["RIL","RELIANCE"],["SUN","SUNPHARMA"]]);
/** Resolve historical dataset aliases before selecting a bundled logo. */
function getLogoPath(ticker) {
  const symbol = String(ticker || "").trim().toUpperCase();
  const canonical = aliases.get(symbol) || symbol;
  return logoTickers.includes(canonical) ? "/logos/"+canonical+".png" : null;
}
module.exports = {getLogoPath,logoTickers};
