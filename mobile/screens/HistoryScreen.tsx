// ─────────────────────────────────────────────────────────────────────────────
// src/screens/HistoryScreen.tsx
// Displays previous crop disease scans saved on the device (Professional White)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Box, Btn, Img, T } from '../ui/web';
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
  Loader2,
} from '../ui/icons';
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
    <Box className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <Box className="flex items-center justify-between py-2 mb-3 border-b border-slate-100 pb-3">
        <Btn
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Btn>

        <T className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
          <History className="w-4 h-4 text-slate-800" />
          <T>{t('history', lang)}</T>
        </T>

        {items.length > 0 ? (
          <Btn
            onClick={() => setClearConfirmOpen(true)}
            title="Clear All History"
            className="w-10 h-10 rounded-full border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-700 hover:bg-rose-100 transition active:scale-95 shadow-2xs"
          >
            <Trash2 className="w-4 h-4" />
          </Btn>
        ) : (
          <Box className="w-10" />
        )}
      </Box>

      {/* Clear Confirmation Modal */}
      {clearConfirmOpen && (
        <Box className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Box className="bg-white border border-slate-200 rounded-2xl max-w-xs w-full p-5 text-center space-y-4 shadow-xl">
            <Box className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </Box>
            <T className="text-sm font-bold text-slate-900">
              {t('clearConfirm', lang)}
            </T>
            <Box className="flex gap-2">
              <Btn
                onClick={handleClearAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                {t('yes', lang)}
              </Btn>
              <Btn
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                {t('cancel', lang)}
              </Btn>
            </Box>
          </Box>
        </Box>
      )}

      {/* List content */}
      {loading ? (
        <Box className="flex-1 flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin h-7 w-7" />
        </Box>
      ) : items.length === 0 ? (
        <Box className="flex flex-col items-center justify-center text-center py-20 px-4 space-y-2">
          <Box className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-2 text-slate-400">
            <Sprout className="w-8 h-8" />
          </Box>
          <T className="text-base font-bold text-slate-800">{t('noHistory', lang)}</T>
          <T className="text-xs text-slate-500 max-w-xs leading-relaxed">
            {t('noHistoryDesc', lang)}
          </T>
        </Box>
      ) : (
        <Box className="space-y-3">
          {items.map((item) => {
            const diseases = Array.isArray(item.result?.diseases) ? item.result.diseases : [];
            const firstDisease = diseases[0];
            const isHealthy = item.result?.is_healthy;

            return (
              <Box
                key={item.id}
                onClick={() => openItem(item)}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 transition cursor-pointer shadow-2xs"
              >
                {/* Thumbnail */}
                {item.imageUri ? (
                  <Img
                    src={item.imageUri}
                    alt="Thumbnail"
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                  />
                ) : (
                  <Box className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Leaf className="w-6 h-6" />
                  </Box>
                )}

                {/* Info */}
                <Box className="flex-1 min-w-0">
                  <T className="text-sm font-bold text-slate-900 truncate mb-0.5 inline-flex items-center gap-1.5 w-full">
                    {isHealthy ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <T className="truncate">{t('healthy', lang)}</T>
                      </>
                    ) : firstDisease ? (
                      <>
                        <Bug className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <T className="truncate">
                          {firstDisease.disease_name_en}
                        </T>
                      </>
                    ) : (
                      <>
                        <Leaf className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <T className="truncate">{t('diagnosis', lang)}</T>
                      </>
                    )}
                  </T>

                  {!isHealthy && firstDisease?.severity && (
                    <T
                      style={{ color: severityColor(firstDisease.severity) }}
                      className="text-xs font-semibold block"
                    >
                      ● {t(firstDisease.severity, lang)}
                    </T>
                  )}

                  {diseases.length > 1 && (
                    <T className="text-[11px] text-slate-600 font-medium block">
                      +{diseases.length - 1} {t('multipleDetected', lang)}
                    </T>
                  )}

                  {item.cropName && (
                    <T className="text-xs text-slate-600 flex items-center gap-1 truncate mt-0.5">
                      <Sprout className="w-3 h-3 text-slate-400 shrink-0" />
                      <T className="truncate">{item.cropName}</T>
                    </T>
                  )}

                  <T className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <T>{formatDate(item.date)}</T>
                  </T>
                </Box>

                {/* Delete button + arrow */}
                <Box className="flex items-center gap-2 shrink-0">
                  <Btn
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    title="Delete Scan"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Btn>
                  <Box className="text-slate-300">
                    <ChevronRight className="w-4 h-4" />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
