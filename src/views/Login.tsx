import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Lock, Phone } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { supabase } from '../lib/supabase-client';
import { normalizeMoroccoPhone, phoneToSyntheticEmail } from '../lib/authIdentity';
import OtpVerificationCard from '../components/OtpVerificationCard';

interface LoginProps {
  language: Language;
  onLogin: (email: string, user?: any) => void | Promise<void>;
  onGoToSignup: () => void;
  onForgotPassword?: (email: string) => void;
  initialEmail?: string;
  initialPassword?: string;
}

/** Délai max pour la réponse Supabase `signInWithPassword` (réseau / proxy / Brave). */
const SIGN_IN_TIMEOUT_MS = 28_000;
/** Temps max pour `onLogin` (profil + navigation) après un JWT valide. */
const AFTER_SIGN_IN_TIMEOUT_MS = 20_000;
/** Filet si une exception empêche `finally` (très rare). */
const LOADING_FAILSAFE_MS = SIGN_IN_TIMEOUT_MS + AFTER_SIGN_IN_TIMEOUT_MS + 5_000;

const Login: React.FC<LoginProps> = ({ language, onLogin, onGoToSignup, onForgotPassword, initialEmail = '', initialPassword = '' }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(initialPassword);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingPhoneE164, setPendingPhoneE164] = useState('');
  const [pendingLoginEmail, setPendingLoginEmail] = useState('');
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const timer = window.setTimeout(() => setResendSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSecondsLeft]);

  const safeSetLoading = (v: boolean) => {
    if (mountedRef.current) setIsLoading(v);
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneInfo = normalizeMoroccoPhone(phone);
    if (!phoneInfo) {
      setError(t('phoneError9Digits'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    safeSetLoading(true);
    setError('');
    const failsafeId = window.setTimeout(() => safeSetLoading(false), LOADING_FAILSAFE_MS);
    try {
      const syntheticEmail = phoneToSyntheticEmail(phoneInfo.e164);

      const validatePromise = fetch('/api/validate-phone-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: syntheticEmail, password }),
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), SIGN_IN_TIMEOUT_MS);
      });
      const validateRes = await Promise.race([validatePromise, timeoutPromise]) as Response;
      const validateBody = (await validateRes.json().catch(() => ({}))) as { error?: string };
      if (!validateRes.ok) {
        setError(validateBody.error || 'Identifiants invalides');
        return;
      }

      const otpRes = await fetch('/api/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneInfo.e164 }),
      });
      const otpBody = (await otpRes.json().catch(() => ({}))) as { error?: string };
      if (!otpRes.ok) {
        setError(otpBody.error || 'Impossible d envoyer le code OTP.');
        return;
      }

      setPendingPhoneE164(phoneInfo.e164);
      setPendingLoginEmail(syntheticEmail);
      setOtpSent(true);
      setResendSecondsLeft(30);
    } catch (err) {
      if (err instanceof Error && err.message === 'LOGIN_TIMEOUT') {
        setError(t('loginTimeout'));
      } else {
        setError(err instanceof Error ? err.message : t('loginUnexpectedError'));
      }
    } finally {
      window.clearTimeout(failsafeId);
      safeSetLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingPhoneE164 || resendSecondsLeft > 0) return;
    safeSetLoading(true);
    setError('');
    try {
      const otpRes = await fetch('/api/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: pendingPhoneE164 }),
      });
      const otpBody = (await otpRes.json().catch(() => ({}))) as { error?: string };
      if (!otpRes.ok) {
        setError(otpBody.error || 'Impossible d envoyer le code OTP.');
        return;
      }
      setResendSecondsLeft(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur reseau');
    } finally {
      safeSetLoading(false);
    }
  };

  const verifyOtpAndLogin = async (code: string) => {
    if (!code || code.length < 6) {
      setError('Code OTP invalide.');
      return;
    }
    if (!pendingLoginEmail || !pendingPhoneE164) {
      setError('Session OTP invalide, recommencez.');
      return;
    }
    safeSetLoading(true);
    setError('');
    try {
      const verifyRes = await fetch('/api/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: pendingPhoneE164, code }),
      });
      const verifyBody = (await verifyRes.json().catch(() => ({}))) as { error?: string };
      if (!verifyRes.ok) {
        setError(verifyBody.error || 'Code OTP invalide ou expire.');
        return;
      }

      const signInResult = await supabase.auth.signInWithPassword({ email: pendingLoginEmail, password });
      if (signInResult.error) {
        setError(signInResult.error.message);
        return;
      }
      if (signInResult.data.user) {
        await onLogin(pendingLoginEmail, signInResult.data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginUnexpectedError'));
    } finally {
      safeSetLoading(false);
    }
  };

  return (
    <div className="veetaa-login-page">
      <div className="veetaa-login-card">
        <div className="veetaa-login-header">
          <h2 className="veetaa-login-title">{t('welcomeBack')}</h2>
          <p className="veetaa-login-subtitle">
            {otpSent ? (t('enterCodeSentTo') || 'Entrez le code envoye') : (t('enterPhoneToContinue') || 'Entrez votre numero pour continuer.')}
          </p>
        </div>

        <form onSubmit={validateAndSubmit} className="veetaa-login-form">
          <div className="veetaa-field">
            <label className="veetaa-label">{t('phone')}</label>
            <div className="veetaa-signup-phone-row">
              <div className="veetaa-signup-phone-prefix">+212</div>
              <div className="veetaa-input-wrap">
                <Phone className="veetaa-input-icon" aria-hidden />
                <input
                  type="tel"
                  placeholder="6XX XXX XXX"
                  className="veetaa-input"
                  value={phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    let local = digits;
                    if (local.startsWith('212')) local = `0${local.slice(3)}`;
                    if (local.length <= 10) {
                      setPhone(local);
                      setError('');
                    }
                  }}
                  required
                />
              </div>
            </div>
          </div>

          <div className="veetaa-field">
            <label className="veetaa-label">{t('password')}</label>
            <div className="veetaa-input-wrap">
              <Lock className="veetaa-input-icon" aria-hidden />
              <input
                type="password"
                placeholder="••••••••"
                className="veetaa-input"
                autoFocus={phone.length > 0}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                minLength={6}
              />
            </div>
            {error && <p className="veetaa-error">{error}</p>}
          </div>

          {!otpSent ? (
            <button type="submit" disabled={isLoading} className="veetaa-btn-primary">
              {isLoading ? t('loading') : 'Envoyer le code'}
              <ArrowRight className="veetaa-btn-icon" aria-hidden />
            </button>
          ) : (
            <></>
          )}
        </form>

        <div className="veetaa-login-links">
          <p className="veetaa-login-link-p">
            {t('noAccount')}{' '}
            <button type="button" onClick={onGoToSignup} className="veetaa-link">
              {t('signup')}
            </button>
          </p>
          {onForgotPassword && !otpSent && (
            <p className="veetaa-login-link-p">
              <button
                type="button"
                onClick={() => {
                  setError('Reset par email desactive sur ce flow telephone.');
                }}
                className="veetaa-link"
              >
                {t('forgotPassword')}
              </button>
            </p>
          )}
        </div>
      </div>

      {otpSent && (
        <div className="otp-overlay" role="dialog" aria-modal="true">
          <div className="otp-overlay-card">
            <OtpVerificationCard
              titleTop="OTP"
              titleBottom="Verification Code"
              message={`${t('enterCodeSentTo') || 'Entrez le code envoye a'} ${pendingPhoneE164}`}
              actionLabel={t('verify') || 'Verifier'}
              isLoading={isLoading}
              onVerify={verifyOtpAndLogin}
              onResend={handleResendOtp}
              resendSecondsLeft={resendSecondsLeft}
              resendLabel={t('resendCode') || 'Renvoyer code'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
