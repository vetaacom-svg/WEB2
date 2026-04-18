import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getEmailRedirectUrl } from '../lib/supabase-client';
import { profileByIdQuery, updateProfileRow } from '../data/repos/profilesRepo';
import { UserProfile, Language } from '../types';
import { safeRemoveItem, safeSetItem } from '../lib/storage';

/** Erreurs PostgREST / GoTrue où garder un vieux token bloque toutes les requêtes jusqu’à « effacer les cookies ». */
function looksLikeInvalidAuthSession(err: { message?: string; code?: string; status?: number }): boolean {
  const m = (err.message || '').toLowerCase();
  const code = String(err.code || '');
  if (code === 'PGRST301') return true;
  if (m.includes('invalid refresh token')) return true;
  if (m.includes('refresh token not found')) return true;
  if (m.includes('jwt expired')) return true;
  if (m.includes('invalid jwt')) return true;
  if (err.status === 401 && (m.includes('jwt') || m.includes('bearer'))) return true;
  return false;
}

/** Vide la session Supabase en local (clé `veetaa-auth-token` + profil cache) sans appel réseau obligatoire. */
async function clearStaleSupabaseSession(reason: string) {
  if (import.meta.env.DEV) {
    console.warn(`[auth] ${reason} — nettoyage session locale (stockage type « cookies / données du site »).`);
  }
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    safeRemoveItem('veetaa-auth-token');
  }
  safeRemoveItem('veetaa_user');
}

function looksLikeTransientNetworkError(err: { message?: string; code?: string; status?: number }): boolean {
  const m = String(err.message || '').toLowerCase();
  const code = String(err.code || '').toUpperCase();
  if (err.status === 408 || err.status === 429 || (typeof err.status === 'number' && err.status >= 500)) return true;
  if (code === 'ECONNRESET' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') return true;
  return (
    m.includes('timeout') ||
    m.includes('failed to fetch') ||
    m.includes('network') ||
    m.includes('fetch')
  );
}

function isSecurityDeniedError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'SecurityError') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.toLowerCase().includes('securityerror') || msg.toLowerCase().includes('request was denied');
}

async function withRetries<T>(run: () => Promise<T>, retries = 2, delaysMs: number[] = [400, 1000]): Promise<T> {
  let lastError: unknown = null;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await run();
    } catch (e) {
      lastError = e;
      if (i >= retries) break;
      const d = delaysMs[i] ?? 600;
      await new Promise((resolve) => setTimeout(resolve, d));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unknown network error');
}

export interface AuthContextValue {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  isBlocked: boolean;
  setIsBlocked: (b: boolean) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  pendingEmail: string;
  setPendingEmail: (e: string) => void;
  pendingPhone: string;
  setPendingPhone: (p: string) => void;
  pendingName: string;
  setPendingName: (n: string) => void;
  pendingPassword: string;
  setPendingPassword: (p: string) => void;
  pendingOtpPurpose: 'email_verify' | 'password_reset';
  setPendingOtpPurpose: (p: 'email_verify' | 'password_reset') => void;
  handleLogout: () => Promise<void>;
  handleLoginSuccess: (email: string, authUser?: any) => Promise<void>;
  handleForgotPassword: (email: string) => Promise<void>;
  handleSignupSuccess: (name: string, email: string, password?: string, phone?: string) => void;
  handleEmailOtpVerified: () => void;
  handlePasswordResetSuccess: () => void;
  handleProfileSave: (fullName: string, email: string, phone: string) => Promise<void>;
  handlePermissionsGranted: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [language, setLanguageState] = useState<Language>('fr');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingName, setPendingName] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [pendingOtpPurpose, setPendingOtpPurpose] = useState<'email_verify' | 'password_reset'>('email_verify');
  const navigate = useNavigate();

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const sessionResult = await withRetries<Awaited<ReturnType<typeof supabase.auth.getSession>>>(
          async () => await supabase.auth.getSession(),
          2
        );
        const { data: { session }, error: sessionError } = sessionResult;

        if (sessionError) {
          if (looksLikeTransientNetworkError(sessionError)) {
            return;
          }
          await clearStaleSupabaseSession(`getSession: ${sessionError.message}`);
          setUser(null);
          return;
        }

        if (session?.user) {
          try {
            const { data: profile, error: profileError } = await withRetries(
              async () => await profileByIdQuery(session.user.id).maybeSingle(),
              2
            );

            if (profileError && looksLikeInvalidAuthSession(profileError)) {
              await clearStaleSupabaseSession(`profil: ${profileError.message}`);
              setUser(null);
              return;
            }
            if (profileError && looksLikeTransientNetworkError(profileError)) {
              return;
            }

            const userData: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              fullName: profile?.full_name || session.user.user_metadata?.full_name || '',
              phone: profile?.phone || session.user.user_metadata?.phone || '',
              language: (profile?.language as Language) || 'fr',
              isLoggedIn: true
            };
            setIsBlocked(profile?.is_blocked || false);
            setUser(userData);
            safeSetItem('veetaa_user', JSON.stringify(userData));
            if (userData.language) setLanguageState(userData.language);
          } catch (e) {
            if (isSecurityDeniedError(e)) {
              setUser(null);
              return;
            }
            console.error('Profile recovery failed:', e);
          }
        } else {
          // No session found - clear local cache for security
          setUser(null);
          safeRemoveItem('veetaa_user');
        }
      } catch (e) {
        if (isSecurityDeniedError(e)) {
          setUser(null);
          return;
        }
        setUser(null);
        console.error('Session restore failed:', e);
      }
    };

    void restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          safeRemoveItem('veetaa_user');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            const { data: profile, error: profileError } = await withRetries(
              async () => await profileByIdQuery(session.user.id).maybeSingle(),
              2
            );

            if (profileError && looksLikeInvalidAuthSession(profileError)) {
              await clearStaleSupabaseSession(`onAuthStateChange: ${profileError.message}`);
              setUser(null);
              return;
            }
            if (profileError && looksLikeTransientNetworkError(profileError)) {
              return;
            }

            if (profile) {
              const userData: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                fullName: profile.full_name || session.user.user_metadata?.full_name || '',
                phone: profile.phone || session.user.user_metadata?.phone || '',
                language: (profile.language as Language) || 'fr',
                isLoggedIn: true
              };
              setUser(userData);
              safeSetItem('veetaa_user', JSON.stringify(userData));
            }
          }
        }
      } catch (e) {
        if (isSecurityDeniedError(e)) {
          setUser(null);
          return;
        }
        console.error('Auth state sync failed:', e);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsBlocked(false);
    safeRemoveItem('veetaa_user');
    safeRemoveItem('veetaa-auth-token');
    navigate('/');
  }, [navigate]);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    if (user) {
      const updated = { ...user, language: l };
      setUser(updated);
      safeSetItem('veetaa_user', JSON.stringify(updated));
    }
  }, [user]);

  const handleLoginSuccess = useCallback(async (email: string, authUser?: any) => {
    const userToUse =
      authUser ||
      (
        await Promise.race([
          supabase.auth.getUser().then((r) => r.data?.user ?? null),
          new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 12_000)),
        ])
      );

    if (userToUse) {
      const profileQuery = profileByIdQuery(userToUse.id).maybeSingle();
      const { data: profile } = await Promise.race([
        profileQuery,
        new Promise<{ data: null }>((resolve) => window.setTimeout(() => resolve({ data: null }), 14_000)),
      ]);
      const userData: UserProfile = {
        id: userToUse.id,
        email: email,
        fullName: profile?.full_name || userToUse.user_metadata?.full_name || '',
        phone: profile?.phone || userToUse.user_metadata?.phone || '',
        language: (profile?.language as Language) || 'fr',
        isLoggedIn: true
      };
      setIsBlocked(profile?.is_blocked || false);
      setUser(userData);
      safeSetItem('veetaa_user', JSON.stringify(userData));
      safeSetItem('veetaa_last_email', email);
      if (userData.language) setLanguageState(userData.language);
    }
  }, []);

  const handleForgotPassword = useCallback(async (email: string) => {
    setPendingEmail(email);
    setPendingOtpPurpose('password_reset');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getEmailRedirectUrl(),
    });
    if (error) throw new Error(error.message);
    navigate('/email-otp-verify');
  }, [navigate]);

  const handleSignupSuccess = useCallback((name: string, email: string) => {
    setPendingEmail(email);
    setPendingName(name);
    setPendingOtpPurpose('email_verify');
    navigate('/email-otp-verify');
  }, [navigate]);

  const handleEmailOtpVerified = useCallback(() => {
    if (pendingOtpPurpose === 'email_verify') navigate('/permissions');
    else navigate('/password-reset');
  }, [pendingOtpPurpose, navigate]);

  const handlePasswordResetSuccess = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleProfileSave = useCallback(async (fullName: string, email: string, phone: string) => {
    if (!user?.id) return;
    const updates: Record<string, unknown> = {
      full_name: fullName,
      phone,
      updated_at: new Date().toISOString(),
    };
    if (email) updates.email = email;
    const { error } = await updateProfileRow(user.id, updates);
    if (error) throw new Error(error.message);
    const newUser = {
      ...user,
      fullName,
      email: email || user.email || '',
      phone,
    };
    setUser(newUser);
    safeSetItem('veetaa_user', JSON.stringify(newUser));
  }, [user]);

  const handlePermissionsGranted = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  const value = useMemo(() => ({
    user,
    setUser,
    isBlocked,
    setIsBlocked,
    language,
    setLanguage,
    pendingEmail,
    setPendingEmail,
    pendingPhone,
    setPendingPhone,
    pendingName,
    setPendingName,
    pendingPassword,
    setPendingPassword,
    pendingOtpPurpose,
    setPendingOtpPurpose,
    handleLogout,
    handleLoginSuccess,
    handleForgotPassword,
    handleSignupSuccess,
    handleEmailOtpVerified,
    handlePasswordResetSuccess,
    handleProfileSave,
    handlePermissionsGranted
  }), [
    user, isBlocked, language, setLanguage, pendingEmail, pendingPhone, pendingName, pendingPassword, pendingOtpPurpose, 
    handleLogout, handleLoginSuccess, handleForgotPassword, handleSignupSuccess, handleEmailOtpVerified, 
    handlePasswordResetSuccess, handleProfileSave, handlePermissionsGranted
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
