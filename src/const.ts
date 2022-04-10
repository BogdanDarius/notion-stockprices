declare global {
  const NOTION_TOKEN: string;
  const NOTION_DATABASE_ID: string;
  const FINNHUB_TOKEN: string;
}

const NOTION_API = 'https://api.notion.com/v1';
const FINNHUB_API = 'https://finnhub.io/api/v1';
const NOTION_HEADERS = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  Accept: 'application/json',
  'Notion-Version': '2022-02-22',
  'Content-Type': 'application/json',
};
const FINNHUB_HEADERS = {
  Accept: 'application/json',
  'X-Finnhub-Token': FINNHUB_TOKEN,
  'Content-Type': 'application/json',
};

export { NOTION_API, FINNHUB_API, NOTION_HEADERS, FINNHUB_HEADERS };
