// Child-process test hook only; production never imports this file.
globalThis.fetch = async (url) => {
  if (!String(url).startsWith('https://openexchangerates.org/api/latest.json?')) throw new Error('Unexpected external request');
  return new Response(JSON.stringify({ base: 'USD', rates: JSON.parse(process.env.TEST_PROVIDER_RATES) }));
};
