import { NOTION_API, NOTION_HEADERS, FINNHUB_API, FINNHUB_HEADERS } from './const';
import { List } from 'notion-api-types/endpoints/global';
import type { Page, PageProperties } from 'notion-api-types/responses';

/**
 * Retrieve all pages that are stored in database
 * @returns Promise with list of pages
 */
async function getPages(): Promise<List<Page>> {
  const dbQuery: Response = await fetch(`${NOTION_API}/databases/${NOTION_DATABASE_ID}/query`, {
    headers: new Headers(NOTION_HEADERS),
    method: 'POST',
  });
  const pages: List<Page> = await dbQuery.json();
  return pages;
}

/**
 * Update ticker current price for every page
 * @returns Promise with void
 */
async function updateTickersPrice(): Promise<void> {
  // Retrieve pages
  const pages: List<Page> = await getPages();
  // Set new prices
  await Promise.all(
    pages.results.map(async (page: Page) => {
      const ticker: string = (page.properties.Ticker as PageProperties.Title).title[0].text.content;
      const fetchPrice: Response = await fetch(`${FINNHUB_API}/quote?symbol=${ticker}`, {
        method: 'GET',
        headers: new Headers(FINNHUB_HEADERS),
      });
      const price: number = ((await fetchPrice.json()) as Quote).c;
      if (price > 0) {
        (page.properties.Price as PageProperties.Number).number = price;
      }
    }),
  );
  // Update prices on notion
  await Promise.all(
    pages.results.map(
      async (page: Page) =>
        await fetch(`${NOTION_API}/pages/${page.id}`, {
          headers: new Headers(NOTION_HEADERS),
          method: 'PATCH',
          body: JSON.stringify({ properties: { Price: page.properties.Price } }),
        }),
    ),
  );
}

/**
 * Tracks worker execution time
 * @returns promise with response message
 */
export async function handleRequest(): Promise<Response> {
  const start: number = new Date().getTime();
  await updateTickersPrice();
  const elapsed: number = new Date().getTime() - start;
  return new Response(`finished tickers price update in ${elapsed} milliseconds`);
}
