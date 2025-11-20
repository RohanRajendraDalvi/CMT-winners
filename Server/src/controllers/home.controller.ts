import { Request, Response } from "express";

export default {
  home: (_req: Request, res: Response) => {
    res.send(`
      <html>
        <head>
          <title>Slip Map</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            body, html { margin: 0; padding: 0; height: 100%; }
            #map { height: 100%; width: 100%; }
            .popup-title { font-weight: bold; margin-bottom: 5px; }
            .popup-label { font-weight: bold; }
          </style>
        </head>

        <body>
          <div id="map"></div>

          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

          <script>
            async function loadSlips() {
              // Example center (Boston) – you can make this dynamic:
              const lat = 42.3601;
              const lon = -71.0589;
              const timestamp = new Date().toISOString();

              const url = \`/slip/map?lat=\${lat}&lon=\${lon}&timestamp=\${timestamp}\`;
              const response = await fetch(url);
              const data = await response.json();

              return { lat, lon, slips: data.data };
            }

            function createPopupHTML(slip) {
              const t = new Date(slip.timestamp).toLocaleString();

              const w = slip.weather;
              const main = w?.weather?.[0]?.main || "N/A";
              const desc = w?.weather?.[0]?.description || "";
              const temp = w?.main?.temp ?? "N/A";

              return \`
                <div class="popup-title">Slip Report</div>
                <div><span class="popup-label">Vehicle:</span> \${slip.vehicleId}</div>
                <div><span class="popup-label">Time:</span> \${t}</div>
                <div><span class="popup-label">Weather:</span> \${main} (\${desc})</div>
                <div><span class="popup-label">Temp:</span> \${temp}°C</div>
              \`;
            }

            async function initMap() {
              const { lat, lon, slips } = await loadSlips();

              const map = L.map('map').setView([lat, lon], 12);

              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
              }).addTo(map);

              // Add user center marker
              L.marker([lat, lon], { title: "Your Position" })
                .addTo(map)
                .bindPopup("<b>Your Location</b>");

              // Plot slips
              slips.forEach(slip => {
                const sLat = slip.geoPoint.coordinates[1];
                const sLon = slip.geoPoint.coordinates[0];

                L.marker([sLat, sLon])
                  .addTo(map)
                  .bindPopup(createPopupHTML(slip)); // popup on click
              });
            }

            initMap();
          </script>
        </body>
      </html>
    `);
  },
};
