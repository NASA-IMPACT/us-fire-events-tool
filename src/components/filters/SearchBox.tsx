import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import AdvancedFilters from './AdvancedFilters';

interface SearchBoxProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  toggleAdvancedFilters: () => void;
  showAdvancedFilters: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  searchTerm,
  setSearchTerm,
  toggleAdvancedFilters,
  showAdvancedFilters
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="bg-white padding-2">
      <div className="margin-bottom-1">
        <form onSubmit={handleSubmit} className="display-flex width-full">
          <div className="position-relative width-full">
            <input
              ref={inputRef}
              id="search-field"
              type="search"
              name="search"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search by event name or region"
              style={{
                height: '44px',
                width: '100%',
                border: '1px solid #ccc',
                borderRight: 'none',
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                padding: '0 12px',
                fontSize: '14px',
                lineHeight: '22.4px',
                fontFamily: 'Source Sans Pro, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif',
                fontWeight: 'normal'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: '#1a6baa',
              width: '44px',
              height: '44px',
              border: 'none',
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 0,
              cursor: 'pointer'
            }}
          >
            <Search size={18} color="white" />
            <span style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: '0' }}>Search</span>
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={toggleAdvancedFilters}
        style={{
          color: '#1a6baa',
          padding: 0,
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          fontSize: '14px',
          lineHeight: '22.4px',
          fontFamily: 'Source Sans Pro, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif',
          fontWeight: 'normal',
          cursor: 'pointer'
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ marginRight: '8px', color: '#1a6baa' }}
        >
          <path
            d="M4 6H20M4 12H20M4 18H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {showAdvancedFilters ? "Hide advanced filters" : "Show advanced filters"}
      </button>
      {showAdvancedFilters && <AdvancedFilters />}

    </div>
  );
};

export default SearchBox;