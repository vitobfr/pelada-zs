import { getStore } from '@netlify/blobs';

const STORE_NAME = 'pelada_db';

export async function readDB(key, fallback = null) {
  try {
    const store = getStore({
      name: STORE_NAME,
      siteID: '08347005-3a00-42df-9018-1c6da12ba3ee',
      token: 'nfp_8i6GEq3XFhm614isNimwHYbnQwiuJKjAc1ab'
    });
    const data = await store.get(key, { type: 'json' });
    return data != null ? data : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from db:`, error);
    return fallback;
  }
}

export async function writeDB(key, data) {
  try {
    const store = getStore({
      name: STORE_NAME,
      siteID: '08347005-3a00-42df-9018-1c6da12ba3ee',
      token: 'nfp_8i6GEq3XFhm614isNimwHYbnQwiuJKjAc1ab'
    });
    await store.setJSON(key, data);
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to db:`, error);
    return false;
  }
}
