import React, { useState, useEffect } from 'react';
import { Plane, Truck, Globe, Map, FileText, Package, ArrowRight } from 'lucide-react';
import { RateResult, Language } from '../types';

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
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState(1);
  const [isDocument, setIsDocument] = useState(false);
  const [results, setResults] = useState<RateResult[] | null>(null);
  const [loading, setLoading] = useState(false);

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
  };

  const calculateRates = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    // Simulated API call delay
    setTimeout(() => {
      let rates: RateResult[] = [];
      // ILS Rates mock logic
      let baseRate = weight * 20; 

      if (type === 'domestic') {
          baseRate = 20 + (weight * 5); // Base fee + weight fee
          if (isDocument) baseRate = 15 + (weight * 2); // Cheaper for documents

          // Intra-city discount mock
          if (origin === destination && origin !== '') {
              baseRate = baseRate * 0.7;
          }
      } else {
          // International
          baseRate = 100 + (weight * 40);
          if (isDocument) baseRate = baseRate * 0.8;
      }

      if (type === 'international') {
        rates = [
          { provider: 'Wassel Express', service: lang === 'en' ? 'Priority Air' : 'شحن جوي سريع', price: baseRate, currency: 'ILS', deliveryDate: lang === 'en' ? '3-4 Business Days' : '3-4 أيام عمل' },
          { provider: 'DHL', service: lang === 'en' ? 'Express Worldwide' : 'سريع عالمي', price: baseRate * 1.4, currency: 'ILS', deliveryDate: lang === 'en' ? '2-3 Business Days' : '2-3 أيام عمل' },
          { provider: 'FedEx', service: lang === 'en' ? 'International Priority' : 'أولوية دولية', price: baseRate * 1.35, currency: 'ILS', deliveryDate: lang === 'en' ? '2-3 Business Days' : '2-3 أيام عمل' },
          { provider: 'Wassel Standard', service: lang === 'en' ? 'Economy' : 'اقتصادي', price: baseRate * 0.6, currency: 'ILS', deliveryDate: lang === 'en' ? '7-10 Business Days' : '7-10 أيام عمل' },
        ];
      } else {
        rates = [
           { provider: 'Wassel Express', service: lang === 'en' ? 'Next Day Delivery' : 'توصيل في اليوم التالي', price: baseRate, currency: 'ILS', deliveryDate: t.tomorrow },
           { provider: 'Wassel Standard', service: lang === 'en' ? 'Ground Transport' : 'نقل بري', price: baseRate * 0.7, currency: 'ILS', deliveryDate: lang === 'en' ? '2-4 Business Days' : '2-4 أيام عمل' },
        ];
      }
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
    if (provider.includes('Wassel')) return 'Wassel logo-01.png';
    if (provider.includes('DHL')) return 'https://logo.clearbit.com/dhl.com';
    if (provider.includes('FedEx')) return 'https://logo.clearbit.com/fedex.com';
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
          
          {/* Origin Input */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">{t.origin} {type === 'international' ? t.country : t.city}</label>
            {type === 'domestic' ? (
                <select 
                    required 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow bg-white"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                >
                    <option value="">{t.selectCity}</option>
                    {PALESTINIAN_CITIES.map((city) => (
                        <option key={city.en} value={city.en}>
                            {lang === 'en' ? city.en : city.ar}
                        </option>
                    ))}
                </select>
            ) : (
                <input 
                  type="text" 
                  required
                  placeholder={t.originPlaceholder}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
            )}
          </div>

          {/* Destination Input */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">{t.destination} {type === 'international' ? t.country : t.city}</label>
            {type === 'domestic' ? (
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
            ) : (
                <input 
                  type="text" 
                  required
                  placeholder={t.destPlaceholder}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
            )}
          </div>

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

          {/* Weight */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t.weight}</label>
            <input 
              type="number" 
              min="0.1"
              step="0.1"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
            />
          </div>

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

      {results && (
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