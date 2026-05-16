/**
 * ELEVATE QA 2026 - MAIN SYNC MODULE (SUPABASE VERSION)
 * Handles Real-time synchronization from Supabase to Local UI.
 */
import { supabase } from './supabase-config.js';

export function initCloudSync() {
  console.log('[ElevateQA] ⚡ Supabase Sync Engine Starting...');
  
  const tables = ['branding', 'manifesto', 'speakers', 'agenda'];
  
  // 1. Initial Data Fetch
  tables.forEach(async (table) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false });

    if (error) {
      console.error(`[ElevateQA] Error fetching ${table}:`, error);
      return;
    }

    if (data) {
      console.log(`[ElevateQA] Initial data for ${table}:`, data);
      localStorage.setItem(`elevate_${table}`, JSON.stringify(data));
      if (typeof window.syncEverything === 'function') window.syncEverything();
    }
  });

  // 2. Real-time Subscriptions
  supabase.removeAllChannels().then(() => {
    tables.forEach((table) => {
      supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table: table }, (payload) => {
          console.log(`[ElevateQA] Real-time update for ${table}:`, payload);
          // Re-fetch entire table to keep order and structure simple
          fetchAndSync(table);
        })
        .subscribe();
    });
  });
}

async function fetchAndSync(table) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('display_order', { ascending: true, nullsFirst: false });

  if (data) {
    localStorage.setItem(`elevate_${table}`, JSON.stringify(data));
    if (typeof window.syncEverything === 'function') window.syncEverything();
  }
}
