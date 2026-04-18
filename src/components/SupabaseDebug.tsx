import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { Db } from '../data/tables';

const SupabaseDebug: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Test de connexion...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 Test de connexion Supabase...');
        const { data, error } = await supabase.from(Db.categories).select('count').single();
        
        if (error) {
          console.error('❌ Erreur Supabase:', error);
          setStatus('error');
          setMessage(`Erreur: ${error.message}`);
        } else {
          console.log('✅ Connexion réussie:', data);
          setStatus('success');
          setMessage(`Connecté! Categories: ${data?.count || 0}`);
        }
      } catch (err) {
        console.error('❌ Exception:', err);
        setStatus('error');
        setMessage(`Exception: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    };

    testConnection();
  }, []);

  const colors = {
    loading: 'bg-yellow-500',
    success: 'bg-green-500',
    error: 'bg-red-500'
  };

  return (
    <div className="fixed top-4 right-4 p-4 rounded-lg shadow-lg bg-white border-2 border-gray-200 z-50 max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${colors[status]}`} />
        <span className="font-bold text-sm">Supabase Status</span>
      </div>
      <p className="text-xs text-gray-600">{message}</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
      >
        Reload
      </button>
    </div>
  );
};

export default SupabaseDebug;
