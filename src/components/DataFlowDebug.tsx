import React, { useState, useEffect } from 'react';
import { useCatalog } from '../context/CatalogContext';
import { SUPABASE_CONFIG } from '../config/supabase-config';

const DataFlowDebug: React.FC = () => {
  const { categoriesData, storesData, loadingCatalog } = useCatalog();
  const [rawData, setRawData] = useState<any>({});

  useEffect(() => {
    const checkRawData = async () => {
      try {
        // Test direct avec Supabase
        const url = `${SUPABASE_CONFIG.URL.replace(/\/$/, '')}/rest/v1/categories?select=*`;
        const key = SUPABASE_CONFIG.ANON_KEY;
        const response = await fetch(url, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        });
        
        const data = await response.json();
        setRawData({
          success: response.ok,
          data: data,
          status: response.status,
          statusText: response.statusText
        });
      } catch (err) {
        setRawData({
          success: false,
          error: err instanceof Error ? err.message : 'Network error'
        });
      }
    };

    checkRawData();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 p-4 rounded-lg shadow-lg bg-white border-2 border-gray-200 z-50 max-w-md">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-bold text-sm">🔍 Data Flow Analysis</span>
      </div>
      
      <div className="space-y-3 text-xs">
        {/* Context Data */}
        <div className="p-2 bg-blue-50 rounded">
          <div className="font-bold text-blue-800 mb-1">📊 Context Data:</div>
          <div className="text-blue-700 space-y-1">
            <div>Loading: {loadingCatalog ? '🔄 Yes' : '✅ No'}</div>
            <div>Categories: {categoriesData.length} items</div>
            <div>Stores: {storesData.length} items</div>
            <div className="text-xs bg-blue-100 p-1 rounded mt-1">
              Categories: {JSON.stringify(categoriesData.slice(0, 2))}
            </div>
          </div>
        </div>

        {/* Raw API Data */}
        <div className="p-2 bg-green-50 rounded">
          <div className="font-bold text-green-800 mb-1">🌐 Raw API Data:</div>
          <div className="text-green-700">
            <div>Success: {rawData.success ? '✅' : '❌'}</div>
            <div>Status: {rawData.status}</div>
            {rawData.success ? (
              <div className="text-xs bg-green-100 p-1 rounded mt-1">
                Data: {JSON.stringify(rawData.data).slice(0, 100)}...
              </div>
            ) : (
              <div className="text-red-600">Error: {rawData.error}</div>
            )}
          </div>
        </div>

        {/* Structure Analysis */}
        <div className="p-2 bg-yellow-50 rounded">
          <div className="font-bold text-yellow-800 mb-1">🏗️ Structure Issues:</div>
          <div className="text-yellow-700 space-y-1">
            {categoriesData.length === 0 && (
              <div>❌ No categories in context</div>
            )}
            {storesData.length === 0 && (
              <div>❌ No stores in context</div>
            )}
            {loadingCatalog && (
              <div>🔄 Still loading...</div>
            )}
            {!loadingCatalog && categoriesData.length === 0 && storesData.length === 0 && (
              <div className="font-bold text-red-600">
                🚨 CRITICAL: No data loaded!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataFlowDebug;
