import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import AdvancedFilters from './AdvancedFilters';
import { useMap } from '../../contexts/MapContext';
import { useEvents } from '../../contexts/EventsContext';
import { useFilters } from '../../contexts/FiltersContext';

const SearchBox: React.FC = () => {
  const { searchTerm, setSearchTerm, showAdvancedFilters, toggleAdvancedFilters } = useFilters();
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { flyToBounds } = useMap();
  const { selectEvent, searchFireById } = useEvents();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (searchError) {
      setSearchError(null);
    }
  };

  const handleSearchFire = async (fireId: string) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await searchFireById(fireId);

      if (result.error) {
        setSearchError(result.error);
        return;
      }

      if (result.bounds) {
        flyToBounds(result.bounds);
      }

      selectEvent(fireId);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
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
              className="font-body font-weight-regular font-sans-2xs border-1px border-right-0 radius-left-md padding-x-2 height-5 width-full"
              style={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0
              }}
              disabled={isSearching}
            />
          </div>
          <button
            type="submit"
            className="bg-primary border-0 display-flex flex-justify-center flex-align-center cursor-pointer height-5 width-5"
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0
            }}
            disabled={isSearching}
          >
            <Search size={18} color="white" />
            <span className="usa-sr-only">Search</span>
          </button>
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