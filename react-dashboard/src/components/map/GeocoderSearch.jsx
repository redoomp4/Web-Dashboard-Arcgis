import { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Icon } from '../common/Icons';

export function GeocoderSearch({ onSelectResult, onClear }) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Prevent map gestures when interacting with search
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const stopPropagation = e => e.stopPropagation();
    el.addEventListener('mousedown', stopPropagation);
    el.addEventListener('dblclick', stopPropagation);
    el.addEventListener('wheel', stopPropagation);
    el.addEventListener('touchstart', stopPropagation);

    return () => {
      el.removeEventListener('mousedown', stopPropagation);
      el.removeEventListener('dblclick', stopPropagation);
      el.removeEventListener('wheel', stopPropagation);
      el.removeEventListener('touchstart', stopPropagation);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async e => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Prioritize Indonesia & East Kalimantan bounds
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=id&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setResults(data || []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = item => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    map.flyTo([lat, lng], 15, { duration: 1 });
    onSelectResult({
      lat,
      lng,
      displayName: item.display_name,
      shortName: item.display_name.split(',')[0]
    });

    setQuery(item.display_name.split(',')[0]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (onClear) onClear();
  };

  return (
    <div className="map-geocoder-container" ref={containerRef}>
      <form className="geocoder-search-bar" onSubmit={handleSearch}>
        <div className="geocoder-input-wrapper">
          <Icon name="search" size={15} className="geocoder-icon" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari lokasi (cth: Jl. Sudirman, Tanah Grogot)..."
            className="geocoder-input-field"
          />
          {query && (
            <button type="button" className="geocoder-clear-btn" onClick={handleClear}>
              <Icon name="x" size={13} />
            </button>
          )}
        </div>
        <button type="submit" className="geocoder-submit-btn" disabled={loading}>
          {loading ? <span className="spinner-dot" /> : 'Cari'}
        </button>
      </form>

      {isOpen && results.length > 0 && (
        <ul className="geocoder-results-dropdown">
          {results.map(item => (
            <li key={item.place_id} onClick={() => handleSelect(item)}>
              <Icon name="map-pin" size={14} className="result-pin-icon" />
              <div className="result-text">
                <strong>{item.display_name.split(',')[0]}</strong>
                <small>{item.display_name.split(',').slice(1, 4).join(',')}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
