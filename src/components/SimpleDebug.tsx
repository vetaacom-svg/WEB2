import React, { useState, useEffect } from 'react';

const SimpleDebug: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const addLog = (message: string) => {
      setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    addLog('Component mounted');
    
    // Test si window est disponible
    if (typeof window !== 'undefined') {
      addLog('Window available');
    } else {
      addLog('Window NOT available');
    }

    // Test si React rend
    addLog('React rendering OK');

    // Test des variables d'environnement
    if (import.meta.env.VITE_SUPABASE_URL) {
      addLog('Supabase URL: ' + import.meta.env.VITE_SUPABASE_URL.substring(0, 20) + '...');
    } else {
      addLog('Supabase URL MISSING');
    }

  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 10, left: 10, zIndex: 9999, background: 'rgba(0,0,0,0.8)', color: 'lime', padding: 10, fontSize: 12, fontFamily: 'monospace' }}>
      <strong>Debug:</strong>
      {logs.map((log, i) => <div key={i}>{log}</div>)}
    </div>
  );
};

export default SimpleDebug;
