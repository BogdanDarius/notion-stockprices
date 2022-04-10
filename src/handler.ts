import { NOTION_API, NOTION_HEADERS, FINNHUB_API, FINNHUB_HEADERS } from './const';
import { List } from 'notion-api-types/endpoints/global';
import type { Page, PageProperties } from 'notion-api-types/responses';

/**
 * Retrieve id for all pages that are stored in database
 * @returns Promise with ids
 */
async function getPagesId(): Promise<string[]> {
  const dbQuery: Response = await fetch(`${NOTION_API}/databases/${NOTION_DATABASE_ID}/query`, {
    headers: new Headers(NOTION_HEADERS),
    method: 'POST',
  });
  const pages: List<Page> = await dbQuery.json();
  const ids: string[] = [];
  for (let i = 0; i < pages.results.length; i++) {
    ids.push(pages.results[i].id);
  }
  return ids;
}

/**
 * Set ticker current price for every page
 * @returns Promise with pages
 */
async function setTickersPrice(): Promise<Page[]> {
  const pagesId: string[] = await getPagesId();
  const pages: Page[] = await Promise.all(
    pagesId.map(async (id: string) => {
      const fetchPage: Response = await fetch(`${NOTION_API}/pages/${id}`, {
        headers: new Headers(NOTION_HEADERS),
        method: 'GET',
      });
      const page: Page = await fetchPage.json();
      return page;
    }),
  );
  await Promise.all(
    pages.map(async (page: Page) => {
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
  return pages;
}

/**
 * Update ticker current price for every page
 * @returns Promise with void
 */
async function updateTickersPrice(): Promise<void> {
  const pages: Page[] = await setTickersPrice();
  await Promise.all(
    pages.map(async (page: Page) => {
      await fetch(`${NOTION_API}/pages/${page.id}`, {
        headers: new Headers(NOTION_HEADERS),
        method: 'PATCH',
        body: JSON.stringify({ properties: { Price: page.properties.Price } }),
      });
    }),
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
