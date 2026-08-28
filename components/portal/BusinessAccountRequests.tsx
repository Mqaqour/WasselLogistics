import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Database, LayoutDashboard, Loader2, RefreshCw, Settings } from 'lucide-react';
import { Language } from '../../types';
import { adminFetch } from '../../services/adminApi';

interface BusinessAccountRequestsProps {
  lang: Language;
}

type Status = 'new' | 'contacted' | 'approved' | 'rejected';

interface BusinessAccountRequest {
  id: number;
  services: string[];
  companyName: string;
  companyRegNo: string | null;
  industry: string | null;
  website: string | null;
  monthlyVolumeBand: string | null;
  contactName: string;
  contactRole: string | null;
  contactEmail: string;
  contactPhone: string;
  pickupCity: string | null;
  pickupArea: string | null;
  destinations: string | null;
  notes: string | null;
  language: string | null;
  status: Status;
  emailDeliveryStatus: 'pending' | 'sent' | 'failed';
  emailError: string | null;
  createdAt: string;
  updatedAt: string;
}

const BACKEND_URL = import.meta.env.VITE_CHAT_BACKEND_URL || '';
const LIST_URL = `${BACKEND_URL}/api/business-account/requests`;

const STATUSES: Status[] = ['new', 'contacted', 'approved', 'rejected'];

const SERVICE_LABELS: Record<string, { en: string; ar: string }> = {
  domestic: { en: 'Domestic', ar: 'محلي' },
  express: { en: 'Intl Express', ar: 'دولي سريع' },
  cargo: { en: 'Cargo & Freight', ar: 'بضائع' },
  customs: { en: 'Customs', ar: 'تخليص' },
  '3pl': { en: '3PL & Warehousing', ar: 'تخزين' },
  cod: { en: 'COD', ar: 'الدفع عند الاستلام' },
};

export const BusinessAccountRequests: React.FC<BusinessAccountRequestsProps> = ({ lang }) => {
  const navigate = useNavigate();
  const isRtl = lang === 'ar';

  const [items, setItems] = useState<BusinessAccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const t = {
    title: isRtl ? 'طلبات فتح الحسابات التجارية' : 'Business Account Requests',
    subtitle: isRtl
      ? 'الطلبات المُرسلة من نافذة "فتح حساب" — تابعها حتى الإغلاق.'
      : 'Leads submitted from the "Open Account" wizard — follow them through to close.',
    refresh: isRtl ? 'تحديث' : 'Refresh',
    dashboard: isRtl ? 'لوحة التحكم' : 'Dashboard',
    kbAdmin: isRtl ? 'قاعدة المعرفة' : 'KB Admin',
    settings: isRtl ? 'الإعدادات' : 'Settings',
    company: isRtl ? 'الشركة' : 'Company',
    contact: isRtl ? 'الشخص المسؤول' : 'Contact',
    services: isRtl ? 'الخدمات' : 'Services',
    volume: isRtl ? 'الحجم الشهري' : 'Monthly Vol.',
    status: isRtl ? 'الحالة' : 'Status',
    created: isRtl ? 'التاريخ' : 'Submitted',
    empty: isRtl ? 'لا توجد طلبات بعد.' : 'No requests yet.',
    loadError: isRtl ? 'تعذر تحميل القائمة. يرجى التحديث.' : 'Could not load the list. Please refresh.',
    emailFailed: isRtl ? 'فشل إرسال بريد الإشعار' : 'Notification email failed',
    reg: isRtl ? 'السجل / الضريبي' : 'Reg / Tax No.',
    industry: isRtl ? 'القطاع' : 'Industry',
    website: isRtl ? 'الموقع' : 'Website',
    pickup: isRtl ? 'الاستلام' : 'Pickup',
    destinations: isRtl ? 'الوجهات' : 'Destinations',
    notes: isRtl ? 'ملاحظات' : 'Notes',
    reference: isRtl ? 'رقم الطلب' : 'Reference',
    statusLabels: {
      new: isRtl ? 'جديد' : 'New',
      contacted: isRtl ? 'تم التواصل' : 'Contacted',
      approved: isRtl ? 'مقبول' : 'Approved',
      rejected: isRtl ? 'مرفوض' : 'Rejected',
    } as Record<Status, string>,
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch(LIST_URL);
      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeStatus = async (id: number, status: Status) => {
    setUpdatingId(id);
    // optimistic
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    try {
      const res = await adminFetch(`${BACKEND_URL}/api/business-account/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      load(); // revert to server truth
    } finally {
      setUpdatingId(null);
    }
  };

  const statusPill = (s: Status) => {
    const map: Record<Status, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-amber-100 text-amber-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return map[s];
  };

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(isRtl ? 'ar-PS' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const serviceLabel = (id: string) => SERVICE_LABELS[id]?.[isRtl ? 'ar' : 'en'] ?? id;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full max-w-[1400px] mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-wassel-blue flex items-center gap-2">
            <Building2 className="w-7 h-7" />
            {t.title}
          </h1>
          <p className="text-gray-500 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={load} className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">
            <RefreshCw size={14} />
            {t.refresh}
          </button>
          <button onClick={() => navigate(`/${lang}/dashboard`)} className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
            <LayoutDashboard size={14} />
            {t.dashboard}
          </button>
          <button onClick={() => navigate(`/${lang}/admin/kb`)} className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <Database size={14} />
            {t.kbAdmin}
          </button>
          <button onClick={() => navigate(`/${lang}/admin/settings`)} className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-gray-700 text-white hover:bg-gray-800 transition-colors">
            <Settings size={14} />
            {t.settings}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 py-16">{t.empty}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3">{t.company}</th>
                <th className="px-4 py-3">{t.contact}</th>
                <th className="px-4 py-3 hidden lg:table-cell">{t.services}</th>
                <th className="px-4 py-3 hidden md:table-cell">{t.volume}</th>
                <th className="px-4 py-3">{t.status}</th>
                <th className="px-4 py-3 hidden md:table-cell">{t.created}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it) => (
                <React.Fragment key={it.id}>
                  <tr className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 align-top">
                      <button
                        onClick={() => setExpanded(expanded === it.id ? null : it.id)}
                        className="text-gray-400 hover:text-gray-700"
                        aria-label="Toggle details"
                      >
                        <ChevronDown size={16} className={`transition-transform ${expanded === it.id ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-gray-900">{it.companyName}</div>
                      <div className="text-xs text-gray-400">#{it.id}{it.industry ? ` · ${it.industry}` : ''}</div>
                      {it.emailDeliveryStatus === 'failed' && (
                        <div className="text-xs text-red-600 mt-0.5">{t.emailFailed}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-gray-900">{it.contactName}{it.contactRole ? <span className="text-gray-400"> · {it.contactRole}</span> : null}</div>
                      <div className="text-xs text-gray-500" dir="ltr">{it.contactEmail}</div>
                      <div className="text-xs text-gray-500" dir="ltr">{it.contactPhone}</div>
                    </td>
                    <td className="px-4 py-3 align-top hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {it.services.map((s) => (
                          <span key={s} className="rounded bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[11px]">{serviceLabel(s)}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top hidden md:table-cell text-gray-600">{it.monthlyVolumeBand || '—'}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusPill(it.status)}`}>
                          {t.statusLabels[it.status]}
                        </span>
                        <select
                          value={it.status}
                          disabled={updatingId === it.id}
                          onChange={(e) => changeStatus(it.id, e.target.value as Status)}
                          className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white disabled:opacity-50"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{t.statusLabels[s]}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top hidden md:table-cell text-gray-500 whitespace-nowrap">{fmtDate(it.createdAt)}</td>
                  </tr>
                  {expanded === it.id && (
                    <tr className="bg-gray-50/60">
                      <td />
                      <td colSpan={6} className="px-4 py-3">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                          {([
                            [t.reference, `#${it.id}`],
                            [t.reg, it.companyRegNo],
                            [t.industry, it.industry],
                            [t.website, it.website],
                            [t.services, it.services.map(serviceLabel).join(isRtl ? '، ' : ', ')],
                            [t.volume, it.monthlyVolumeBand],
                            [t.pickup, [it.pickupCity, it.pickupArea].filter(Boolean).join(' — ')],
                            [t.destinations, it.destinations],
                            [t.notes, it.notes],
                          ] as [string, string | null][])
                            .filter(([, v]) => v && String(v).trim().length > 0)
                            .map(([k, v]) => (
                              <div key={k} className="flex gap-2">
                                <dt className="text-gray-500 shrink-0 w-32">{k}</dt>
                                <dd className="text-gray-800 whitespace-pre-line break-words">{v}</dd>
                              </div>
                            ))}
                        </dl>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
