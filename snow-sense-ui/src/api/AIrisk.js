const DEFAULT_SERVER =
  process.env.EXPO_PUBLIC_SERVER_URL ||
  process.env.SERVER_URL ||
  "http://localhost:5000";

const joinUrl = (base, path) =>
  `${base.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;


export const assessAIRisk = async (payload) => {
  const url = joinUrl(DEFAULT_SERVER, "/airisk/assess");
  console.log("[AIRiskService] URL:", url);

  const formData = new FormData();
  formData.append("vehicleId", payload.vehicleId);
  formData.append("lat", String(payload.lat));
  formData.append("lon", String(payload.lon));
  formData.append("timestamp", payload.timestamp || new Date().toISOString());

  // Web path: a real File object passed as payload.file
  if (typeof window !== 'undefined' && payload.file) {
    formData.append('image', payload.file);
  } else {
    // Native path: React Native file object with uri
    if (!payload.imageUri) {
      console.warn('[AIRiskService] Missing imageUri or file for assessment');
      return { success: false, error: 'No image provided' };
    }
    const filename = payload.imageUri.split('/').pop() || 'image.jpg';
    const filetype = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    formData.append('image', {
      uri: payload.imageUri,
      name: filename,
      type: filetype,
    });
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type manually; browser / RN sets boundary
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      console.warn('[AIRiskService] Server error:', res.status, data);
      return data || { success: false };
    }
    return data;
  } catch (err) {
    console.warn('[AIRiskService] Network error:', err);
    return { success: false, error: 'Network error' };
  }
};
