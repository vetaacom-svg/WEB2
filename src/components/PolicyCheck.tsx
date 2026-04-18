import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { Db } from '../data/tables';

const PolicyCheck: React.FC = () => {
  const [policyInfo, setPolicyInfo] = useState<any[]>([]);

  useEffect(() => {
    const checkPolicies = async () => {
      try {
        // Test avec différentes approches pour comprendre le problème
        const tests = [
          {
            name: 'Test simple SELECT',
            query: () => supabase.from(Db.categories).select('count').single()
          },
          {
            name: 'Test SELECT avec head',
            query: () => supabase.from(Db.categories).select('*', { count: 'exact', head: true })
          },
          {
            name: 'Test SELECT limit 1',
            query: () => supabase.from(Db.categories).select('*').limit(1)
          },
          {
            name: 'Test stores',
            query: () => supabase.from(Db.stores).select('count').single()
          }
        ];

        const results = [];
        
        for (const test of tests) {
          try {
            const result = await test.query();
            results.push({
              name: test.name,
              success: !result.error,
              data: result.data,
              error: result.error?.message,
              code: result.error?.code,
              details: result.error
            });
          } catch (err) {
            results.push({
              name: test.name,
              success: false,
              error: err instanceof Error ? err.message : 'Exception',
              details: err
            });
          }
        }

        setPolicyInfo(results);
      } catch (err) {
        console.error('Policy check failed:', err);
      }
    };

    checkPolicies();
  }, []);

  const getSolution = (code: string, error: string) => {
    if (code === 'PGRST116') return 'Table does not exist or RLS blocks access';
    if (code === '42501') return 'RLS policy exists but denies access';
    if (error?.includes('permission denied')) return 'Insufficient permissions';
    if (error?.includes('no rows')) return 'Policy allows access but no data';
    return 'Unknown issue';
  };

  return (
    <div className="fixed top-32 right-4 p-4 rounded-lg shadow-lg bg-white border-2 border-gray-200 z-50 max-w-md max-h-96 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-bold text-sm">🔍 Policy Analysis</span>
      </div>
      
      <div className="space-y-2">
        {policyInfo.map((result, idx) => (
          <div key={idx} className="p-2 border rounded text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">{result.name}</span>
              <span className={`px-2 py-1 rounded text-white text-xs ${
                result.success ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {result.success ? '✅' : '❌'}
              </span>
            </div>
            
            {result.success ? (
              <div className="text-green-600">
                📊 Success: {JSON.stringify(result.data)}
              </div>
            ) : (
              <div className="text-red-600">
                <div>🚨 {getSolution(result.code, result.error)}</div>
                <div className="text-gray-500 text-xs mt-1">{result.error}</div>
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

      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
        <div className="font-bold text-blue-800 mb-1">🔧 Next Steps:</div>
        <div className="text-blue-700 space-y-1">
          1. Check if tables exist in Supabase<br/>
          2. Verify RLS is enabled<br/>
          3. Drop and recreate policies if needed<br/>
          4. Check table permissions
        </div>
      </div>
    </div>
  );
};

export default PolicyCheck;
