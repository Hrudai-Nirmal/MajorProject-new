/** Group disclosures for one selectable company while preserving alphabetical browsing. */

/** Return one option per market and ticker, with newest disclosures first. */
function getCompanyOptions(documents) {
  const companies = new Map();
  const companyKeys = new Map();
  const tickerKeys = new Map();
  for (const document of documents) {
    const companyKey = `${document.market}:${document.company.trim().toLocaleLowerCase()}`;
    const tickerKey = `${document.market}:${document.ticker.toLocaleUpperCase()}`;
    const key = tickerKeys.get(tickerKey) || companyKeys.get(companyKey) || tickerKey;
    if (!companies.has(key)) companies.set(key, {company: document.company, ticker: document.ticker, market: document.market, documents: []});
    companies.get(key).documents.push(document);
    companyKeys.set(companyKey, key);
    tickerKeys.set(tickerKey, key);
  }
  return [...companies.values()]
    .map(option => ({...option, documents: option.documents.sort((left, right) => right.created_at?.localeCompare(left.created_at || "") || 0)}))
    .sort((left, right) => left.company.localeCompare(right.company) || left.ticker.localeCompare(right.ticker));
}

/** Match a name or ticker without changing the visible alphabetical order. */
function searchCompanies(options, query, market) {
  const normalized = String(query || "").trim().toLocaleLowerCase();
  return options.filter(option => (!market || option.market === market) && (
    !normalized || option.company.toLocaleLowerCase().includes(normalized) || option.documents.some(document => document.ticker.toLocaleLowerCase().includes(normalized))
  ));
}

module.exports = {getCompanyOptions, searchCompanies};
