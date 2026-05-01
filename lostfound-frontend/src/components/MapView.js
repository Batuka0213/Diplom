import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl:       require("leaflet/dist/images/marker-icon.png"),
  shadowUrl:     require("leaflet/dist/images/marker-shadow.png"),
});

const pinIcon = new L.DivIcon({
  className:   "custom-marker",
  html:        '<div class="marker-pin"></div>',
  iconSize:    [28, 36],
  iconAnchor:  [14, 36],
  popupAnchor: [0, -38],
});

function MapView({ location }) {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error

  useEffect(() => {
    if (!location) { setStatus("error"); return; }
    const query = location.trim() + ", Монгол";
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "Accept-Language": "mn,en" } }
    )
      .then(r => r.json())
      .then(data => {
        if (data?.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [location]);

  if (status === "loading") {
    return (
      <div className="map-loading">
        <div className="spinner" /> Байршил хайж байна...
      </div>
    );
  }

  if (status === "error" || !coords) {
    return (
      <div className="map-error">
        <span className="map-error-icon">📍</span>
        <div>
          <p>Газрын зурагт олдсонгүй</p>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(location || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="map-error-link"
          >
            Google Maps-д харах →
          </a>
        </div>
      </div>
    );
  }

  return (
    <MapContainer center={coords} zoom={14} className="leaflet-map" scrollWheelZoom={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />
      <Marker position={coords} icon={pinIcon}>
        <Popup><strong>{location}</strong></Popup>
      </Marker>
    </MapContainer>
  );
}

export default MapView;
