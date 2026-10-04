import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { UPDATE_EVENT, applyUpdate } from '../utils/pwa';

/** Slim banner shown when a newer web build has been deployed. */
export const UpdateToast: React.FC = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const on = () => setReady(true);
    window.addEventListener(UPDATE_EVENT, on);
    return () => window.removeEventListener(UPDATE_EVENT, on);
  }, []);

  if (!ready) return null;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-sm">
      <div className="flex items-center gap-3 bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-xl">
        <RefreshCw className="w-4 h-4 shrink-0" />
        <p className="flex-1 text-xs font-bold">A new version of Fasal Dost is ready.</p>
        <button
          onClick={applyUpdate}
          className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-extrabold active:scale-95"
        >
          Update
        </button>
      </div>
    </div>
  );
};
