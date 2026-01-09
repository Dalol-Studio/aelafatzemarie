'use client';

import { fixInvalidDatesAction } from '@/admin/fix-dates-action';
import { useState } from 'react';

export default function FixDatesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    fixed: number;
    details?: Array<{ id: string; old: string; new: string }>;
  } | null>(null);

  const handleFix = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fixInvalidDatesAction();
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        fixed: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={handleFix}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Fixing dates...' : 'Fix Invalid Dates'}
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded ${result.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
          <h3 className="font-bold mb-2">
            {result.success ? '✅ Success' : '❌ Error'}
          </h3>
          <p className="mb-2">{result.message}</p>
          
          {result.details && result.details.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Fixed Photos:</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.details.map((fix) => (
                  <div key={fix.id} className="text-sm font-mono bg-white dark:bg-black p-2 rounded">
                    <div><strong>ID:</strong> {fix.id}</div>
                    <div><strong>Old:</strong> "{fix.old}"</div>
                    <div><strong>New:</strong> "{fix.new}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
