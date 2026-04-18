// Préférez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env (non versionné) ;
// les valeurs ci-dessous restent le repli si les variables ne sont pas définies.

const DEFAULT_URL = 'https://lubeapgnjpvlxidxfnhb.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1YmVhcGduanB2bHhpZHhmbmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDAzMjAsImV4cCI6MjA4NTgxNjMyMH0.A6kV2LrklpeAmqoPLLI7zjhGuDlyK5WZ2_MIN8sMJ_M';

/**
 * URL utilisée par @supabase/supabase-js (REST, auth, storage, realtime, functions).
 *
 * Dev : par défaut **proxy Vite** (`window.location.origin` → `/rest/v1` …) pour éviter blocages / timeouts
 * vers `*.supabase.co` (Brave, DNS, réseau). Désactiver : `VITE_SUPABASE_DEV_PROXY=false`.
 * Même machine, deux liens ≠ même origine : `http://localhost:3001` et `http://192.168.x.x:3001` (ou `127.0.0.1`)
 * ont des règles Brave / navigateur différentes ; si `localhost` échoue, utiliser `127.0.0.1` ou l’IP LAN qui marche.
 * Prod : `VITE_SUPABASE_SAME_ORIGIN=true` + rewrites (vercel.json) sur le domaine déployé.
 *
 * Forcer l’URL directe partout : `VITE_SUPABASE_ALWAYS_DIRECT=true`
 */
function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  );
}

export function getSupabaseApiUrl(): string {
  const fromEnv = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const direct = (fromEnv || DEFAULT_URL).trim();

  if (typeof window === 'undefined') return direct;
  if (import.meta.env.VITE_SUPABASE_ALWAYS_DIRECT === 'true') return direct;

  if (import.meta.env.DEV) {
    if (import.meta.env.VITE_SUPABASE_DEV_PROXY === 'false') return direct;
    return window.location.origin;
  }

  if (import.meta.env.VITE_SUPABASE_SAME_ORIGIN === 'true') {
    const host = window.location.hostname;
    const port = window.location.port;
    // `vite preview` (ports par défaut) : proxy actif → garder même origine.
    const vitePreview = port === '4173' || port === '4174';
    if (isLocalHostname(host)) {
      if (vitePreview) return window.location.origin;
      // Autre serveur local (ex. `serve dist`) : /rest/v1 tombe sur index.html → timeouts.
      return direct;
    }
    return window.location.origin;
  }

  return direct;
}

/**
 * URL Supabase directe (HTTPS) sans logique de proxy/same-origin.
 * À utiliser quand on veut bypass total du proxy Vite.
 */
export function getSupabaseDirectUrl(): string {
  const fromEnv = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  return (fromEnv || DEFAULT_URL).trim();
}

const SUPABASE_CONFIG = {
  get URL() {
    return getSupabaseApiUrl();
  },
  ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY).trim(),
  
  // Configuration de timeout pour éviter les requêtes bloquées
  TIMEOUT: 10000,
  
  // Options de retry pour les requêtes échouées
  RETRY_OPTIONS: {
    maxAttempts: 3,
    delay: 1000
  }
};

// Validation de la configuration
const validateConfig = () => {
  const errors = [];
  
  if (!SUPABASE_CONFIG.URL || !/^https?:\/\//.test(SUPABASE_CONFIG.URL)) {
    errors.push('URL Supabase invalide');
  }
  
  if (!SUPABASE_CONFIG.ANON_KEY || SUPABASE_CONFIG.ANON_KEY.length < 100) {
    errors.push('Clé ANON Supabase invalide ou trop courte');
  }
  
  return errors;
};

export { SUPABASE_CONFIG, validateConfig };
