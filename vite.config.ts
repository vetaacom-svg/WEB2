import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const supabaseProxy = (env: Record<string, string>) => {
  const target = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  if (!target) {
    return {} as Record<string, never>;
  }
  return {
    '/rest/v1': { target, changeOrigin: true, secure: true },
    '/auth/v1': { target, changeOrigin: true, secure: true },
    '/storage/v1': { target, changeOrigin: true, secure: true },
    '/realtime/v1': { target, changeOrigin: true, secure: true, ws: true },
    '/functions/v1': { target, changeOrigin: true, secure: true },
  } as const;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const proxy = supabaseProxy(env);

  return {
    server: {
      port: 3001,
      host: '0.0.0.0',
      /** Accès via http://192.168.x.x:3001 (téléphone / LAN) sans « Invalid Host header » */
      allowedHosts: true,
      /** Dev : même origine → Brave n’interdit plus les appels « tiers » vers Supabase */
      proxy,
    },
    /** `vite preview` après build : même proxy que le dev server */
    preview: {
      port: 4173,
      allowedHosts: true,
      proxy,
    },
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    optimizeDeps: {
      include: ['@supabase/supabase-js']
    }
  };
});
