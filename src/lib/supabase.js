import { createClient } from '@supabase/supabase-js';

// Public Supabase URL & Anon Key (Safe for browser client with RLS)
const FALLBACK_SUPABASE_URL = 'https://xarcxbfgeoetyhpqsick.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhcmN4YmZnZW9ldHlocHFzaWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MTM1MjMsImV4cCI6MjEwOTE4OTUyM30.xQzKu3bL9Pzp3OeL6s2s9sEtTBQukr1y0XQSf21bzWI';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co')
    ? import.meta.env.VITE_SUPABASE_URL
    : FALLBACK_SUPABASE_URL;

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-key-here')
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : FALLBACK_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const CLOUD_MARKER = '__CNT_CLOUD_SYNC_V2__';
const LOCAL_PREFIX = 'cnt_cloud_cache_v2_';

/**
 * Load cached collection from localStorage (0ms instant load on refresh)
 */
export function loadLocalCache(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed reading localStorage cache for', key, err);
  }
  return fallbackValue;
}

/**
 * Save collection to localStorage
 */
export function saveLocalCache(key, value) {
  try {
    localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('Failed writing localStorage cache for', key, err);
  }
}

/**
 * Fetch the latest synced collections from Supabase Cloud across all devices
 * Returns an object: { tenures, divisions, members, events, galleries, kudosList, forms, submissions, pageVisibility, aspirasiList, activeTenureId }
 */
export async function fetchAllCloudState() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('kudos')
      .select('recipient_unit, message, created_at')
      .eq('sender_nip', CLOUD_MARKER)
      .order('created_at', { ascending: false })
      .limit(80);

    if (error || !data) {
      console.warn('Cloud state fetch error:', error);
      return null;
    }

    const latestByKey = {};
    for (const row of data) {
      const key = row.recipient_unit;
      if (key && !(key in latestByKey)) {
        try {
          latestByKey[key] = JSON.parse(row.message);
          saveLocalCache(key, latestByKey[key]);
        } catch (parseErr) {
          // Ignore malformed JSON
        }
      }
    }
    return latestByKey;
  } catch (err) {
    console.warn('Cloud state network error:', err);
    return null;
  }
}

/**
 * Push a collection snapshot to Supabase Cloud so all devices receive it
 */
export async function pushCloudState(key, value) {
  saveLocalCache(key, value);
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('kudos').insert({
      sender_name: '__CNT_CLOUD_SYNC__',
      sender_nip: CLOUD_MARKER,
      recipient_name: '__ALL_DEVICES__',
      recipient_unit: key,
      category: '__CLOUD_STATE__',
      message: JSON.stringify(value),
      is_approved: true
    });
    return !error;
  } catch (err) {
    console.warn('Failed pushing cloud state for', key, err);
    return false;
  }
}

/**
 * Safe concurrent append/merge for public submissions, kudos, or aspirasi
 * Fetches the latest list for `key` from cloud first, merges by `id`, then pushes
 */
export async function mergeAndPushCloudList(key, newItemOrUpdater, currentLocalList) {
  saveLocalCache(key, currentLocalList);
  if (!supabase) return currentLocalList;

  try {
    const { data } = await supabase
      .from('kudos')
      .select('message, created_at')
      .eq('sender_nip', CLOUD_MARKER)
      .eq('recipient_unit', key)
      .order('created_at', { ascending: false })
      .limit(1);

    let cloudList = [];
    if (data && data[0]?.message) {
      try {
        cloudList = JSON.parse(data[0].message);
      } catch (e) {}
    }

    // Merge currentLocalList + cloudList by unique id (preserving order of newest first)
    const mergedMap = new Map();
    for (const item of currentLocalList) {
      if (item && item.id) mergedMap.set(item.id, item);
    }
    for (const item of cloudList) {
      if (item && item.id && !mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    }

    const finalMerged = Array.from(mergedMap.values());
    saveLocalCache(key, finalMerged);
    await pushCloudState(key, finalMerged);
    return finalMerged;
  } catch (err) {
    await pushCloudState(key, currentLocalList);
    return currentLocalList;
  }
}
