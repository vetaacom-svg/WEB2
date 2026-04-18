import React, { useState } from 'react';
import { User, Phone, Mail, ArrowRight, Lock } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { supabase, getEmailRedirectUrl } from '../lib/supabase-client';
import { Db } from '../data/tables';

interface SignupProps {
  language: Language;
  onSignup: (name: string, email: string, password: string, phone?: string) => void;
  onGoToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ language, onSignup, onGoToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError(t('enterFullName'));
      return;
    }
    if (!email || !email.includes('@')) {
      setError(t('invalidEmail'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    let phoneE164 = '';
    if (phone) {
      const cleanPhone = phone.replace(/\s/g, '');
      if (cleanPhone.length !== 9) {
        setError(t('phoneError9Digits'));
        return;
      }
      phoneE164 = `+212${cleanPhone}`;
    }
    setIsLoading(true);
    setError('');
    try {
      const { data: existingUser } = await supabase.from(Db.profiles).select('email').eq('email', email).single();
      if (existingUser) {
        setIsLoading(false);
        setError(t('emailAlreadyExists'));
        return;
      }
    } catch (emailCheckError: unknown) {
      const err = emailCheckError as { code?: string };
      if (err.code !== 'PGRST116') console.error('Error checking email:', emailCheckError);
    }
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getEmailRedirectUrl(),
          data: { full_name: name, phone: phoneE164 || null },
        },
      });
      setIsLoading(false);
      if (signupError) {
        setError(signupError.message);
        return;
      }
      if (data?.user) onSignup(name, email, password, phoneE164);
    } catch {
      setIsLoading(false);
      setError('Erreur lors de la création du compte.');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 9));
    setError('');
  };

  return (
    <div className="veetaa-login-page">
      <div className="veetaa-login-card">
        <div className="veetaa-login-header">
          <h2 className="veetaa-login-title">{t('welcomeSignup')}</h2>
          <p className="veetaa-login-subtitle">{t('createAccount')}</p>
        </div>

        <form onSubmit={validateAndSubmit} className="veetaa-login-form">
          <div className="veetaa-field">
            <label className="veetaa-label">{t('fullName')}</label>
            <div className="veetaa-input-wrap">
              <User className="veetaa-input-icon" aria-hidden />
              <input
                type="text"
                placeholder={t('fullNamePlaceholder')}
                className="veetaa-input"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                required
              />
            </div>
          </div>

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
            <label className="veetaa-label">{t('phone')} ({t('optional')})</label>
            <div className="veetaa-signup-phone-row">
              <div className="veetaa-signup-phone-prefix">+212</div>
              <div className="veetaa-input-wrap">
                <Phone className="veetaa-input-icon" aria-hidden />
                <input
                  type="tel"
                  placeholder="6XX XXX XXX"
                  className="veetaa-input"
                  value={phone}
                  onChange={handlePhoneChange}
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
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                minLength={6}
              />
            </div>
            {error && <p className="veetaa-error">{error}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="veetaa-btn-primary">
            {isLoading ? t('loading') : t('createMyAccount')}
            <ArrowRight className="veetaa-btn-icon" aria-hidden />
          </button>
        </form>

        <div className="veetaa-login-links">
          <p className="veetaa-login-link-p">
            {t('alreadyHaveAccount')}{' '}
            <button type="button" onClick={onGoToLogin} className="veetaa-link">
              {t('login')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
