export const FINIK_BASE_URL =
  process.env.FINIK_ENV === 'prod'
    ? 'https://api.acquiring.averspay.kg'
    : 'https://beta.api.acquiring.averspay.kg';

export const FINIK_HOST = new URL(FINIK_BASE_URL).host;

