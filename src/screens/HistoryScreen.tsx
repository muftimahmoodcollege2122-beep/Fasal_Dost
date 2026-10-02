// ─────────────────────────────────────────────────────────────────────────────
// src/screens/HistoryScreen.tsx
// Displays previous crop disease scans saved on the device (Professional White)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  History,
  Trash2,
  AlertTriangle,
  Sprout,
  Leaf,
  CheckCircle2,
  Bug,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Language, t } from '../utils/i18n';
import { getHistory, clearHistory, deleteHistoryItem, HistoryItem } from '../utils/store';

interface HistoryScreenProps {
  lang: Language;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  lang,
  onNavigate,
  onBack,
}) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await getHistory();
      setItems(list);
      setLoading(false);
    })();
  }, []);

  const openItem = (item: HistoryItem) => {
    onNavigate('Result', {
      result: item.result || {},
      cropName: item.cropName || '',
      fromHistory: true,
    });
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await deleteHistoryItem(id);
    if (ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleClearAll = async () => {
    await clearHistory();
    setItems([]);
    setClearConfirmOpen(false);
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso.split('T')[0] || '';
    }
  };

  const severityColor = (sev?: string) => {
    const s = sev?.toLowerCase();
    if (s === 'high') return '#DC2626';
    if (s === 'medium') return '#D97706';
    return '#16A34A';
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <div className="flex items-center justify-between py-2 mb-3 border-b border-slate-100 pb-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
          <History className="w-4 h-4 text-slate-800" />
          <span>{t('history', lang)}</span>
        </h2>

        {items.length > 0 ? (
          <button
            onClick={() => setClearConfirmOpen(true)}
            title="Clear All History"
            className="w-10 h-10 rounded-full border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-700 hover:bg-rose-100 transition active:scale-95 shadow-2xs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xs w-full p-5 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">
              {t('clearConfirm', lang)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                {t('yes', lang)}
              </button>
              <button
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                {t('cancel', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-slate-400">
          <svg
            className="animate-spin h-7 w-7"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-2 text-slate-400">
            <Sprout className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t('noHistory', lang)}</h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            {t('noHistoryDesc', lang)}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const diseases = Array.isArray(item.result?.diseases) ? item.result.diseases : [];
            const firstDisease = diseases[0];
            const isHealthy = item.result?.is_healthy;

            return (
              <div
                key={item.id}
                onClick={() => openItem(item)}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 transition cursor-pointer shadow-2xs"
              >
                {/* Thumbnail */}
                {item.imageUri ? (
                  <img
                    src={item.imageUri}
                    alt="Thumbnail"
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Leaf className="w-6 h-6" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate mb-0.5 inline-flex items-center gap-1.5 w-full">
                    {isHealthy ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <span className="truncate">{t('healthy', lang)}</span>
                      </>
                    ) : firstDisease ? (
                      <>
                        <Bug className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <span className="truncate">
                          {firstDisease.disease_name_en}
                        </span>
                      </>
                    ) : (
                      <>
                        <Leaf className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <span className="truncate">{t('diagnosis', lang)}</span>
                      </>
                    )}
                  </h4>

                  {!isHealthy && firstDisease?.severity && (
                    <span
                      style={{ color: severityColor(firstDisease.severity) }}
                      className="text-xs font-semibold block"
                    >
                      ● {t(firstDisease.severity, lang)}
                    </span>
                  )}

                  {diseases.length > 1 && (
                    <span className="text-[11px] text-slate-600 font-medium block">
                      +{diseases.length - 1} {t('multipleDetected', lang)}
                    </span>
                  )}

                  {item.cropName && (
                    <span className="text-xs text-slate-600 flex items-center gap-1 truncate mt-0.5">
                      <Sprout className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.cropName}</span>
                    </span>
                  )}

                  <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{formatDate(item.date)}</span>
                  </span>
                </div>

                {/* Delete button + arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    title="Delete Scan"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="text-slate-300">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
