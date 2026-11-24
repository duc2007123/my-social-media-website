import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Compass } from 'lucide-react';

// Fix Leaflet default icon paths in bundled environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export const LeafletMap = ({ locations = [], center = [16.0544, 108.2022], zoom = 6 }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      scrollWheelZoom: false
    });

    // Add OpenStreetMap TileLayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // Custom Emerald Marker Icon
    const customIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #059669, #0d9488);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(5, 150, 105, 0.4);
          border: 2px solid white;
          font-weight: bold;
          font-size: 14px;
        ">
          📍
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Add markers for locations
    if (locations && locations.length > 0) {
      locations.forEach((loc) => {
        if (loc.coordinates && loc.coordinates.lat && loc.coordinates.lng) {
          const popupContent = `
            <div style="font-family: sans-serif; padding: 4px; min-width: 140px;">
              <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">${loc.location || loc.name}</h4>
              ${loc.postCount ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #059669; font-weight: 600;">${loc.postCount} bài viết chia sẻ</p>` : ''}
              ${loc.avgCost ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Chi phí TB: ~${new Intl.NumberFormat('vi-VN').format(loc.avgCost)} đ</p>` : ''}
            </div>
          `;

          L.marker([loc.coordinates.lat, loc.coordinates.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(popupContent);
        }
      });
    }

    mapInstanceRef.current = map;

    // Cleanup Leaflet Map when unmounting (prevent memory leaks)
    return () => {
      map.remove();
    };
  }, [locations, center, zoom]);

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 z-10 flex items-center gap-1.5 text-xs font-bold text-slate-800">
        <Compass className="w-4 h-4 text-emerald-600" />
        Bản đồ Nhật ký Du lịch Việt Nam
      </div>
    </div>
  );
};

export default LeafletMap;
