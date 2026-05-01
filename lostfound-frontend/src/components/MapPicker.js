import React, { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl:       require("leaflet/dist/images/marker-icon.png"),
  shadowUrl:     require("leaflet/dist/images/marker-shadow.png"),
});

const pinIcon = new L.DivIcon({
  className:  "custom-marker",
  html:       '<div class="marker-pin"></div>',
  iconSize:   [28, 36],
  iconAnchor: [14, 36],
});

const UB = [47.9077, 106.8832];

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) });
  return null;
}

function MapPicker({ onSelect }) {
  const [marker,  setMarker]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [found,   setFound]   = useState("");

  const handleClick = useCallback(async ({ lat, lng }) => {
    setMarker([lat, lng]);
    setLoading(true);
    setFound("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "mn,en" } }
      );
      const data = await res.json();
      const addr = data.address;
      const short = [
        addr?.road || addr?.neighbourhood || addr?.suburb,
        addr?.city_district || addr?.county || addr?.city,
      ].filter(Boolean).join(", ") || data.display_name?.split(",").slice(0,2).join(",").trim();
      setFound(short || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      onSelect(short || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setFound(fallback);
      onSelect(fallback);
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  return (
    <div className="map-picker-wrap">
      <MapContainer center={UB} zoom={12} className="leaflet-map leaflet-map-picker" scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        <ClickHandler onMapClick={handleClick} />
        {marker && <Marker position={marker} icon={pinIcon} />}
      </MapContainer>
      <div className="map-picker-footer">
        {loading
          ? <span className="map-picker-status"><div className="spinner" style={{width:14,height:14,borderWidth:2}} /> Байршил тодорхойлж байна...</span>
          : found
            ? <span className="map-picker-found">📍 {found}</span>
            : <span className="map-picker-hint">🖱️ Газрын зурагт дарж байршлаа тэмдэглэнэ үү</span>
        }
      </div>
    </div>
  );
}

export default MapPicker;
