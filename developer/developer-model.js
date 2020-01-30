// * PKGS && DB
const DBSt = require('../database/dbSTConfig')
const { attachPaginate } = require('knex-paginate');

// * INITIALIZE KNEX-PAGINATE
attachPaginate();

module.exports = {
  getSautiData,
  latestPriceByMarket,
  latestPriceAcrossAllMarkets,
  getProductPriceRange,
  getListsOfThings
}
// Helper function with filter searches for developer
// Notes:
// Flexible by allowing user to select whichever query they want
// Used whereIn in the if/else if statements so that the query can be turned into an array
// if/else if statements used for countries, markets, etc. for single selection and multiple selection
async function getSautiData(query) {

  // * VARIABLES FROM ARGUMENT (query)
  const {
    startDate,
    endDate,
    count,
    next
  } = query

  // * INITIAL DB FROM (platform_market_prices2)
  let queryOperation = DBSt('platform_market_prices2')

  // * PAGINATION OPERATION
  const paginate = async (perPage, currentPage) => await queryOperation
    .where('active', (query.a = 1))
    .orderBy('date', 'desc')
    .orderBy('id', 'desc')
    .paginate({
      perPage,
      currentPage
    })

  // * IF QUERY === TRUE, CHECK FOR FILTER OPTIONS, AND UPDATE DATA RESULTS.
  const filterQueryOperation = (query) => {
    // ? QUERY OPERATION EXPRESSION FOR QUERY VALUE IF TRUTHY.
    const assignment = (key, query) => {
      if (query && !Array.isArray(query)) {
        queryOperation = queryOperation.whereIn(key, [query])
      } else if (query && Array.isArray(query)) {
        queryOperation = queryOperation.whereIn(key, query)
      }
    }

    // ? FILTER QUERY OPERATION BASED ON FILTER OPTIONS
    if (query.c) assignment('country', query.c)
    if (query.m) assignment('market', query.m)
    if (query.pcat) assignment('product_cat', query.pcat)
    if (query.pagg) assignment('product_agg', query.pagg)
    if (query.p) assignment('product', query.p)
  };

  // ? IF QUERY IS TRUTHY, CHECK FOR FILTER OPTIONS
  if (query) filterQueryOperation(query);

  queryOperation = queryOperation.select(
    'id',
    'country',
    'market',
    'source',
    'product_cat',
    'product_agg',
    'product',
    'retail',
    'wholesale',
    'currency',
    'unit',
    'date',
    'udate'
  )

  if (startDate && endDate) {
    queryOperation = queryOperation.andWhereBetween('date', [
      startDate,
      endDate
    ])
  }

  const recentRecordDate = await queryOperation
    .where('active', (query.a = 1))
    .orderBy('date', 'desc')
    .orderBy('id', 'desc')
    .then(result => {
      return result[0].date
    })


  if (count && next) {
    return {
      data: await paginate(count, next),
      recentRecordDate: recentRecordDate
    }
  } else if (count) {
    return {
      data: await paginate(count, 1),
      recentRecordDate: recentRecordDate
    }
  } else if (next) {
    return {
      data: await paginate(30, next),
      recentRecordDate: recentRecordDate
    }
  } else {
    return {
      data: await paginate(30, 1),
      recentRecordDate: recentRecordDate
    }
  }
}


// fn to get the latest price for a product across all markets //
async function latestPriceAcrossAllMarkets(query) {
  const {
    product
  } = query
  const records = await DBSt.schema.raw(
    `SELECT pmp.source, pmp.market, pmp.product, pmp.retail, pmp.wholesale, pmp.currency, pmp.date, pmp.udate FROM platform_market_prices2 AS pmp INNER JOIN
    (
        SELECT max(date) as maxDate, market, product, retail, currency, wholesale, source, udate
       FROM platform_market_prices2
       WHERE product=?
       GROUP BY market
   ) p2
   ON pmp.market = p2.market
    AND pmp.date = p2.maxDate
     WHERE pmp.product=?
     order by pmp.date desc`,
    [product, product]
  )
  return {
    records: records[0],
    recentRecordDate: records[0][0].date,
  }
}
// fn to get the latest price for a product by market //
async function latestPriceByMarket(query) {
  const {
    product,
    market
  } = query
  let queryOperation = DBSt('platform_market_prices2')
  const queryResult = await queryOperation
    .select(
      'market',
      'source',
      'country',
      'currency',
      'product',
      'retail',
      'wholesale',
      'date',
      'udate'
    )
    .where('product', `${product}`)
    .andWhere('market', `${market}`)
    .orderBy('date', 'desc')
    .limit(1)
  const result = [queryResult[0]]
  return {
    records: result,
    recentRecordDate: result[0].date
  }
}
// fn that returns a list of items, markets by default //
function getListsOfThings(query, selector) {
  let queryOperation = DBSt('platform_market_prices2')
  if (query === undefined) {
    query = 'market'
  }
  switch (query.toLowerCase()) {
    case 'market':
      return queryOperation.distinct('market').orderBy('market')
    case 'country':
      return queryOperation.distinct('country').orderBy('country')
    case 'source':
      return queryOperation.distinct('source').orderBy('source')
    case 'product':
      return queryOperation.distinct('product').orderBy('product')
    default:
      return queryOperation.distinct('market').orderBy('market')
  }
}
// fn that returns records for a product via date range, with pagination //
async function getProductPriceRange(query) {
  let {
    product,
    startDate,
    endDate,
    count
  } = query
  let entries
  let totalCount
  if (query.next) {
    const cursorArray = query.next.split('_')
    const nextDate = new Date(cursorArray[0])
    const nextId = cursorArray[1]
    let queryOperation = DBSt('platform_market_prices2')
      .select('*')
      .where('product', product)
      .andWhereBetween('date', [startDate, endDate])
    entries = await queryOperation
      .where(function () {
        this.whereRaw('date < ?', [nextDate]).orWhere(function () {
          this.whereRaw('date = ?', [nextDate]).andWhereRaw('id <= ?', [nextId])
        })
      })
      .where('active', (query.a = 1))
      .orderBy('date', 'desc')
      .orderBy('id', 'desc')
      .limit(Number(count) + 1)
  } else {
    let queryOperation = DBSt('platform_market_prices2')
      .select('*')
      .where('product', product)
      .andWhereBetween('date', [startDate, endDate])
    totalCount = await queryOperation.clone().count()
    entries = await queryOperation
      .where('active', (query.a = 1))
      .orderBy('date', 'desc')
      .orderBy('id', 'desc')
      .limit(Number(count) + 1)
  }
  const lastEntry = entries[entries.length - 1]
  entries.length ? (next = `${lastEntry.date}_${lastEntry.id}`) : (next = null)
  const entriesOffset = entries.splice(0, Number(count))
  const firstEntry = entriesOffset[0]
  entriesOffset.length ?
    (prev = `${firstEntry.date}_${firstEntry.id}`) :
    (prev = null)
  return {
    records: entriesOffset,
    next: next,
    prev: prev,
    count: totalCount
  }
}