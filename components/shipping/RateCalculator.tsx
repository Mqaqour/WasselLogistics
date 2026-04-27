import React, { useState, useEffect } from 'react';
import { Plane, Truck, Globe, Map, FileText, Package, ArrowRight } from 'lucide-react';
import { RateResult, Language } from '../../types';
import { PlacesAutocomplete, PlaceDetails } from './PlacesAutocomplete';

const BRAND_LOGO = `${import.meta.env.BASE_URL}assets/Wassel logo-01.png`;

interface RateCalculatorProps {
    lang: Language;
    isPopup?: boolean;
    initialTab?: 'international' | 'domestic';
}

const PALESTINIAN_CITIES = [
  { en: 'Ramallah', ar: 'رام الله' },
  { en: 'Gaza', ar: 'غزة' },
  { en: 'Hebron', ar: 'الخليل' },
  { en: 'Nablus', ar: 'نابلس' },
  { en: 'Jenin', ar: 'جنين' },
  { en: 'Tulkarm', ar: 'طولكرم' },
  { en: 'Qalqilya', ar: 'قلقيلية' },
  { en: 'Bethlehem', ar: 'بيت لحم' },
  { en: 'Jericho', ar: 'أريحا' },
  { en: 'Salfit', ar: 'سلفيت' },
  { en: 'Tubas', ar: 'طوباس' },
  { en: 'Jerusalem', ar: 'القدس' }
];

export const RateCalculator: React.FC<RateCalculatorProps> = ({ lang, isPopup = false, initialTab = 'international' }) => {
  const [type, setType] = useState<'international' | 'domestic'>(initialTab);
  const origin = 'IL';
  const originCity = 'Jerusalem';
  const originZip = '9730000';
  const [destination, setDestination] = useState('');
  const [destCity, setDestCity] = useState('');
  const [destZip, setDestZip] = useState('');
  const [weight, setWeight] = useState(1);
  const [pkgLength, setPkgLength] = useState(30);
  const [pkgWidth, setPkgWidth] = useState(20);
  const [pkgHeight, setPkgHeight] = useState(10);
  const [isDocument, setIsDocument] = useState(false);
  const [results, setResults] = useState<RateResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [carrierErrors, setCarrierErrors] = useState<{ carrier: string; message: string }[]>([]);

  useEffect(() => {
    setType(initialTab);
  }, [initialTab]);

  const t = {
      title: lang === 'en' ? 'Shipping Rate Calculator' : 'حاسبة أسعار الشحن',
      subtitle: lang === 'en' ? 'Compare rates for Domestic and International shipments including DHL and FedEx.' : 'قارن أسعار الشحن المحلي والدولي بما في ذلك DHL و FedEx.',
      international: lang === 'en' ? 'International' : 'دولي',
      domestic: lang === 'en' ? 'Domestic' : 'محلي',
      origin: lang === 'en' ? 'Origin' : 'المصدر',
      destination: lang === 'en' ? 'Destination' : 'الوجهة',
      city: lang === 'en' ? 'City' : 'المدينة',
      country: lang === 'en' ? 'Country' : 'الدولة',
      originPlaceholder: lang === 'en' ? "e.g., Saudi Arabia" : "مثال: السعودية",
      destPlaceholder: lang === 'en' ? "e.g., United Kingdom" : "مثال: المملكة المتحدة",
      weight: lang === 'en' ? 'Weight (kg)' : 'الوزن (كجم)',
      getRates: lang === 'en' ? 'Get Rates' : 'عرض الأسعار',
      calculating: lang === 'en' ? 'Calculating Best Rates...' : 'جاري حساب أفضل الأسعار...',
      availableOptions: lang === 'en' ? 'Available Options' : 'الخيارات المتاحة',
      estDelivery: lang === 'en' ? 'Est. Delivery:' : 'وقت التوصيل المتوقع:',
      selectBook: lang === 'en' ? 'Select & Book' : 'اختيار وحجز',
      businessDays: lang === 'en' ? 'Business Days' : 'أيام عمل',
      tomorrow: lang === 'en' ? 'Tomorrow' : 'غداً',
      selectCity: lang === 'en' ? 'Select City' : 'اختر المدينة',
      shipmentType: lang === 'en' ? 'Shipment Type' : 'نوع الشحنة',
      document: lang === 'en' ? 'Document' : 'مستند',
      parcel: lang === 'en' ? 'Non-Document / Parcel' : 'طرد / غير مستند',
      cityLabel: lang === 'en' ? 'City' : 'المدينة',
      zipLabel: lang === 'en' ? 'Zip / Postal Code' : 'الرمز البريدي',
      cityPlaceholder: lang === 'en' ? 'e.g., Ramallah' : 'مثال: رام الله',
      destCityPlaceholder: lang === 'en' ? 'e.g., New York' : 'مثال: نيويورك',
      zipPlaceholder: lang === 'en' ? 'e.g., 00000' : 'مثال: 00000',
      dimensions: lang === 'en' ? 'Package Dimensions (cm)' : 'أبعاد الطرد (سم)',
      length: lang === 'en' ? 'Length' : 'الطول',
      width: lang === 'en' ? 'Width' : 'العرض',
      height: lang === 'en' ? 'Height' : 'الارتفاع',
      noRates: lang === 'en' ? 'No rates available for the selected route.' : 'لا توجد أسعار متاحة للمسار المحدد.',
      carrierError: lang === 'en' ? 'Note: some carriers could not be reached.' : 'ملاحظة: لم يتمكن بعض الناقلين من الاستجابة.',
  };

  // Maps a human-readable country name (EN or AR) to an ISO 3166-1 alpha-2 code.
  // Falls back to the first two uppercase characters of the input.
  const COUNTRY_CODES: Record<string, string> = {
    palestine: 'PS', 'west bank': 'PS', فلسطين: 'PS', 'الضفة الغربية': 'PS',
    israel: 'IL', إسرائيل: 'IL',
    jordan: 'JO', الأردن: 'JO',
    'saudi arabia': 'SA', السعودية: 'SA', 'المملكة العربية السعودية': 'SA',
    egypt: 'EG', مصر: 'EG',
    'united states': 'US', usa: 'US', الولايات: 'US', 'الولايات المتحدة': 'US', أمريكا: 'US',
    'united kingdom': 'GB', uk: 'GB', 'المملكة المتحدة': 'GB', بريطانيا: 'GB',
    germany: 'DE', ألمانيا: 'DE',
    france: 'FR', فرنسا: 'FR',
    italy: 'IT', إيطاليا: 'IT',
    spain: 'ES', إسبانيا: 'ES',
    netherlands: 'NL', هولندا: 'NL',
    turkey: 'TR', تركيا: 'TR',
    uae: 'AE', 'united arab emirates': 'AE', الإمارات: 'AE', 'الإمارات العربية المتحدة': 'AE',
    kuwait: 'KW', الكويت: 'KW',
    qatar: 'QA', قطر: 'QA',
    bahrain: 'BH', البحرين: 'BH',
    oman: 'OM', عُمان: 'OM', عمان: 'OM',
    lebanon: 'LB', لبنان: 'LB',
    syria: 'SY', سوريا: 'SY',
    iraq: 'IQ', العراق: 'IQ',
    china: 'CN', الصين: 'CN',
    japan: 'JP', اليابان: 'JP',
    india: 'IN', الهند: 'IN',
    canada: 'CA', كندا: 'CA',
    australia: 'AU', أستراليا: 'AU',
  };

  const getCountryCode = (name: string): string => {
    const code = COUNTRY_CODES[name.toLowerCase().trim()];
    return code ?? name.substring(0, 2).toUpperCase();
  };

  const calculateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    setApiError(null);
    setCarrierErrors([]);

    if (type === 'international') {
      const shippingDate = new Date();
      shippingDate.setDate(shippingDate.getDate());
      const shippingDateStr = shippingDate.toISOString().split('T')[0];

      const originCode = getCountryCode(origin);
      const destCode = getCountryCode(destination);

      const payload = {
        destinationCountryCode: destCode,
        weight,
        shippingDate: shippingDateStr,
        packageType: isDocument ? 'document' : 'custom',
        origin: { country: originCode, city: originCity, zipCode: originZip },
        destination: { country: destCode, city: destCity, zipCode: destZip },
        packages: [{ weight, length: pkgLength, width: pkgWidth, height: pkgHeight }],
      };

      try {
        const backendUrl = import.meta.env.VITE_CHAT_BACKEND_URL?.trim() ?? '';
        const response = await fetch(`${backendUrl}/api/quickrate/api/external/shipping/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.carrierErrors?.length) {
          setCarrierErrors(data.carrierErrors);
        }

        const rates: RateResult[] = (data.quotes ?? []).map((q: {
          carrier: string;
          serviceType: string;
          price: number;
          currency: string;
          etaDays: string;
        }) => ({
          provider: q.carrier,
          service: q.serviceType,
          price: q.price,
          currency: q.currency,
          deliveryDate: new Date(q.etaDays).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB', {
            year: 'numeric', month: 'short', day: 'numeric',
          }),
        }));

        setResults(rates);
      } catch {
        setApiError(lang === 'en' ? 'Failed to fetch rates. Please try again.' : 'فشل في جلب الأسعار. يرجى المحاولة مرة أخرى.');
      }

      setLoading(false);
      return;
    }

    // ── Domestic mock ────────────────────────────────────────────────────────
    setTimeout(() => {
      let baseRate = 20 + weight * 5;
      if (isDocument) baseRate = 15 + weight * 2;

      const rates: RateResult[] = [
        { provider: 'Wassel Express', service: lang === 'en' ? 'Next Day Delivery' : 'توصيل في اليوم التالي', price: baseRate, currency: 'ILS', deliveryDate: t.tomorrow },
        { provider: 'Wassel Standard', service: lang === 'en' ? 'Ground Transport' : 'نقل بري', price: baseRate * 0.7, currency: 'ILS', deliveryDate: lang === 'en' ? '2-4 Business Days' : '2-4 أيام عمل' },
      ];
      setResults(rates);
      setLoading(false);
    }, 1200);
  };

  const handleBookClick = (rate: RateResult) => {
      const params = new URLSearchParams({
          mode: 'booking',
          provider: rate.provider,
          service: rate.service,
          price: rate.price.toString(),
          currency: rate.currency,
          deliveryDate: rate.deliveryDate,
          weight: weight.toString(),
          origin: origin,
          destination: destination,
          lang: lang
      });
      
      // Open in new window
      window.open(`/?${params.toString()}`, 'WasselBooking', 'width=900,height=800,scrollbars=yes,resizable=yes');
  };

  // Helper to get logo
  const getProviderLogo = (provider: string) => {
    if (provider.includes('Wassel')) return BRAND_LOGO;
    return null;
  };

  return (
    <div className={isPopup ? "w-full p-2 relative" : "max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative"}>
      <div className={`text-center ${isPopup ? 'mb-6' : 'mb-10'}`}>
        <h2 className={`font-extrabold text-wassel-blue ${isPopup ? 'text-2xl' : 'text-3xl'}`}>{t.title}</h2>
        <p className="mt-2 text-gray-500 text-sm sm:text-base">{t.subtitle}</p>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setType('international'); setResults(null); }}
            className={`flex-1 py-4 text-center font-medium flex items-center justify-center gap-2 transition-colors ${type === 'international' ? 'bg-slate-50 text-wassel-yellow border-b-2 border-wassel-yellow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Globe className="w-5 h-5" />
            <span>{t.international}</span>
          </button>
          <button
            onClick={() => { setType('domestic'); setResults(null); }}
            className={`flex-1 py-4 text-center font-medium flex items-center justify-center gap-2 transition-colors ${type === 'domestic' ? 'bg-slate-50 text-wassel-yellow border-b-2 border-wassel-yellow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Map className="w-5 h-5" />
            <span>{t.domestic}</span>
          </button>
        </div>

        <form onSubmit={calculateRates} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Origin — fixed to IL / Jerusalem / 9730000, hidden from UI */}

          {/* Domestic destination city selector */}
          {type === 'domestic' && (
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">{t.destination} {t.city}</label>
              <select
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow bg-white"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="">{t.selectCity}</option>
                {PALESTINIAN_CITIES.map((city) => (
                  <option key={city.en} value={city.en}>
                    {lang === 'en' ? city.en : city.ar}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Destination — international only */}
          {type === 'international' && (
            <div className="col-span-1 md:col-span-2 space-y-4">
              {/* Search autocomplete */}
              <PlacesAutocomplete
                label={lang === 'en' ? 'Search Destination' : 'ابحث عن الوجهة'}
                placeholder={lang === 'en' ? 'Start typing a city or country…' : 'ابدأ بكتابة مدينة أو دولة…'}
                lang={lang}
                onPlaceSelect={(details: PlaceDetails) => {
                  setDestination(details.country);
                  setDestCity(details.city);
                  setDestZip(details.zipCode);
                }}
              />
              {/* Auto-filled fields (editable) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.destination} {t.country}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.destPlaceholder}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow bg-gray-50"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.destination} {t.cityLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.destCityPlaceholder}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow bg-gray-50"
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.destination} {t.zipLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.zipPlaceholder}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow bg-gray-50"
                    value={destZip}
                    onChange={(e) => setDestZip(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Shipment Type Selector */}
          <div className="col-span-1 md:col-span-2">
             <label className="block text-sm font-medium text-gray-700 mb-2">{t.shipmentType}</label>
             <div className="grid grid-cols-2 gap-4">
                 <button
                    type="button"
                    onClick={() => setIsDocument(true)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 border rounded-md text-sm font-medium transition-colors ${isDocument ? 'border-wassel-yellow bg-yellow-50 text-wassel-blue' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                 >
                     <FileText className={`w-5 h-5 ${isDocument ? 'text-wassel-yellow' : 'text-gray-400'}`} />
                     {t.document}
                 </button>
                 <button
                    type="button"
                    onClick={() => setIsDocument(false)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 border rounded-md text-sm font-medium transition-colors ${!isDocument ? 'border-wassel-yellow bg-yellow-50 text-wassel-blue' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                 >
                     <Package className={`w-5 h-5 ${!isDocument ? 'text-wassel-yellow' : 'text-gray-400'}`} />
                     {t.parcel}
                 </button>
             </div>
          </div>

          {/* Weight + Package dimensions on one row — international parcels only */}
          {type === 'international' && !isDocument ? (
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.weight}</label>
                  <input
                    type="number" min="0.1" step="0.1" required placeholder="1"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.length}</label>
                  <input
                    type="number" min="1" step="1" required placeholder="30"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                    value={pkgLength}
                    onChange={(e) => setPkgLength(parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.width}</label>
                  <input
                    type="number" min="1" step="1" required placeholder="20"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                    value={pkgWidth}
                    onChange={(e) => setPkgWidth(parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.height}</label>
                  <input
                    type="number" min="1" step="1" required placeholder="10"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                    value={pkgHeight}
                    onChange={(e) => setPkgHeight(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">{t.weight}</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                placeholder="1"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
              />
            </div>
          )}

          <div className="col-span-1 md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-wassel-blue hover:bg-wassel-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wassel-yellow disabled:opacity-70"
            >
              {loading ? t.calculating : t.getRates}
            </button>
          </div>
        </form>
      </div>

      {/* API error */}
      {apiError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {apiError}
        </div>
      )}

      {/* Carrier warnings */}
      {carrierErrors.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs">
          {t.carrierError} ({carrierErrors.map(e => e.carrier).join(', ')})
        </div>
      )}

      {results && results.length === 0 && !apiError && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm text-center">
          {t.noRates}
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mt-10 space-y-4">
          <h3 className="text-xl font-bold text-wassel-blue mb-4">{t.availableOptions}</h3>
          {results.map((rate, idx) => {
            const logo = getProviderLogo(rate.provider);
            return (
              <div key={idx} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-auto">
                  <div className={`w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-lg p-1 border border-gray-100 ${rate.provider.includes('Wassel') ? 'bg-white' : 'bg-white'}`}>
                     {logo ? (
                       <img 
                          src={logo} 
                          alt={rate.provider} 
                          className="max-w-full max-h-full object-contain" 
                          onError={(e) => {
                             e.currentTarget.style.display = 'none';
                          }}
                       />
                     ) : (
                        rate.provider.includes('Wassel') ? <Truck className="w-8 h-8 text-wassel-blue" /> : <Plane className="w-8 h-8 text-wassel-yellow" />
                     )}
                  </div>
                  <div>
                      <h4 className="text-lg font-bold text-wassel-blue">{rate.provider}</h4>
                      <p className="text-sm text-gray-500">{rate.service}</p>
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full rtl:ml-1 ltr:mr-1"></span>
                          {t.estDelivery} {rate.deliveryDate}
                      </p>
                  </div>
                </div>
                <div className="rtl:text-left ltr:text-right w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end">
                  <p className="text-2xl font-bold text-wassel-blue">{rate.price.toFixed(2)} <span className="text-sm font-normal text-gray-500">{rate.currency}</span></p>
                  <button 
                    onClick={() => handleBookClick(rate)}
                    className="mt-0 md:mt-2 px-4 py-2 bg-wassel-yellow text-wassel-blue rounded-md text-sm font-bold hover:bg-wassel-lightYellow transition-colors flex items-center gap-1 shadow-sm"
                  >
                      {t.selectBook} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};