import React, { useState } from 'react';
import { 
  TrendingUp, 
  PieChart, 
  FileText, 
  Newspaper, 
  Users, 
  Mail, 
  BookOpen, 
  ArrowRight, 
  Download, 
  ChevronRight, 
  BarChart3, 
  Calendar,
  Phone,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MapPin,
  Truck,
  Package,
  Globe
} from 'lucide-react';
import { Language } from '../types';

interface InvestorsProps {
  lang: Language;
}

export const Investors: React.FC<InvestorsProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState('story');

  const t = {
    title: lang === 'en' ? 'Investor Relations' : 'علاقات المستثمرين',
    subtitle: lang === 'en' 
      ? 'Transparency, growth, and sustainable value creation.' 
      : 'الشفافية، النمو، وخلق قيمة مستدامة.',
    tabs: {
        story: lang === 'en' ? 'Investment Story' : 'قصة الاستثمار',
        facts: lang === 'en' ? 'Data & Facts' : 'حقائق وأرقام',
        share: lang === 'en' ? 'Share Price Data' : 'بيانات السهم',
        financials: lang === 'en' ? 'Financial Reports' : 'التقارير المالية',
        news: lang === 'en' ? 'News & Announcements' : 'الأخبار والإفصاحات',
        governance: lang === 'en' ? 'Governance' : 'الحوكمة',
        contact: lang === 'en' ? 'Contact IR' : 'تواصل معنا',
    }
  };

  const navItems = [
    { id: 'story', icon: BookOpen, label: t.tabs.story },
    { id: 'facts', icon: PieChart, label: t.tabs.facts },
    { id: 'share', icon: TrendingUp, label: t.tabs.share },
    { id: 'financials', icon: FileText, label: t.tabs.financials },
    { id: 'news', icon: Newspaper, label: t.tabs.news },
    { id: 'governance', icon: Users, label: t.tabs.governance },
    { id: 'contact', icon: Mail, label: t.tabs.contact },
  ];

  // --- CONTENT COMPONENTS ---

  const InvestmentStory = () => (
    <div className="space-y-8 animate-slide-up">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-bold text-wassel-blue mb-4">
                {lang === 'en' ? 'Our Vision' : 'رؤيتنا'}
            </h3>
            <p className="text-gray-600 leading-relaxed text-lg">
                {lang === 'en' 
                    ? 'To be the unrivaled logistics backbone of the region, connecting markets with seamless technology and sustainable infrastructure.'
                    : 'أن نكون العمود الفقري اللوجستي الذي لا مثيل له في المنطقة، نربط الأسواق بتكنولوجيا سلسة وبنية تحتية مستدامة.'}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-wassel-blue to-wassel-darkBlue text-white p-8 rounded-2xl shadow-lg">
                <div className="mb-4 bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-wassel-yellow w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold mb-2">{lang === 'en' ? 'Consistent Growth' : 'نمو مستمر'}</h4>
                <p className="text-gray-300">
                    {lang === 'en' ? '15% YoY revenue increase for the last 5 years.' : 'زيادة في الإيرادات بنسبة 15% على أساس سنوي في السنوات الخمس الماضية.'}
                </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="mb-4 bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
                    <Globe className="text-wassel-blue w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-wassel-blue">{lang === 'en' ? 'Market Leader' : 'رائد السوق'}</h4>
                <p className="text-gray-600">
                    {lang === 'en' ? '#1 Market share in domestic courier services.' : 'المركز الأول في حصة السوق لخدمات البريد المحلي.'}
                </p>
            </div>
        </div>

        {/* Timeline */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-bold text-wassel-blue mb-8">{lang === 'en' ? 'Our Journey' : 'رحلتنا'}</h3>
            <div className="relative border-l-2 border-gray-200 rtl:border-l-0 rtl:border-r-2 rtl:mr-3 ltr:ml-3 space-y-8">
                {[
                    { year: '2023', title: { en: 'Expansion to Gulf', ar: 'التوسع للخليج' }, desc: { en: 'Launched operations in Riyadh & Dubai.', ar: 'إطلاق العمليات في الرياض ودبي.' } },
                    { year: '2020', title: { en: 'Digital Transformation', ar: 'التحول الرقمي' }, desc: { en: 'Launched Wassel App & API suite.', ar: 'إطلاق تطبيق واصل ومجموعة API.' } },
                    { year: '2015', title: { en: 'Foundation', ar: 'التأسيس' }, desc: { en: 'Started as a local courier in Ramallah.', ar: 'بدأت كشركة بريد محلية في رام الله.' } },
                ].map((item, i) => (
                    <div key={i} className="relative rtl:pr-8 ltr:pl-8">
                        <div className="absolute top-0 rtl:-right-2.5 ltr:-left-2.5 w-5 h-5 bg-wassel-yellow rounded-full border-4 border-white"></div>
                        <span className="text-sm font-bold text-wassel-blue bg-blue-50 px-2 py-1 rounded">{item.year}</span>
                        <h4 className="text-lg font-bold mt-1 text-gray-900">{lang === 'en' ? item.title.en : item.title.ar}</h4>
                        <p className="text-gray-500">{lang === 'en' ? item.desc.en : item.desc.ar}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const DataFacts = () => {
    const facts = [
        { label: { en: 'Market Cap', ar: 'القيمة السوقية' }, value: '950M ILS', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: { en: 'Annual Revenue', ar: 'الإيرادات السنوية' }, value: '165M ILS', icon: PieChart, color: 'text-green-600', bg: 'bg-green-50' },
        { label: { en: 'Employees', ar: 'الموظفين' }, value: '1,200+', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: { en: 'Fleet Size', ar: 'حجم الأسطول' }, value: '450', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: { en: 'Active Customers', ar: 'العملاء النشطين' }, value: '85K', icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: { en: 'Daily Shipments', ar: 'شحنات يومية' }, value: '12K', icon: Package, color: 'text-pink-600', bg: 'bg-pink-50' }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {facts.map((fact, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg ${fact.bg}`}>
                            <fact.icon className={`w-6 h-6 ${fact.color}`} />
                        </div>
                        <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">2023 FY</span>
                    </div>
                    <h4 className="text-3xl font-extrabold text-gray-900 mb-1">{fact.value}</h4>
                    <p className="text-gray-500 font-medium">{lang === 'en' ? fact.label.en : fact.label.ar}</p>
                </div>
            ))}
        </div>
    );
  };

  const SharePrice = () => {
      const [period, setPeriod] = useState('1M');
      // Mock Chart Data logic
      return (
          <div className="space-y-6 animate-slide-up">
             <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                     <div>
                         <h3 className="text-3xl font-extrabold text-wassel-blue">WASL <span className="text-lg font-normal text-gray-400">/ PSE</span></h3>
                         <div className="flex items-center gap-2 mt-2">
                             <span className="text-4xl font-bold text-gray-900">4.85</span>
                             <span className="text-sm text-gray-500 font-medium">ILS</span>
                             <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded text-sm font-bold ml-2">
                                 <ArrowUpRight className="w-4 h-4 mr-1" /> +1.2%
                             </span>
                         </div>
                         <p className="text-xs text-gray-400 mt-1">{lang === 'en' ? 'Last updated: Today, 14:00 Jerusalem Time' : 'آخر تحديث: اليوم، 14:00 بتوقيت القدس'}</p>
                     </div>
                     <div className="flex bg-gray-100 p-1 rounded-lg">
                         {['1D', '1W', '1M', '1Y', '5Y'].map(p => (
                             <button 
                                key={p} 
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${period === p ? 'bg-white text-wassel-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                             >
                                 {p}
                             </button>
                         ))}
                     </div>
                 </div>
                 
                 {/* CSS/SVG Chart Simulation */}
                 <div className="h-64 w-full bg-gradient-to-b from-blue-50 to-transparent rounded-lg border-b border-gray-200 relative overflow-hidden flex items-end px-4">
                     {/* Simplified Line */}
                     <svg className="w-full h-full absolute bottom-0 left-0" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,80 Q10,75 20,60 T40,50 T60,65 T80,30 T100,20" fill="none" stroke="#002B49" strokeWidth="2" />
                        <path d="M0,80 Q10,75 20,60 T40,50 T60,65 T80,30 T100,20 V100 H0 Z" fill="url(#grad)" opacity="0.2" />
                        <defs>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#002B49" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                     </svg>
                     
                     {/* Points */}
                     <div className="absolute top-[20%] right-0 w-3 h-3 bg-wassel-blue rounded-full border-2 border-white shadow-lg"></div>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                     <div className="text-center p-4 bg-gray-50 rounded-lg">
                         <span className="block text-gray-500 text-xs mb-1">Open</span>
                         <span className="font-bold text-gray-900">4.78</span>
                     </div>
                     <div className="text-center p-4 bg-gray-50 rounded-lg">
                         <span className="block text-gray-500 text-xs mb-1">High</span>
                         <span className="font-bold text-gray-900">4.90</span>
                     </div>
                     <div className="text-center p-4 bg-gray-50 rounded-lg">
                         <span className="block text-gray-500 text-xs mb-1">Low</span>
                         <span className="font-bold text-gray-900">4.75</span>
                     </div>
                     <div className="text-center p-4 bg-gray-50 rounded-lg">
                         <span className="block text-gray-500 text-xs mb-1">Vol</span>
                         <span className="font-bold text-gray-900">125K</span>
                     </div>
                 </div>
             </div>
          </div>
      );
  };

  const Financials = () => {
    const docs = [
        { title: { en: 'Annual Report 2022', ar: 'التقرير السنوي 2022' }, type: 'PDF', size: '4.2 MB' },
        { title: { en: 'Q3 2023 Earnings Presentation', ar: 'عرض أرباح الربع الثالث 2023' }, type: 'PDF', size: '1.8 MB' },
        { title: { en: 'Q3 2023 Financial Statements', ar: 'القوائم المالية للربع الثالث 2023' }, type: 'XLS', size: '0.5 MB' },
        { title: { en: 'ESG Report 2022', ar: 'تقرير الاستدامة 2022' }, type: 'PDF', size: '5.6 MB' },
    ];
    return (
        <div className="space-y-6 animate-slide-up">
            <h3 className="text-2xl font-bold text-wassel-blue mb-4">{lang === 'en' ? 'Latest Reports' : 'أحدث التقارير'}</h3>
            <div className="grid grid-cols-1 gap-4">
                {docs.map((doc, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
                            <div className="bg-red-50 p-3 rounded-lg text-red-600 group-hover:bg-red-100 transition-colors">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 group-hover:text-wassel-blue transition-colors">{lang === 'en' ? doc.title.en : doc.title.ar}</h4>
                                <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2 rtl:space-x-reverse">
                                    <span className="bg-gray-200 px-2 py-0.5 rounded">{doc.type}</span>
                                    <span>{doc.size}</span>
                                </div>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 text-sm font-bold text-wassel-blue bg-blue-50 px-4 py-2 rounded-lg hover:bg-wassel-blue hover:text-white transition-all">
                            <Download className="w-4 h-4" />
                            {lang === 'en' ? 'Download' : 'تحميل'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const News = () => {
      const news = [
        { date: 'Oct 25, 2023', title: { en: 'Wassel Expands EV Fleet', ar: 'واصل توسع أسطولها الكهربائي' }, cat: 'Sustainability' },
        { date: 'Oct 10, 2023', title: { en: 'Strategic Partnership with DHL', ar: 'شراكة استراتيجية مع DHL' }, cat: 'Expansion' },
        { date: 'Sep 28, 2023', title: { en: 'Q3 Financial Results', ar: 'نتائج الربع الثالث المالية' }, cat: 'Financials' },
        { date: 'Aug 15, 2023', title: { en: 'Appointment of New CFO', ar: 'تعيين مدير مالي جديد' }, cat: 'Governance' },
      ];
      return (
          <div className="space-y-6 animate-slide-up">
              {news.map((item, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-wassel-yellow bg-yellow-50 px-2 py-1 rounded-full uppercase tracking-wider">{item.cat}</span>
                          <span className="text-sm text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-wassel-blue cursor-pointer">{lang === 'en' ? item.title.en : item.title.ar}</h3>
                      <a href="#" className="inline-flex items-center text-sm text-wassel-blue font-semibold hover:underline mt-2">
                          {lang === 'en' ? 'Read full release' : 'اقرأ البيان الكامل'} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                      </a>
                  </div>
              ))}
          </div>
      );
  };

  const Governance = () => (
      <div className="animate-slide-up">
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-wassel-blue mb-6">{lang === 'en' ? 'Board of Directors' : 'مجلس الإدارة'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 text-center shadow-sm">
                        <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full mb-4 overflow-hidden">
                             <Users className="w-full h-full p-6 text-gray-400" />
                        </div>
                        <h4 className="font-bold text-lg text-gray-900">{lang === 'en' ? 'Board Member Name' : 'اسم عضو المجلس'}</h4>
                        <p className="text-wassel-blue text-sm font-medium mb-2">{lang === 'en' ? 'Chairman' : 'رئيس المجلس'}*</p>
                        <p className="text-xs text-gray-500">{lang === 'en' ? '30 years of experience in logistics and finance.' : '30 عاماً من الخبرة في الخدمات اللوجستية والمالية.'}</p>
                    </div>
                ))}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-wassel-blue mb-6">{lang === 'en' ? 'Committees' : 'اللجان'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="font-bold text-lg mb-2">{lang === 'en' ? 'Audit Committee' : 'لجنة التدقيق'}</h4>
                    <p className="text-sm text-gray-600">{lang === 'en' ? 'Oversight of financial reporting and disclosure.' : 'الإشراف على التقارير المالية والإفصاح.'}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="font-bold text-lg mb-2">{lang === 'en' ? 'Remuneration Committee' : 'لجنة المكافآت'}</h4>
                    <p className="text-sm text-gray-600">{lang === 'en' ? 'Reviewing compensation policies for executives.' : 'مراجعة سياسات التعويض للمسؤولين التنفيذيين.'}</p>
                </div>
            </div>
          </div>
      </div>
  );

  const ContactIR = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-wassel-blue text-white p-8 rounded-2xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4">{lang === 'en' ? 'IR Team' : 'فريق علاقات المستثمرين'}</h3>
                  <p className="text-gray-300 text-sm mb-6">
                      {lang === 'en' ? 'For any inquiries regarding stocks, financial reports, or governance.' : 'لأي استفسارات بخصوص الأسهم، التقارير المالية، أو الحوكمة.'}
                  </p>
                  <div className="space-y-4">
                      <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-wassel-yellow shrink-0" />
                          <span dir="ltr" className="text-sm">+970 2 2415161</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-wassel-yellow shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm">ir@wassel.ps</span>
                            <span className="text-xs text-gray-400">info@wassel.ps</span>
                          </div>
                      </div>
                      <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-wassel-yellow shrink-0 mt-1" />
                          <span className="text-sm leading-relaxed">
                            {lang === 'en' 
                              ? 'Ramallah, Edward Said St., Al-Qalaa Building, 2nd Floor' 
                              : 'رام الله، شارع إدوارد سعيد ،عمارة القلعة ، الطابق الثاني.'}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-bold text-wassel-blue mb-6">{lang === 'en' ? 'Send us a message' : 'أرسل لنا رسالة'}</h3>
              <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'en' ? 'Name' : 'الاسم'}</label>
                          <input type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'en' ? 'Email' : 'البريد الإلكتروني'}</label>
                          <input type="email" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue" />
                      </div>
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'en' ? 'Subject' : 'الموضوع'}</label>
                        <select className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue">
                            <option>General Inquiry</option>
                            <option>Financial Request</option>
                            <option>Shareholder Meeting</option>
                        </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'en' ? 'Message' : 'الرسالة'}</label>
                      <textarea rows={4} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue"></textarea>
                  </div>
                  <button type="submit" className="bg-wassel-yellow text-wassel-blue font-bold px-8 py-3 rounded-lg hover:bg-wassel-lightYellow transition-colors">
                      {lang === 'en' ? 'Send Message' : 'إرسال الرسالة'}
                  </button>
              </form>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation (Desktop) / Topbar (Mobile) */}
      <div className="w-full md:w-64 lg:w-72 bg-white border-b md:border-b-0 md:border-r rtl:md:border-r-0 rtl:md:border-l border-gray-200 flex-shrink-0 md:h-[calc(100vh-80px)] md:sticky md:top-[80px] z-10 overflow-x-auto md:overflow-x-visible no-scrollbar">
          <div className="p-4 md:p-6 flex md:flex-col gap-2 md:gap-1">
              {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === item.id 
                        ? 'bg-wassel-blue text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                      <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-wassel-yellow' : 'text-gray-400'}`} />
                      {item.label}
                  </button>
              ))}
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
              <div className="mb-8">
                  <h2 className="text-3xl font-extrabold text-wassel-blue">{t.title}</h2>
                  <p className="text-gray-500 mt-2 text-lg">{t.subtitle}</p>
              </div>
              
              <div className="min-h-[500px]">
                {activeTab === 'story' && <InvestmentStory />}
                {activeTab === 'facts' && <DataFacts />}
                {activeTab === 'share' && <SharePrice />}
                {activeTab === 'financials' && <Financials />}
                {activeTab === 'news' && <News />}
                {activeTab === 'governance' && <Governance />}
                {activeTab === 'contact' && <ContactIR />}
              </div>
          </div>
      </div>
    </div>
  );
};