type Quote = {
  c: number; // current price
  d: number | null; // change
  dp: number | null; // percent change
  h: number; // high price of the day
  l: number; // low price of the day
  o: number; // open price of the day
  pc: number; // previous close price
  t: number; // unix timestamp
};
