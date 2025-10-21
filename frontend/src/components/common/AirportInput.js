import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';
import api from '../../utils/api';

// Simple debounce function
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const AirportInput = ({ value, onSelect, placeholder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const wrapperRef = useRef(null);

  // Effect to update the displayed text if the initial value changes
  useEffect(() => {
    if (value && !selectedValue) {
      // If there's an initial value but no selected value object, we can't show full details.
      // We'll just show the IATA code.
      setSearchTerm(value);
    } else if (!value) {
      setSearchTerm('');
      setSelectedValue(null);
    }
  }, [value]);

  const fetchAirports = async (query) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.get('/airports/search', {
        params: { q: query }
      });
      setResults(response.data);
      setIsDropdownVisible(true);
    } catch (error) {
      console.error("Failed to fetch airports:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchAirports, 300), []);

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    setSelectedValue(null); // Reset selected value if user types again

    const trimmedQuery = query.trim();
    onSelect(trimmedQuery);

    if (trimmedQuery.length >= 2) {
      debouncedFetch(trimmedQuery);
    } else {
      setResults([]);
      setIsDropdownVisible(false);
    }
  };

  const handleSelect = (airport) => {
    const displayText = `${airport.city} (${airport.iata_code}), ${airport.country}`;
    setSearchTerm(displayText);
    setSelectedValue(airport);
    onSelect(airport.city.toUpperCase()); // Pass the city name in uppercase to the parent
    setIsDropdownVisible(false);
    setResults([]);
  };

  // Close dropdown when clicking outside
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
  }, [wrapperRef]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder || 'Buscar por ciudad, país o IATA'}
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
          {results.map((airport) => (
            <li
              key={airport.iata_code}
              onClick={() => handleSelect(airport)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              <p className="font-semibold">{airport.airport_name}</p>
              <p className="text-sm text-gray-600">
                {airport.city}, {airport.country} ({airport.iata_code})
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AirportInput;


