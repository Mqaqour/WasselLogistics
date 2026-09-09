import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, PackageCheck, Bell, Database, Send, RefreshCw, Settings, Building2 } from 'lucide-react';
import { Language } from '../../types';
import { adminFetch } from '../../services/adminApi';

interface DashboardProps {
    lang: Language;
}

interface WaitingShipment {
    id: number;
    trackingNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    carrier: string | null;
    language: string | null;
    status: 'pending' | 'found' | 'notified' | 'expired';
    lastCheckedAt: string | null;
    foundAt: string | null;
    createdAt: string;
}

const BACKEND_URL = import.meta.env.VITE_CHAT_BACKEND_URL || '';
const WAITING_SHIPMENTS_URL = `${BACKEND_URL}/api/waiting-shipments`;
const SMS_PROXY_URL = `${BACKEND_URL}/api/sms/send-verification`;

export const Dashboard: React.FC<DashboardProps> = ({ lang }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<WaitingShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const t = {
      title: lang === 'en' ? 'Waiting-to-Arrive Shipments' : 'الشحنات بانتظار الوصول',
      subtitle: lang === 'en'
        ? 'Tracking numbers customers registered because they weren’t found yet.'
        : 'أرقام التتبع التي سجّلها العملاء لأنها لم تُعثر عليها بعد.',
      total: lang === 'en' ? 'Total Registered' : 'إجمالي المسجَّل',
      pending: lang === 'en' ? 'Still Pending' : 'قيد الانتظار',
      found: lang === 'en' ? 'Found' : 'تم العثور عليها',
      trackingNumber: lang === 'en' ? 'Tracking Number' : 'رقم التتبع',
      customer: lang === 'en' ? 'Customer' : 'العميل',
      carrier: lang === 'en' ? 'Carrier' : 'الناقل',
      status: lang === 'en' ? 'Status' : 'الحالة',
      registeredAt: lang === 'en' ? 'Registered' : 'تاريخ التسجيل',
      action: lang === 'en' ? 'Action' : 'إجراء',
      sendSms: lang === 'en' ? 'Send SMS' : 'إرسال SMS',
      sending: lang === 'en' ? 'Sending...' : 'جاري الإرسال...',
      noPhone: lang === 'en' ? 'No phone on file' : 'لا يوجد رقم هاتف',
      refresh: lang === 'en' ? 'Refresh' : 'تحديث',
      loading: lang === 'en' ? 'Loading...' : 'جاري التحميل...',
      empty: lang === 'en' ? 'No waiting shipments registered yet.' : 'لا توجد شحنات مسجَّلة بانتظار الوصول حالياً.',
      loadError: lang === 'en' ? 'Could not load the list. Please refresh.' : 'تعذر تحميل القائمة. يرجى التحديث.',
      smsSent: lang === 'en' ? 'SMS sent' : 'تم إرسال الرسالة',
      smsFailed: lang === 'en' ? 'Could not send SMS' : 'تعذر إرسال الرسالة',
      statusLabels: {
        pending: lang === 'en' ? 'Pending' : 'قيد الانتظار',
        found: lang === 'en' ? 'Found' : 'تم العثور عليها',
        notified: lang === 'en' ? 'Notified' : 'تم الإبلاغ',
        expired: lang === 'en' ? 'Expired' : 'منتهية',
      },
  };

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminFetch(WAITING_SHIPMENTS_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: number, status: WaitingShipment['status']) => {
    setUpdatingId(id);
    try {
      const response = await adminFetch(`${WAITING_SHIPMENTS_URL}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch {
      // Silently ignore — the dropdown just won't reflect the change, admin can retry.
    } finally {
      setUpdatingId(null);
    }
  };

  const buildSmsMessage = (item: WaitingShipment): string => {
    const isAr = (item.language ?? lang) === 'ar';
    if (item.status === 'found') {
      return isAr
        ? `مرحباً ${item.customerName}، شحنتك برقم ${item.trackingNumber} أصبحت متوفرة الآن — يمكنك تتبعها على موقع واصل.`
        : `Hi ${item.customerName}, your shipment ${item.trackingNumber} is now available — you can track it on the Wassel website.`;
    }
    return isAr
      ? `مرحباً ${item.customerName}، ما زلنا نتابع شحنتك برقم ${item.trackingNumber} وسنعلمك فور توفر معلومات عنها.`
      : `Hi ${item.customerName}, we're still tracking your shipment ${item.trackingNumber} and will notify you as soon as it appears.`;
  };

  const handleSendSms = async (item: WaitingShipment) => {
    if (!item.customerPhone) return;
    setSendingId(item.id);
    try {
      const response = await fetch(SMS_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: item.customerPhone, msg: buildSmsMessage(item) }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await updateStatus(item.id, 'notified');
      alert(t.smsSent);
    } catch {
      alert(t.smsFailed);
    } finally {
      setSendingId(null);
    }
  };

  const statusBadgeClass = (status: WaitingShipment['status']) => {
    switch (status) {
      case 'found': return 'bg-blue-100 text-blue-800';
      case 'notified': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-gray-100 text-gray-600';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const foundCount = items.filter((i) => i.status === 'found' || i.status === 'notified').length;

  return (
    <div className="w-full max-w-[1920px] mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-wassel-blue">{t.title}</h1>
          <p className="text-gray-500 mt-1">{t.subtitle}</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2 items-center">
            <button
                onClick={loadItems}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            >
                <RefreshCw size={14} />
                {t.refresh}
            </button>
            <button
                onClick={() => navigate(`/${lang}/admin/business-accounts`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-wassel-blue text-white hover:bg-wassel-darkBlue transition-colors"
                title={lang === 'ar' ? 'طلبات فتح الحسابات التجارية' : 'Business Account Requests'}
            >
                <Building2 size={14} />
                {lang === 'ar' ? 'الحسابات التجارية' : 'Business Accounts'}
            </button>
            <button
                onClick={() => navigate(`/${lang}/admin/kb`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                title={lang === 'ar' ? 'إدارة قاعدة المعرفة' : 'KB Admin'}
            >
                <Database size={14} />
                {lang === 'ar' ? 'قاعدة المعرفة' : 'KB Admin'}
            </button>
            <button
                onClick={() => navigate(`/${lang}/admin/settings`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-gray-700 text-white hover:bg-gray-800 transition-colors"
                title={lang === 'ar' ? 'إعدادات النظام' : 'System Settings'}
            >
                <Settings size={14} />
                {lang === 'ar' ? 'الإعدادات' : 'Settings'}
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pop delay-100">
            <div className="flex items-center">
                <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                    <Bell className="w-6 h-6" />
                </div>
                <div className="rtl:mr-4 ltr:ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.total}</p>
                    <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pop delay-200">
            <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                    <Clock className="w-6 h-6" />
                </div>
                <div className="rtl:mr-4 ltr:ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.pending}</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pop delay-300">
            <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full text-green-600">
                    <PackageCheck className="w-6 h-6" />
                </div>
                <div className="rtl:mr-4 ltr:ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.found}</p>
                    <p className="text-2xl font-bold text-gray-900">{foundCount}</p>
                </div>
            </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-slide-up delay-300">
        {loading ? (
          <p className="p-6 text-center text-gray-500 text-sm">{t.loading}</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-gray-500 text-sm">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.trackingNumber}</th>
                  <th scope="col" className="px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.customer}</th>
                  <th scope="col" className="hidden md:table-cell px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.carrier}</th>
                  <th scope="col" className="px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.status}</th>
                  <th scope="col" className="hidden md:table-cell px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.registeredAt}</th>
                  <th scope="col" className="px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.action}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" dir="ltr">{item.trackingNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{item.customerName}</div>
                      <div className="text-xs text-gray-500">{item.customerEmail}</div>
                      <div className="text-xs text-gray-500" dir="ltr">{item.customerPhone || t.noPhone}</div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{item.carrier || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={item.status}
                        disabled={updatingId === item.id}
                        onChange={(e) => updateStatus(item.id, e.target.value as WaitingShipment['status'])}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-wassel-yellow disabled:opacity-60 ${statusBadgeClass(item.status)}`}
                      >
                        {(['pending', 'found', 'notified', 'expired'] as const).map((s) => (
                          <option key={s} value={s}>{t.statusLabels[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleSendSms(item)}
                        disabled={!item.customerPhone || sendingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-wassel-blue px-3 py-1.5 text-white text-xs font-semibold hover:bg-wassel-darkBlue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {sendingId === item.id ? t.sending : t.sendSms}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
