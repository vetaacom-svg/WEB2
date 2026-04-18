import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, Lock } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { supabase } from '../lib/supabase-client';

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
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
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

  const safeSetLoading = (v: boolean) => {
    if (mountedRef.current) setIsLoading(v);
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(t('invalidEmail'));
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
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      signInPromise.catch(() => {
        /* évite unhandledrejection si le timeout gagne la course */
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), SIGN_IN_TIMEOUT_MS);
      });
      const { data, error: signInError } = await Promise.race([signInPromise, timeoutPromise]);

      if (signInError) {
        setError(signInError.message);
        return;
      }
      if (data?.user) {
        const afterSignIn = Promise.resolve(onLogin(email, data.user));
        const loginTimeout = new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('LOGIN_CALLBACK_TIMEOUT')), AFTER_SIGN_IN_TIMEOUT_MS);
        });
        await Promise.race([afterSignIn, loginTimeout]);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'LOGIN_TIMEOUT') {
        setError(t('loginTimeout'));
      } else if (err instanceof Error && err.message === 'LOGIN_CALLBACK_TIMEOUT') {
        setError(
          language === 'fr'
            ? "Connexion lente : le profil n'a pas répondu à temps. Actualisez la page puis reessayez."
            : t('loginTimeout')
        );
      } else {
        setError(err instanceof Error ? err.message : t('loginUnexpectedError'));
      }
    } finally {
      window.clearTimeout(failsafeId);
      safeSetLoading(false);
    }
  };

  return (
    <div className="veetaa-login-page">
      <div className="veetaa-login-card">
        <div className="veetaa-login-header">
          <h2 className="veetaa-login-title">{t('welcomeBack')}</h2>
          <p className="veetaa-login-subtitle">{t('enterEmailToContinue')}</p>
        </div>

        <form onSubmit={validateAndSubmit} className="veetaa-login-form">
          <div className="veetaa-field">
            <label className="veetaa-label">{t('email')}</label>
            <div className="veetaa-input-wrap">
              <Mail className="veetaa-input-icon" aria-hidden />
              <input
                type="email"
                placeholder="exemple@email.com"
                className="veetaa-input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
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
                autoFocus={!!email}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                minLength={6}
              />
            </div>
            {error && <p className="veetaa-error">{error}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="veetaa-btn-primary">
            {isLoading ? t('loading') : t('login')}
            <ArrowRight className="veetaa-btn-icon" aria-hidden />
          </button>
        </form>

        <div className="veetaa-login-links">
          <p className="veetaa-login-link-p">
            {t('noAccount')}{' '}
            <button type="button" onClick={onGoToSignup} className="veetaa-link">
              {t('signup')}
            </button>
          </p>
          {onForgotPassword && (
            <p className="veetaa-login-link-p">
              <button
                type="button"
                onClick={() => {
                  if (email && email.includes('@')) onForgotPassword(email);
                  else setError(t('invalidEmail'));
                }}
                className="veetaa-link"
              >
                {t('forgotPassword')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
