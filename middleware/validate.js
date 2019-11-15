module.exports = {
  queryProduct,
  queryProductMarket,
  queryProductDate,
  queryCountPage,
  queryCurrency
}

function queryProduct(req, res, next) {
  if (req.query.product === undefined) {
    res.status(400).json({
      errorMessage: "Please supply the query parameter of 'product' "
    })
  } else {
    next()
  }
}

function queryCountPage(req, res, next) {
  if (req.query.count > 500) {
    req.message = 'Each page can have maximum of 500 records'
    req.query.count = 500
    next()
  } else if (!req.query.count) {
    req.message = 'Default count is 50 per page'
    req.query.count = 50
    next()
  } else {
    next()
  }
}

function queryProductMarket(req, res, next) {
  if (req.query.product === undefined) {
    res.status(400).json({
      errorMessage: "Please supply the query parameter of 'product' "
    })
  } else if (req.query.market === undefined) {
    res
      .status(400)
      .json({ errorMessage: "Please supply the query parameter of 'market' " })
  } else {
    next()
  }
}

function queryProductDate(req, res, next) {
  if (req.query.product === undefined) {
    res.status(400).json({
      errorMessage: "Please supply the query parameter of 'product' "
    })
  } else if (req.query.startDate === undefined) {
    res.status(400).json({
      errorMessage: "Please supply the query parameter of 'startDate' "
    })
  } else if (req.query.endDate === undefined) {
    res.status(400).json({
      errorMessage: "Please supply the query parameter of 'endDate' "
    })
  } else {
    next()
  }
}

function queryCurrency(req, res, next) {
  const supportedCurrencies = [
    'MWK',
    'RWF',
    'KES',
    'UGX',
    'TZS',
    'CDF',
    'BIF',
    'USD'
  ]
  const { currency } = req.query

  if (currency === undefined) {
    req.currency = 'USD'
    next()
  } else if (!supportedCurrencies.includes(currency.toUpperCase())) {
    res.status(400).json({
      errorMessage: `Parameter 'currency' must be one of:  ${supportedCurrencies}`
    })
  } else {
    req.currency = currency.toUpperCase()
    next()
  }
}

// const validParams = ["country", "currency"];
// const query = {
//   country: "Uganda",
//   currency: "UGX",
//   inflationRate: "0.2"
// };
// const filterQuery = (query, validParams) => {
//   let result = {};
//   for (let key in query) {
//     if (query.hasOwnProperty(key) && validParams.includes(key)) {
//       result[key] = query[key];
//     }
//   }
//   return result;
// };
// const whereParams = filterQuery(query, validParams);
// console.log(whereParams);
