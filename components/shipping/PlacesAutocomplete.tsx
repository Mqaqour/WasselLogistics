import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

// ── Types for the new Places API ──────────────────────────────────────────────

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

interface Place {
  fetchFields(opts: { fields: string[] }): Promise<void>;
  addressComponents?: AddressComponent[];
}

interface PlacePrediction {
  toPlace(): Place;
  text: { text: string };
  mainText: { text: string };
  secondaryText?: { text: string };
}

interface Suggestion {
  placePrediction: PlacePrediction;
}

interface PlacesLibrary {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(request: {
      input: string;
      sessionToken?: unknown;
    }): Promise<{ suggestions: Suggestion[] }>;
  };
  AutocompleteSessionToken: new () => unknown;
}

declare global {
  interface Window {
    __gmpInit?: () => void;
    google: {
      maps: {
        importLibrary(name: 'places'): Promise<PlacesLibrary>;
      };
    };
  }
}

// ── Singleton script loader (loading=async, no deprecation) ───────────────────
let _loadPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string, language = 'en'): Promise<void> {
  if (_loadPromise) return _loadPromise;
  if (typeof window !== 'undefined' && window.google?.maps?.importLibrary) {
    return (_loadPromise = Promise.resolve());
  }
  _loadPromise = new Promise<void>((resolve, reject) => {
    window.__gmpInit = resolve;
    const script = document.createElement('script');
    // loading=async is the recommended pattern; callback bootstraps the API.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=${encodeURIComponent(language)}&loading=async&callback=__gmpInit`;
    script.async = true;
    script.onerror = () => {
      _loadPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });
  return _loadPromise;
}

// ── Exported types ────────────────────────────────────────────────────────────
export interface PlaceDetails {
  country: string;
  countryCode: string;
  city: string;
  zipCode: string;
}

interface PlacesAutocompleteProps {
  label: string;
  placeholder: string;
  onPlaceSelect: (details: PlaceDetails) => void;
  lang?: 'en' | 'ar';
}

// ── Component ─────────────────────────────────────────────────────────────────
export const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  label,
  placeholder,
  onPlaceSelect,
  lang = 'en',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const sessionTokenRef = useRef<unknown>(null);
  const placesLibRef = useRef<PlacesLibrary | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY ?? '';
  const language = import.meta.env.VITE_GOOGLE_PLACES_LANGUAGE ?? 'en';

  // Load Google Maps once
  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey, language)
      .then(async () => {
        const lib = await window.google.maps.importLibrary('places');
        placesLibRef.current = lib;
        sessionTokenRef.current = new lib.AutocompleteSessionToken();
        setMapsReady(true);
      })
      .catch(console.error);
  }, [apiKey, language]);

  // Close dropdown on outside click/touch
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e instanceof TouchEvent ? e.touches[0]?.target : (e as MouseEvent).target;
      if (wrapperRef.current && target && !wrapperRef.current.contains(target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler as EventListener);
    document.addEventListener('touchstart', handler as EventListener, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler as EventListener);
      document.removeEventListener('touchstart', handler as EventListener);
    };
  }, []);

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!mapsReady || !placesLibRef.current || input.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      try {
        const { suggestions: results } =
          await placesLibRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input,
            sessionToken: sessionTokenRef.current ?? undefined,
          });
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    [mapsReady],
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    setQuery(suggestion.placePrediction.text.text);
    setIsOpen(false);
    setSuggestions([]);

    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ['addressComponents'] });

      let country = '';
      let countryCode = '';
      let city = '';
      let zipCode = '';

      for (const component of place.addressComponents ?? []) {
        if (component.types.includes('country')) {
          country = component.longText;
          countryCode = component.shortText;
        } else if (component.types.includes('locality')) {
          city = component.longText;
        } else if (!city && component.types.includes('administrative_area_level_1')) {
          city = component.longText;
        } else if (component.types.includes('postal_code')) {
          zipCode = component.longText;
        }
      }

      // Refresh session token after a completed selection
      if (placesLibRef.current) {
        sessionTokenRef.current = new placesLibRef.current.AutocompleteSessionToken();
      }

      onPlaceSelect({ country, countryCode, city, zipCode });
    } catch (err) {
      console.error('Place fetch failed', err);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative mt-1">
        <MapPin
          className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 w-4 h-4 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        {isLoading && (
          <Loader2
            className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 w-4 h-4 text-gray-400 animate-spin pointer-events-none"
            aria-hidden="true"
          />
        )}
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 ltr:pl-9 rtl:pr-9 ltr:pr-9 rtl:pl-9 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              className="px-4 py-2 cursor-pointer hover:bg-yellow-50 hover:text-wassel-blue flex items-start gap-2 text-sm"
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium">{s.placePrediction.mainText?.text}</span>
                {s.placePrediction.secondaryText && (
                  <span className="text-gray-500 ltr:ml-1 rtl:mr-1">
                    {s.placePrediction.secondaryText.text}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
