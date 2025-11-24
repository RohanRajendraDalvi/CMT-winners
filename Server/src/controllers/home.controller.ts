import { Request, Response } from "express";

export default {
  home: (_req: Request, res: Response) => {
    res.send(`
      <html>
        <head>
          <title>Slip Map - Demo</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            body, html { 
              margin: 0; 
              padding: 0; 
              height: 100%; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            #map { 
              height: 100%; 
              width: 100%; 
            }
            
            .controls {
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 1000;
              background: white;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            
            .controls h3 {
              margin: 0 0 10px 0;
              font-size: 16px;
              color: #333;
            }
            
            .city-button {
              display: block;
              width: 100%;
              padding: 10px 15px;
              margin: 5px 0;
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              transition: background 0.3s;
            }
            
            .city-button:hover {
              background: #45a049;
            }
            
            .city-button.active {
              background: #2196F3;
            }
            
            .info-panel {
              position: absolute;
              bottom: 10px;
              left: 10px;
              z-index: 1000;
              background: white;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              max-width: 300px;
            }
            
            .info-panel h4 {
              margin: 0 0 8px 0;
              font-size: 14px;
              color: #333;
            }
            
            .info-item {
              font-size: 12px;
              margin: 4px 0;
              color: #666;
            }
            
            .info-label {
              font-weight: bold;
              color: #333;
            }
            
            .popup-title { 
              font-weight: bold; 
              margin-bottom: 5px; 
              font-size: 14px;
            }
            
            .popup-label { 
              font-weight: bold; 
            }
            
            .loading {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 2000;
              background: white;
              padding: 20px 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              font-size: 16px;
            }
          </style>
        </head>

        <body>
          <div id="loading" class="loading" style="display: none;">Loading...</div>
          
          <div class="controls">
            <h3>Select City</h3>
            <button class="city-button" data-city="nyc">New York City</button>
            <button class="city-button" data-city="denver">Denver, CO</button>
            <button class="city-button" data-city="montana">Rural Montana</button>
            <button class="city-button" data-city="boston">Boston, MA</button>
          </div>
          
          <div class="info-panel">
            <h4 id="city-name">Select a city</h4>
            <div class="info-item">
              <span class="info-label">Slips Found:</span> 
              <span id="slip-count">-</span>
            </div>
            <div class="info-item">
              <span class="info-label">Population:</span> 
              <span id="population">-</span>
            </div>
            <div class="info-item">
              <span class="info-label">Current Time:</span> 
              <span id="current-time">-</span>
            </div>
          </div>
          
          <div id="map"></div>

          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

          <script>
            const CITIES = {
              nyc: { 
                name: "New York City", 
                lat: 40.7128, 
                lon: -74.0060, 
                zoom: 11 
              },
              denver: { 
                name: "Denver, CO", 
                lat: 39.7392, 
                lon: -104.9903, 
                zoom: 11 
              },
              montana: { 
                name: "Rural Montana", 
                lat: 46.8797, 
                lon: -110.3626, 
                zoom: 10 
              },
              boston: { 
                name: "Boston, MA", 
                lat: 42.3601, 
                lon: -71.0589, 
                zoom: 11 
              }
            };

            let map = null;
            let markers = [];
            let centerMarker = null;
            let currentCity = null;

            function showLoading(show) {
              document.getElementById('loading').style.display = show ? 'block' : 'none';
            }

            function updateTime() {
              const now = new Date();
              document.getElementById('current-time').textContent = now.toLocaleString();
            }

            async function loadSlips(lat, lon) {
              const timestamp = new Date().toISOString();
              const url = \`/slip/map?lat=\${lat}&lon=\${lon}&timestamp=\${timestamp}\`;
              
              const response = await fetch(url);
              const data = await response.json();
              
              return data.data || [];
            }

            function createPopupHTML(slip) {
              const t = new Date(slip.timestamp).toLocaleString();
              const w = slip.weather;
              const main = w?.weather?.[0]?.main || "N/A";
              const desc = w?.weather?.[0]?.description || "";
              const temp = w?.main?.temp ?? "N/A";
              const hoursAgo = Math.round((Date.now() - new Date(slip.timestamp).getTime()) / (1000 * 60 * 60));

              return \`
                <div class="popup-title">Slip Report</div>
                <div><span class="popup-label">Vehicle:</span> \${slip.vehicleId}</div>
                <div><span class="popup-label">Time:</span> \${t} (\${hoursAgo}h ago)</div>
                <div><span class="popup-label">Weather:</span> \${main} (\${desc})</div>
                <div><span class="popup-label">Temp:</span> \${temp}°C</div>
              \`;
            }

            function clearMarkers() {
              markers.forEach(marker => map.removeLayer(marker));
              markers = [];
              if (centerMarker) {
                map.removeLayer(centerMarker);
                centerMarker = null;
              }
            }

            async function loadCity(cityKey) {
              const city = CITIES[cityKey];
              if (!city) return;

              showLoading(true);
              currentCity = cityKey;

              // Update active button
              document.querySelectorAll('.city-button').forEach(btn => {
                btn.classList.remove('active');
              });
              document.querySelector(\`[data-city="\${cityKey}"]\`).classList.add('active');

              // Update city name
              document.getElementById('city-name').textContent = city.name;

              try {
                // Load slips
                const slips = await loadSlips(city.lat, city.lon);

                // Clear old markers
                clearMarkers();

                // Center map
                map.setView([city.lat, city.lon], city.zoom);

                // Add center marker
                centerMarker = L.marker([city.lat, city.lon], { 
                  title: "Center Point",
                  icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                  })
                })
                  .addTo(map)
                  .bindPopup(\`<b>\${city.name}</b><br>Query Center Point\`);

                // Add slip markers
                slips.forEach(slip => {
                  const sLat = slip.geoPoint.coordinates[1];
                  const sLon = slip.geoPoint.coordinates[0];

                  const marker = L.marker([sLat, sLon], {
                    icon: L.icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })
                  })
                    .addTo(map)
                    .bindPopup(createPopupHTML(slip));

                  markers.push(marker);
                });

                // Update info panel
                document.getElementById('slip-count').textContent = slips.length;
                
                // Fetch population (you could also get this from the API)
                const popResponse = await fetch(\`/api/population?lat=\${city.lat}&lon=\${city.lon}\`);
                if (popResponse.ok) {
                  const popData = await popResponse.json();
                  document.getElementById('population').textContent = 
                    popData.population_per_km2.toLocaleString() + ' per km²';
                } else {
                  document.getElementById('population').textContent = 'N/A';
                }

              } catch (error) {
                console.error('Error loading city data:', error);
                alert('Error loading data for ' + city.name);
              } finally {
                showLoading(false);
              }
            }

            function initMap() {
              // Initialize map
              map = L.map('map').setView([40.7128, -74.0060], 4);

              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
              }).addTo(map);

              // Add button listeners
              document.querySelectorAll('.city-button').forEach(button => {
                button.addEventListener('click', (e) => {
                  const cityKey = e.target.getAttribute('data-city');
                  loadCity(cityKey);
                });
              });

              // Update time every second
              updateTime();
              setInterval(updateTime, 1000);

              // Load NYC by default
              loadCity('nyc');
            }

            initMap();
          </script>
        </body>
      </html>
    `);
  },
};