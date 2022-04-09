const notionAPI = 'https://api.notion.com/v1'
const finnhubAPI = 'https://finnhub.io/api/v1'
const notionHeaders = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  Accept: 'application/json',
  'Notion-Version': '2022-02-22',
  'Content-Type': 'application/json',
}
const finnhubHeaders = {
  Accept: 'application/json',
  'X-Finnhub-Token': FINNHUB_TOKEN,
  'Content-Type': 'application/json',
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Retrieve id for all pages that are stored in database
 * @returns ids
 */
async function getPagesId() {
  const dbQuery = await fetch(`${notionAPI}/databases/${NOTION_DATABASE_ID}/query`, {
    headers: notionHeaders,
    method: 'POST',
  })
  const pages = (await dbQuery.json()).results
  const ids = []
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].object === 'page') {
      ids.push(pages[i].id)
    }
  }
  return ids
}

/**
 * Set ticker current price for every page
 * @returns pages
 */
async function setTickersPrice() {
  const pagesId = await getPagesId()
  const pages = await Promise.all(
    pagesId.map(async (id) => {
      const fetchPage = await fetch(`${notionAPI}/pages/${id}`, { headers: notionHeaders, method: 'GET' })
      const page = await fetchPage.json()
      return {
        id: page.id,
        ticker: page.properties.Ticker.title[0].text.content,
        price: page.properties.Price.number,
      }
    }),
  )
  await Promise.all(
    pages.map(async (page) => {
      const fetchPrice = await fetch(`${finnhubAPI}/quote?symbol=${page.ticker}`, {
        method: 'GET',
        headers: finnhubHeaders,
      })
      const price = (await fetchPrice.json()).c
      if (price > 0) {
        page.price = price
      }
    }),
  )
  return pages
}

/**
 * Update ticker current price for every page
 */
async function updateTickersPrice() {
  const pages = await setTickersPrice()
  await Promise.all(
    pages.map((page) =>
      fetch(`${notionAPI}/pages/${page.id}`, {
        headers: notionHeaders,
        method: 'PATCH',
        body: JSON.stringify({ properties: { Price: { number: page.price } } }),
      }),
    ),
  )
}
/**
 * Respond with finished stock price update
 * @param {Request} request
 */
async function handleRequest(event) {
  console.time('update tickers price')
  await updateTickersPrice()
  console.timeEnd('update tickers price')
  return new Response('finished tickers price update')
}
