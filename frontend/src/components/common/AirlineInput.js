import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const AirlineInput = ({ value, onSelect, placeholder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value && !selectedValue) {
      setSearchTerm(value);
    } else if (!value) {
      setSearchTerm('');
      setSelectedValue(null);
    }
  }, [value, selectedValue]);

  const fetchAirlines = async (query) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/airlines/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setResults(data);
      setIsDropdownVisible(true);
    } catch (error) {
      console.error('Failed to fetch airlines:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchAirlines, 300), []);

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    setSelectedValue(null);

    const trimmedQuery = query.trim();
    onSelect(trimmedQuery);

    if (trimmedQuery.length >= 2) {
      debouncedFetch(trimmedQuery);
    } else {
      setResults([]);
      setIsDropdownVisible(false);
    }
  };

  const handleSelect = (airline) => {
    const displayText = `${airline.name} (${airline.iata_code})`;
    setSearchTerm(displayText);
    setSelectedValue(airline);
    onSelect(airline.name);
    setIsDropdownVisible(false);
    setResults([]);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder || 'Buscar por aerolinea o IATA'}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg pr-10"
          onFocus={() => { if (results.length > 0) setIsDropdownVisible(true); }}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>
      {isDropdownVisible && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((airline) => (
            <li
              key={airline.iata_code}
              onClick={() => handleSelect(airline)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              <p className="font-semibold">{airline.name} ({airline.iata_code})</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AirlineInput;





