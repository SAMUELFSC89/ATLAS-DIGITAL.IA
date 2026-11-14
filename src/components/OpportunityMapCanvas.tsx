import { useEffect, useRef } from 'react';
import { circleMarker, latLngBounds, layerGroup, map, tileLayer } from 'leaflet';
import type { Map, LayerGroup } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface CityMarker {
  id: string;
  label: string;
  coordinates: [number, number];
  count: number;
}

export default function OpportunityMapCanvas({ cities, onSelect }: {
  cities: CityMarker[];
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map>(null);
  const markers = useRef<LayerGroup>(null);
  const fittedCities = useRef<string>(null);

  useEffect(() => {
    if (!container.current) return;
    const instance = map(container.current, { scrollWheelZoom: false, maxZoom: 19 });
    mapRef.current = instance;
    tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instance);
    markers.current = layerGroup().addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);

    return () => {
      observer.disconnect();
      instance.remove();
      mapRef.current = null;
      markers.current = null;
      fittedCities.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = mapRef.current;
    const layer = markers.current;
    if (!instance || !layer) return;
    layer.clearLayers();
    for (const city of cities) {
      const tooltip = document.createElement('span');
      tooltip.textContent = `${city.label} · ${city.count} ${city.count === 1 ? 'oportunidade' : 'oportunidades'}`;
      circleMarker(city.coordinates, {
        radius: Math.min(18, 8 + city.count),
        color: '#064e3b',
        fillColor: '#34d399',
        fillOpacity: 0.9,
      }).addTo(layer).bindTooltip(tooltip).on('click', () => onSelect(city.id));
    }

    const visibleCities = cities.map(city => city.id).join('|');
    if (visibleCities === fittedCities.current) return;
    fittedCities.current = visibleCities;

    if (cities.length) {
      instance.fitBounds(latLngBounds(cities.map(city => city.coordinates)), {
        padding: [24, 24],
        maxZoom: 11,
      });
    } else {
      instance.setView([-14.2, -51.9], 4);
    }
  }, [cities, onSelect]);

  return <div ref={container} aria-label="Mapa de oportunidades por município" className="isolate h-64 rounded-xl bg-gray-900" />;
}
