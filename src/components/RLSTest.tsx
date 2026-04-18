import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';

const RLS_Test: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const testTables = async () => {
      const tables = ['categories', 'stores', 'products', 'sub_categories'];
      const testResults = [];

      for (const table of tables) {
        try {
          console.log(`🔍 Test table: ${table}`);
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          testResults.push({
            table,
            success: !error,
            count: count || 0,
            error: error?.message,
            code: error?.code
          });

          if (error) {
            console.error(`❌ ${table}:`, error);
          } else {
            console.log(`✅ ${table}: ${count} rows`);
          }
        } catch (err) {
          testResults.push({
            table,
            success: false,
            error: err instanceof Error ? err.message : 'Exception',
            count: 0
          });
          console.error(`❌ ${table} exception:`, err);
        }
      }

      setResults(testResults);
    };

    testTables();
  }, []);

  const getErrorType = (code: string) => {
    if (code === '42501' || code?.includes('PGRST')) return 'RLS Policy Issue';
    if (code === 'PGRST116') return 'Table Not Found';
    if (code === 'PGRST301') return 'Permission Denied';
    return 'Unknown Error';
  };

  return (
    <div className="fixed top-20 right-4 p-4 rounded-lg shadow-lg bg-white border-2 border-gray-200 z-50 max-w-sm max-h-96 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-bold text-sm">🔍 RLS Test Results</span>
      </div>
      
      <div className="space-y-2">
        {results.map((result, idx) => (
          <div key={idx} className="p-2 border rounded text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">{result.table}</span>
              <span className={`px-2 py-1 rounded text-white text-xs ${
                result.success ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {result.success ? '✅' : '❌'}
              </span>
            </div>
            
            {result.success ? (
              <div className="text-green-600">
                📊 {result.count} rows found
              </div>
            ) : (
              <div className="text-red-600">
                <div>🚨 {getErrorType(result.code)}</div>
                <div className="text-gray-500">{result.error}</div>
                {result.code && (
                  <div className="text-xs bg-gray-100 p-1 rounded mt-1">
                    Code: {result.code}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
        <div className="font-bold text-yellow-800 mb-1">🔧 Solution RLS:</div>
        <div className="text-yellow-700">
          Allez dans Supabase → Authentication → Policies<br/>
          Ajoutez une policy "Allow public read" pour chaque table
        </div>
      </div>
    </div>
  );
};

export default RLS_Test;
