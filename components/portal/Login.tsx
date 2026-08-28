import React, { useState } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';
import { Language } from '../../types';
import { setAdminToken } from '../../services/adminApi';

interface LoginProps {
  onLogin: () => void;
  lang: Language;
}

export const Login: React.FC<LoginProps> = ({ onLogin, lang }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    title: lang === 'en' ? 'Portal Login' : 'تسجيل الدخول',
    subtitle: lang === 'en' ? 'Enter your username and password' : 'أدخل اسم المستخدم وكلمة المرور',
    username: lang === 'en' ? 'Username' : 'اسم المستخدم',
    usernamePlaceholder: lang === 'en' ? 'Username' : 'اسم المستخدم',
    password: lang === 'en' ? 'Password' : 'كلمة المرور',
    passwordPlaceholder: lang === 'en' ? 'Password' : 'كلمة المرور',
    signIn: lang === 'en' ? 'Login' : 'دخول',
    signingIn: lang === 'en' ? 'Logging in...' : 'جاري الدخول...',
    invalid: lang === 'en' ? 'Invalid username or password.' : 'اسم المستخدم أو كلمة المرور غير صحيحة.',
    mfaTitle: lang === 'en' ? 'Two-Factor Authentication' : 'التحقق بخطوتين',
    mfaSubtitle: lang === 'en'
      ? 'Enter the 6-digit code from your authenticator app'
      : 'أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة',
    code: lang === 'en' ? 'Code' : 'الرمز',
    verify: lang === 'en' ? 'Verify' : 'تحقق',
    verifying: lang === 'en' ? 'Verifying...' : 'جاري التحقق...',
    invalidCode: lang === 'en' ? 'Invalid authentication code.' : 'رمز التحقق غير صحيح.',
    blocked: lang === 'en'
      ? 'This IP is blocked for 24 hours because of repeated failed login attempts.'
      : 'تم حظر هذا العنوان لمدة 24 ساعة بسبب محاولات دخول متكررة.',
    unavailable: lang === 'en'
      ? 'Login service is unavailable. Please try again later.'
      : 'خدمة تسجيل الدخول غير متاحة حالياً. حاول مرة أخرى لاحقاً.',
    attemptsLeft: lang === 'en' ? 'attempts left' : 'محاولات متبقية',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, totp: mfaRequired ? totp : undefined }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.ok) {
        if (typeof data.token === 'string') setAdminToken(data.token);
        onLogin();
        return;
      }

      // Password was correct but the authenticator code is still needed / was wrong.
      if (data?.mfaRequired) {
        setMfaRequired(true);
        setTotp('');
        if (response.status === 401) {
          const remaining = typeof data?.remainingAttempts === 'number'
            ? ` ${data.remainingAttempts} ${t.attemptsLeft}.`
            : '';
          setError(`${t.invalidCode}${remaining}`);
        }
        return;
      }

      if (response.status === 423) {
        setError(t.blocked);
        return;
      }

      if (response.status === 401) {
        const remaining = typeof data?.remainingAttempts === 'number'
          ? ` ${data.remainingAttempts} ${t.attemptsLeft}.`
          : '';
        setError(`${t.invalid}${remaining}`);
        return;
      }

      setError(t.unavailable);
    } catch {
      setError(t.unavailable);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          {mfaRequired && <ShieldCheck className="mx-auto h-10 w-10 text-slate-700" />}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {mfaRequired ? t.mfaTitle : t.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mfaRequired ? t.mfaSubtitle : t.subtitle}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!mfaRequired ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full border-collapse">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <th scope="row" className="w-32 bg-gray-50 px-4 py-4 text-start text-sm font-semibold text-gray-700">
                      {t.username}
                    </th>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <User className="absolute top-3 rtl:right-3 ltr:left-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          autoComplete="username"
                          required
                          className="block w-full rounded-md border border-gray-300 bg-white rtl:pr-10 ltr:pl-10 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder={t.usernamePlaceholder}
                          value={username}
                          onChange={(event) => setUsername(event.target.value)}
                          aria-invalid={!!error}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="w-32 bg-gray-50 px-4 py-4 text-start text-sm font-semibold text-gray-700">
                      {t.password}
                    </th>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <Lock className="absolute top-3 rtl:right-3 ltr:left-3 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          autoComplete="current-password"
                          required
                          className="block w-full rounded-md border border-gray-300 bg-white rtl:pr-10 ltr:pl-10 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder={t.passwordPlaceholder}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          aria-invalid={!!error}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <label htmlFor="totp" className="block text-sm font-semibold text-gray-700 mb-1">{t.code}</label>
              <input
                id="totp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                autoFocus
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-center text-lg font-semibold tracking-[0.4em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="000000"
                value={totp}
                onChange={(event) => setTotp(event.target.value.replace(/\D/g, ''))}
                aria-invalid={!!error}
              />
            </div>
          )}

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70"
            >
              {mfaRequired
                ? (loading ? t.verifying : t.verify)
                : (loading ? t.signingIn : t.signIn)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
