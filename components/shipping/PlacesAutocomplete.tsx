import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    __gmpInit?: () => void;
    google: typeof google;
  }
}

// ── Singleton script loader ────────────────────────────────────────────────────
let _loadPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string, language = 'en'): Promise<void> {
  if (_loadPromise) return _loadPromise;
  if (typeof window !== 'undefined' && window.google?.maps?.places) {
    return (_loadPromise = Promise.resolve());
  }
  _loadPromise = new Promise<void>((resolve, reject) => {
    window.__gmpInit = resolve;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=${encodeURIComponent(language)}&callback=__gmpInit`;
    script.async = true;
    script.defer = true;
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

interface Prediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
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
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dummyDivRef = useRef<HTMLDivElement | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY ?? '';
  const language = import.meta.env.VITE_GOOGLE_PLACES_LANGUAGE ?? 'en';

  // Load Google Maps once
  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey, language)
      .then(() => {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        dummyDivRef.current = document.createElement('div');
        placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDivRef.current);
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
    (input: string) => {
      if (!mapsReady || !autocompleteServiceRef.current || input.trim().length < 2) {
        setPredictions([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      autocompleteServiceRef.current.getPlacePredictions(
        { input },
        (results, status) => {
          setIsLoading(false);
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results &&
            results.length > 0
          ) {
            setPredictions(results as unknown as Prediction[]);
            setIsOpen(true);
          } else {
            setPredictions([]);
            setIsOpen(false);
          }
        },
      );
    },
    [mapsReady],
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSelect = (prediction: Prediction) => {
    setQuery(prediction.description);
    setIsOpen(false);
    setPredictions([]);

    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['address_components'] },
      (result, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !result) return;

        let country = '';
        let countryCode = '';
        let city = '';
        let zipCode = '';

        for (const component of result.address_components ?? []) {
          if (component.types.includes('country')) {
            country = component.long_name;
            countryCode = component.short_name;
          } else if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (!city && component.types.includes('administrative_area_level_1')) {
            city = component.long_name;
          } else if (component.types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        }

        onPlaceSelect({ country, countryCode, city, zipCode });
      },
    );
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
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 ltr:pl-9 rtl:pr-9 ltr:pr-9 rtl:pl-9 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
        />
      </div>

      {isOpen && predictions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {predictions.map((p) => (
            <li
              key={p.place_id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(p);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleSelect(p);
              }}
              className="px-4 py-2 cursor-pointer hover:bg-yellow-50 hover:text-wassel-blue flex items-start gap-2 text-sm"
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium">{p.structured_formatting.main_text}</span>
                {p.structured_formatting.secondary_text && (
                  <span className="text-gray-500 ltr:ml-1 rtl:mr-1">
                    {p.structured_formatting.secondary_text}
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
