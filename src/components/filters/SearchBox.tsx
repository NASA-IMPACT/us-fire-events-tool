import { useState, useRef, useEffect } from 'react';
import AdvancedFilters from './AdvancedFilters';
import { useEvents } from '../../contexts/EventsContext';
import { useFilters } from '../../contexts/FiltersContext';
import { useAppState } from '../../contexts/AppStateContext';

const SearchBox: React.FC = () => {
  const { searchTerm, setSearchTerm, showAdvancedFilters, toggleAdvancedFilters } = useFilters();
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { selectEvent } = useEvents();
  const { setViewMode } = useAppState();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (searchError) {
      setSearchError(null);
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (e.target.value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearchFire(e.target.value.trim());
      }, 1000);
    }
  };

  const handleSearchFire = async (fireId: string) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const url = `https://firenrt.delta-backend.com/collections/public.eis_fire_snapshot_perimeter_nrt/items?filter=fireid%3D${fireId}&limit=1&f=geojson`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !data.features || data.features.length === 0) {
        setSearchError("No fire IDs found");
        return;
      }

      selectEvent(fireId);

      setViewMode('detail');

      const geometry = data.features[0].geometry;

      if (geometry && geometry.coordinates) {
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

        if (geometry.type === 'Polygon' && geometry.coordinates.length > 0) {
          const coordinates = geometry.coordinates[0];

          coordinates.forEach(([lng, lat]) => {
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
          });

          window.dispatchEvent(new CustomEvent('fitbounds', {
            detail: {
              bounds: [[minLng, minLat], [maxLng, maxLat]],
              padding: 80
            }
          }));
        }
      }

    } catch (error) {
      console.error("Error searching for fire:", error);
      setSearchError("Error searching for fire. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      handleSearchFire(searchTerm.trim());
    }
    inputRef.current?.blur();
  };

  useEffect(() => {
    if (searchTerm) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white radius-md overflow-hidden border-0 shadow-1">
      <div className="padding-2">
        <form onSubmit={handleSubmit} className="display-flex width-full">
          <div className="position-relative width-full">
            <input
              ref={inputRef}
              id="search-field"
              type="search"
              name="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by fire ID"
              className="font-body font-weight-regular font-sans-2xs border-1px radius-left-md padding-x-2 height-5 width-full"
              style={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0
              }}
              disabled={isSearching}
            />
          </div>
        </form>

        {searchError && (
          <div className="margin-top-1 text-error font-sans-3xs">
            {searchError}
          </div>
        )}
      </div>

      <div className="padding-x-2 padding-bottom-2">
        <button
          type="button"
          onClick={toggleAdvancedFilters}
          className="usa-button usa-button--unstyled font-body font-weight-regular font-sans-3xs display-flex flex-align-center text-primary cursor-pointer"
        >
          <svg
            width="13.26px"
            height="12.31px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="margin-right-1 text-primary"
            style={{
              marginTop: '3.85px'
            }}
          >
            {showAdvancedFilters ? (
              <path
                d="M12 8L6 14H18L12 8Z"
                fill="currentColor"
              />
            ) : (
              <path
                d="M12 16L18 10H6L12 16Z"
                fill="currentColor"
              />
            )}
          </svg>
          {showAdvancedFilters ? "Hide advanced filters" : "Show advanced filters"}
        </button>
      </div>

      {showAdvancedFilters && <AdvancedFilters />}
    </div>
  );
};

export default SearchBox;