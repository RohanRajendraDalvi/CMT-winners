

const DEFAULT_SERVER = process.env.SERVER_URL || 'http://localhost:5000';

const joinUrl = (base, path) => `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;

export const reportSlip = async (payload) => {
  // If caller doesn't provide coordinates, fall back to the local mock behavior
  if (!payload || payload.lat === undefined || payload.lon === undefined) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 700);
    });
  }

  const url = joinUrl(DEFAULT_SERVER, '/slip/report');
  const body = {
    vehicleId: payload.vehicleId || 'unknown',
    lat: payload.lat,
    lon: payload.lon,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data && data.success) {
      return true;
    }

    console.warn('[slipService] reportSlip response not ok', res.status, data);
    return false;
  } catch (err) {
    console.warn('[slipService] reportSlip failed', err);
    return false;
  }
};

export const detectNearbySlips = async (opts = {}) => {
  // If lat/lon/timestamp are provided, try server endpoint; otherwise fallback to mock
  if (opts.lat === undefined || opts.lon === undefined || opts.timestamp === undefined) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomCount = Math.floor(Math.random() * 4); // 0–3 nearby slips
        resolve(randomCount);
      }, 900);
    });
  }

  const url = new URL(joinUrl(DEFAULT_SERVER, '/slip/map'));
  url.searchParams.set('lat', String(opts.lat));
  url.searchParams.set('lon', String(opts.lon));
  url.searchParams.set('timestamp', String(opts.timestamp));

  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    if (res.ok && data && data.success) {
      return data.count ?? 0;
    }
    console.warn('[slipService] detectNearbySlips response not ok', res.status, data);
    return 0;
  } catch (err) {
    console.warn('[slipService] detectNearbySlips failed', err);
    return 0;
  }
};
