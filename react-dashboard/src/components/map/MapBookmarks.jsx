import { useState, useRef, useEffect } from 'react';
import { Icon } from '../common/Icons';
import { REGIONAL_BOOKMARKS } from '../../constants/config';

export function MapBookmarks({ onSelectBookmark }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="map-bookmarks-dropdown" ref={ref}>
      <button
        className="btn-map-tool"
        onClick={() => setIsOpen(prev => !prev)}
        title="Bookmark Lokasi Wilayah UP3 Grogot"
      >
        <Icon name="compass" size={14} />
        <span>Wilayah</span>
      </button>

      {isOpen && (
        <div className="bookmarks-menu-popup">
          <div className="bookmarks-menu-title">Lompat ke Wilayah:</div>
          {REGIONAL_BOOKMARKS.map(item => (
            <button
              key={item.id}
              className="bookmark-menu-item"
              onClick={() => {
                onSelectBookmark(item);
                setIsOpen(false);
              }}
            >
              <Icon name="map-pin" size={12} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
