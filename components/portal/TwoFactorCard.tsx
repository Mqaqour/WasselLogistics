import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react';
import { Language } from '../../types';
import { adminFetch } from '../../services/adminApi';

interface TwoFactorCardProps {
  lang: Language;
}

type SetupData = { secret: string; otpauthUrl: string; qrDataUrl: string };

const cardCls = 'bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-4';
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg font-semibold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500';
const btnPrim = 'bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2 transition-colors';
const btnSec = 'px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2 transition-colors';

export const TwoFactorCard: React.FC<TwoFactorCardProps> = ({ lang }) => {
  const isRtl = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [setup, setSetup] = useState<SetupData | null>(null);
  const [code, setCode] = useState('');
  const [disarmCode, setDisarmCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  const t = {
    title: isRtl ? 'التحقق بخطوتين (تطبيق مصادقة)' : 'Two-Factor Authentication (authenticator app)',
    subtitle: isRtl
      ? 'أضف طبقة حماية ثانية لتسجيل الدخول باستخدام Google Authenticator أو Authy أو ما شابه.'
      : 'Add a second layer to portal login using Google Authenticator, Authy, or similar.',
    on: isRtl ? 'مُفعّل' : 'Enabled',
    off: isRtl ? 'غير مُفعّل' : 'Not enabled',
    setUp: isRtl ? 'إعداد التحقق بخطوتين' : 'Set up two-factor',
    scan: isRtl
      ? 'امسح رمز QR بتطبيق المصادقة، ثم أدخل الرمز المكوّن من 6 أرقام لتأكيد التفعيل.'
      : 'Scan the QR with your authenticator app, then enter the 6-digit code to confirm.',
    manualKey: isRtl ? 'أو أدخل المفتاح يدوياً:' : 'Or enter this key manually:',
    enable: isRtl ? 'تفعيل' : 'Enable',
    cancel: isRtl ? 'إلغاء' : 'Cancel',
    disable: isRtl ? 'إيقاف التفعيل' : 'Disable',
    disablePrompt: isRtl ? 'أدخل رمزاً حالياً من التطبيق لإيقاف التفعيل:' : 'Enter a current code from the app to turn it off:',
    codePlaceholder: '000000',
    enabledOk: isRtl ? '✓ تم تفعيل التحقق بخطوتين' : '✓ Two-factor authentication enabled',
    disabledOk: isRtl ? 'تم إيقاف التحقق بخطوتين' : 'Two-factor authentication disabled',
    genericErr: isRtl ? 'تعذّر إكمال العملية' : 'Could not complete the request',
    invalidCode: isRtl ? 'رمز غير صحيح' : 'Invalid code',
  };

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => {
    adminFetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setEnabled(!!d?.user?.mfaEnabled))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await adminFetch('/api/auth/totp/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      setSetup({ secret: data.secret, otpauthUrl: data.otpauthUrl, qrDataUrl: data.qrDataUrl });
      setCode('');
    } catch {
      flash(t.genericErr, false);
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async () => {
    setBusy(true);
    try {
      const res = await adminFetch('/api/auth/totp/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(data?.error ?? t.invalidCode, false);
        return;
      }
      setEnabled(true);
      setSetup(null);
      setCode('');
      flash(t.enabledOk, true);
    } catch {
      flash(t.genericErr, false);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const res = await adminFetch('/api/auth/totp/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disarmCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(data?.error ?? t.invalidCode, false);
        return;
      }
      setEnabled(false);
      setShowDisable(false);
      setDisarmCode('');
      flash(t.disabledOk, true);
    } catch {
      flash(t.genericErr, false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cardCls}>
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        {enabled ? <ShieldCheck size={16} className="text-green-600" /> : <ShieldOff size={16} className="text-gray-400" />}
        <div>
          <h2 className="font-semibold text-gray-800">{t.title}</h2>
          <p className="text-xs text-gray-400">{t.subtitle}</p>
        </div>
        <span
          className={`ms-auto text-xs font-medium px-2 py-0.5 rounded-full ${enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
        >
          {enabled ? t.on : t.off}
        </span>
      </div>

      {msg && (
        <p className={`text-sm rounded-lg px-3 py-2 ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{msg.text}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
      ) : enabled ? (
        showDisable ? (
          <div className="space-y-3 max-w-xs">
            <p className="text-sm text-gray-600">{t.disablePrompt}</p>
            <input
              className={inputCls}
              inputMode="numeric"
              maxLength={6}
              placeholder={t.codePlaceholder}
              value={disarmCode}
              onChange={(e) => setDisarmCode(e.target.value.replace(/\D/g, ''))}
            />
            <div className="flex gap-2">
              <button className={btnPrim} onClick={disable} disabled={busy || disarmCode.length !== 6}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                {t.disable}
              </button>
              <button className={btnSec} onClick={() => { setShowDisable(false); setDisarmCode(''); }} disabled={busy}>
                {t.cancel}
              </button>
            </div>
          </div>
        ) : (
          <button className={btnSec} onClick={() => setShowDisable(true)}>
            <ShieldOff size={14} />
            {t.disable}
          </button>
        )
      ) : setup ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{t.scan}</p>
          <img src={setup.qrDataUrl} alt="TOTP QR" className="border border-gray-200 rounded-lg" width={200} height={200} />
          <p className="text-xs text-gray-500">
            {t.manualKey} <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700 break-all">{setup.secret}</code>
          </p>
          <div className="flex items-center gap-2 max-w-xs">
            <input
              className={inputCls}
              inputMode="numeric"
              maxLength={6}
              placeholder={t.codePlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="flex gap-2">
            <button className={btnPrim} onClick={confirmSetup} disabled={busy || code.length !== 6}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {t.enable}
            </button>
            <button className={btnSec} onClick={() => { setSetup(null); setCode(''); }} disabled={busy}>
              {t.cancel}
            </button>
          </div>
        </div>
      ) : (
        <button className={btnPrim} onClick={startSetup} disabled={busy}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
          {t.setUp}
        </button>
      )}
    </div>
  );
};
