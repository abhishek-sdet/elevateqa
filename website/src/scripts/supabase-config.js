/**
 * ELEVATE QA 2026 - API ADAPTER CONFIG
 * Decoupled client stub: All communication is routed to the local/remote backend REST API.
 * No database credentials or engine internals are exposed to the client.
 */

class ChannelStub {
  on() { return this; }
  subscribe(cb) {
    if (typeof cb === 'function') setTimeout(() => cb('SUBSCRIBED'), 0);
    return this;
  }
}

export const supabase = {
  channel: () => new ChannelStub(),
  from: (table) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => Promise.resolve({ data: [], error: null }),
  }),
  auth: {
    signInWithOtp: () => Promise.resolve({ error: null })
  }
};
