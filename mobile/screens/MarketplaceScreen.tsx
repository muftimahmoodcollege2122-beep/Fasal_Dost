// ─────────────────────────────────────────────────────────────────────────────
// src/screens/MarketplaceScreen.tsx
// Marketplace produce feed (3 listings per row, dynamic database fetching)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Box, Btn, Img, T } from '../ui/web';
import {
  ArrowLeft,
  Store,
  Plus,
  MapPin,
  RefreshCw,
  Video,
  Camera,
  Layers,
  Banknote,
  CheckCircle2,
} from '../ui/icons';
import { Language } from '../utils/i18n';
import {
  getListings,
  ProduceListing,
  isProfileComplete,
  isSellerVerified,
} from '../utils/store';

interface MarketplaceScreenProps {
  lang: Language;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({
  lang: _lang,
  onNavigate,
  onBack,
}) => {
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getListings();
      setListings(data);
    } catch (err) {
      console.error('Failed to load marketplace listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClick = async () => {
    const verified = await isSellerVerified();
    if (!verified) {
      onNavigate('SellerVerification');
      return;
    }
    onNavigate('CreateListing');
  };

  return (
    <Box className="flex flex-col min-h-full pb-10">
      {/* Top Header */}
      <Box className="flex items-center justify-between py-2 mb-3 border-b border-slate-100 pb-3">
        <Btn
          onClick={onBack}
          title="Back"
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Btn>

        <Box className="text-center">
          <T className="text-base font-extrabold text-slate-900 inline-flex items-center gap-1.5">
            <Store className="w-4 h-4 text-slate-800" />
            <T>Marketplace</T>
          </T>
          <T className="text-[10px] text-slate-400 font-medium">
            Live Farmers Produce Exchange
          </T>
        </Box>

        {/* Post Listing Button */}
        <Btn
          onClick={handleCreateClick}
          className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <T>Post</T>
        </Btn>
      </Box>

      {/* Main Content Area */}
      {loading ? (
        <Box className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin mb-2" />
          <T className="text-xs font-semibold">Loading marketplace listings...</T>
        </Box>
      ) : listings.length === 0 ? (
        /* Dynamic Empty State - No Hardcoded Data */
        <Box className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4 space-y-3">
          <Box className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
            <Store className="w-8 h-8" />
          </Box>
          <T className="text-base font-bold text-slate-800">
            No Produce Listed Yet
          </T>
          <T className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Be the first farmer to list freshly harvested crops with multiple photos and videos for buyers nationwide.
          </T>
          <Btn
            onClick={handleCreateClick}
            className="mt-2 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition active:scale-95 shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <T>Create First Listing</T>
          </Btn>
        </Box>
      ) : (
        /* 3 Listings Per Row Grid */
        <Box>
          <Box className="flex items-center justify-between mb-2.5 px-0.5">
            <T className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {listings.length} Active {listings.length === 1 ? 'Listing' : 'Listings'}
            </T>
            <Btn
              onClick={loadData}
              title="Refresh listings"
              className="text-[10px] text-slate-400 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <T>Refresh</T>
            </Btn>
          </Box>

          <Box className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {listings.map((item) => {
              const isSold = item.status === 'sold';
              const coverImage = item.images?.[0] || item.imageBase64;
              const imageCount = item.images?.length || (item.imageBase64 ? 1 : 0);
              const videoCount = item.videos?.length || 0;

              return (
                <Box
                  key={item.id}
                  onClick={() =>
                    onNavigate('ListingDetail', { listing: item, isOwner: false })
                  }
                  className={`flex flex-col rounded-xl border transition cursor-pointer overflow-hidden shadow-2xs group ${
                    isSold
                      ? 'border-slate-200 bg-slate-50 opacity-70'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Media Thumbnail Container */}
                  <Box className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                    {coverImage ? (
                      <Img
                        src={coverImage}
                        alt={item.cropName}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <Box className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Store className="w-6 h-6" />
                      </Box>
                    )}

                    {/* Media Badges */}
                    <Box className="absolute top-1 left-1 flex flex-col gap-0.5">
                      {imageCount > 1 && (
                        <T className="px-1 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[8px] font-bold text-white flex items-center gap-0.5 leading-none">
                          <Camera className="w-2.5 h-2.5" />
                          <T>{imageCount}</T>
                        </T>
                      )}
                      {videoCount > 0 && (
                        <T className="px-1 py-0.5 rounded bg-rose-600/90 backdrop-blur-xs text-[8px] font-bold text-white flex items-center gap-0.5 leading-none">
                          <Video className="w-2.5 h-2.5" />
                          <T>{videoCount}</T>
                        </T>
                      )}
                    </Box>

                    {isSold && (
                      <Box className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-[9px] text-white font-extrabold tracking-wider">
                        SOLD
                      </Box>
                    )}
                  </Box>

                  {/* Card Content - Compact 3-Column Mobile Layout */}
                  <Box className="p-1.5 flex flex-col flex-1 justify-between">
                    <Box>
                      <Box className="flex items-center gap-1">
                        <T className="text-[11px] font-extrabold text-slate-900 truncate leading-tight flex-1">
                          {item.cropName}
                        </T>
                        {(item.sellerVerified !== false) && (
                          <CheckCircle2 className="w-3 h-3 text-slate-900 shrink-0" />
                        )}
                      </Box>
                      {item.variety && (
                        <T className="text-[9px] text-slate-400 truncate leading-tight">
                          {item.variety}
                        </T>
                      )}
                    </Box>

                    <Box className="mt-1 pt-1 border-t border-slate-100">
                      <Box className="text-[11px] font-black text-slate-900 leading-tight">
                        Rs {item.price}
                        <T className="text-[9px] font-normal text-slate-400 block sm:inline">
                          /{item.unit}
                        </T>
                      </Box>

                      <Box className="text-[9px] text-slate-500 font-semibold truncate mt-0.5">
                        {item.quantity} {item.unit}
                      </Box>

                      <Box className="flex items-center gap-0.5 text-[8.5px] text-slate-400 truncate mt-0.5">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <T className="truncate">{item.district || item.province}</T>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};
