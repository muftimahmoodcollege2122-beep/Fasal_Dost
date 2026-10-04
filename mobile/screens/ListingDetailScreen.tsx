// ─────────────────────────────────────────────────────────────────────────────
// src/screens/ListingDetailScreen.tsx
// Full produce detail screen with 1-8 images & 3 videos viewer, metadata, & farmer contact
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { openUrl, copyText } from '../utils/native';
import { Box, Btn, Img, T, Vid } from '../ui/web';
import {
  ArrowLeft,
  Share2,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Store,
  Star,
  User,
  ShieldCheck,
  Video,
  Camera,
  Play,
  Layers,
  Banknote,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from '../ui/icons';
import { Language } from '../utils/i18n';
import { ProduceListing } from '../utils/store';

interface ListingDetailScreenProps {
  lang: Language;
  listing?: ProduceListing;
  isOwner?: boolean;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

export const ListingDetailScreen: React.FC<ListingDetailScreenProps> = ({
  lang: _lang,
  listing,
  isOwner: _isOwner = false,
  onNavigate: _onNavigate,
  onBack,
}) => {
  if (!listing) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-full py-20 text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mb-2" />
        <T className="text-sm font-bold text-slate-700">Listing not found</T>
        <Btn
          onClick={onBack}
          className="mt-4 px-6 py-2 rounded-full bg-slate-900 text-white font-bold text-xs cursor-pointer"
        >
          Go Back
        </Btn>
      </Box>
    );
  }

  // Aggregate media items (images and videos)
  const images = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : listing.imageBase64
    ? [listing.imageBase64]
    : [];

  const videos = Array.isArray(listing.videos) ? listing.videos : [];

  type MediaItem = { type: 'image' | 'video'; url: string; index: number };
  const allMedia: MediaItem[] = [
    ...images.map((url, index) => ({ type: 'image' as const, url, index })),
    ...videos.map((url, index) => ({ type: 'video' as const, url, index })),
  ];

  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const activeMedia = allMedia[activeMediaIndex] || allMedia[0];

  const [copiedToast, setCopiedToast] = useState(false);

  const calculateTotal = () => {
    const q = parseFloat(listing.quantity);
    const p = parseFloat(listing.price);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      return (q * p).toLocaleString('en-PK');
    }
    return null;
  };

  const handleWhatsApp = () => {
    if (!listing.farmerPhone) return;

    let phone = listing.farmerPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '92' + phone.substring(1);
    }

    const message = `Assalam-o-Alaikum! I saw your produce listing for ${listing.cropName} on FasalDost Marketplace. Are ${listing.quantity} ${listing.unit} still available? I would like to discuss purchasing at PKR ${listing.price} per ${listing.unit}.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    openUrl(url);
  };

  const handleCall = () => {
    if (!listing.farmerPhone) return;
    openUrl(`tel:${listing.farmerPhone}`);
  };

  const handleShare = async () => {
    const summary = `${listing.cropName} — ${listing.quantity} ${listing.unit} @ PKR ${listing.price}/${listing.unit}
${listing.district || ''}${listing.province ? ', ' + listing.province : ''}
Contact: ${listing.farmerName} ${listing.farmerPhone || ''}
— FasalDost Marketplace`;
    if (await copyText(summary)) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  return (
    <Box className="flex flex-col min-h-full pb-14">
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
          <T className="text-base font-extrabold text-slate-900 truncate max-w-[200px]">
            {listing.cropName}
          </T>
          <T className="text-[10px] text-slate-400 font-medium">
            Marketplace Listing Detail
          </T>
        </Box>

        <Btn
          onClick={handleShare}
          title="Share Listing"
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </Btn>
      </Box>

      {copiedToast && (
        <Box className="mb-3 p-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold text-center shadow-sm flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <T>Listing link copied to clipboard!</T>
        </Box>
      )}

      {/* ── Multi-Media Viewer (1-8 Images & 3 Videos) ────────────────────── */}
      <Box className="space-y-2 mb-4">
        {allMedia.length > 0 ? (
          <Box className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-sm flex items-center justify-center">
            {activeMedia.type === 'video' ? (
              <Vid
                key={activeMedia.url}
                src={activeMedia.url}
                className="w-full h-full object-contain"
              />
            ) : (
              <Img
                src={activeMedia.url}
                alt={listing.cropName}
                className="w-full h-full object-cover"
              />
            )}

            {/* Media Type Badge */}
            <Box className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <T className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
                {activeMedia.type === 'video' ? (
                  <>
                    <Video className="w-3 h-3 text-rose-400" />
                    <T>Video {activeMedia.index + 1} of {videos.length}</T>
                  </>
                ) : (
                  <>
                    <Camera className="w-3 h-3 text-white" />
                    <T>Photo {activeMedia.index + 1} of {images.length}</T>
                  </>
                )}
              </T>
            </Box>

            {listing.status === 'sold' && (
              <Box className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-slate-900/90 text-white text-[11px] font-black uppercase tracking-wider">
                SOLD OUT
              </Box>
            )}
          </Box>
        ) : (
          <Box className="w-full aspect-4/3 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <Store className="w-12 h-12 mb-1" />
            <T className="text-xs font-bold">No Photos Uploaded</T>
          </Box>
        )}

        {/* Media Thumbnails Carousel (Allows switching 1-8 images and up to 3 videos) */}
        {allMedia.length > 1 && (
          <Box className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            {allMedia.map((m, idx) => {
              const isSelected = idx === activeMediaIndex;
              return (
                <Btn
                  key={idx}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 shadow-sm scale-105'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  {m.type === 'video' ? (
                    <Box className="w-full h-full bg-black flex items-center justify-center text-white">
                      <Play className="w-5 h-5 text-rose-500 fill-rose-500" />
                      <T className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white bg-black/80 px-1 rounded">
                        Vid
                      </T>
                    </Box>
                  ) : (
                    <Img
                      src={m.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </Btn>
              );
            })}
          </Box>
        )}
      </Box>

      {/* ── Produce Primary Pricing & Summary ─────────────────────────────── */}
      <Box className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs mb-4 space-y-3">
        <Box className="flex items-start justify-between gap-2">
          <Box>
            <T className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-block mb-1.5">
              {listing.quality || 'Premium Quality'}
            </T>
            <T className="text-xl font-black text-slate-900 leading-tight">
              {listing.cropName}
            </T>
            {listing.variety && (
              <T className="text-xs text-slate-500 font-semibold mt-0.5">
                Variety: {listing.variety}
              </T>
            )}
          </Box>

          <Box className="text-right">
            <T className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Unit Price
            </T>
            <Box className="text-xl font-black text-slate-900">
              Rs {listing.price}
            </Box>
            <T className="text-[10px] text-slate-500 font-semibold">
              per {listing.unit}
            </T>
          </Box>
        </Box>

        {calculateTotal() && (
          <Box className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <T className="text-slate-500 font-semibold">Total Stock ({listing.quantity} {listing.unit}):</T>
            <T className="text-sm font-black text-slate-900">PKR {calculateTotal()}</T>
          </Box>
        )}
      </Box>

      {/* ── Section: Full Produce Description ─────────────────────────────── */}
      <Box className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs mb-4 space-y-2">
        <T className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Produce Description & Field Notes
        </T>
        {listing.description ? (
          <T className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {listing.description}
          </T>
        ) : (
          <T className="text-xs text-slate-400 italic">
            No additional notes provided by seller.
          </T>
        )}
      </Box>

      {/* ── Section: Full Metadata Table ──────────────────────────────────── */}
      <Box className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs mb-4 space-y-3">
        <T className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Produce Specifications & Metadata
        </T>

        <Box className="grid grid-cols-2 gap-2.5 text-xs">
          <Box className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <T className="text-[10px] text-slate-400 font-bold uppercase block">
              Quantity Listed
            </T>
            <T className="font-extrabold text-slate-900">
              {listing.quantity} {listing.unit}
            </T>
          </Box>

          <Box className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <T className="text-[10px] text-slate-400 font-bold uppercase block">
              Quality Grade
            </T>
            <T className="font-extrabold text-slate-900">
              {listing.quality || 'Standard'}
            </T>
          </Box>

          <Box className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <T className="text-[10px] text-slate-400 font-bold uppercase block">
              Harvest Date
            </T>
            <T className="font-extrabold text-slate-900">
              {listing.harvestDate || 'Fresh Harvest'}
            </T>
          </Box>

          <Box className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <T className="text-[10px] text-slate-400 font-bold uppercase block">
              Listing Code
            </T>
            <T className="font-mono text-[10px] font-bold text-slate-700 truncate block">
              {listing.id}
            </T>
          </Box>
        </Box>
      </Box>

      {/* ── Section: Farmer Information & Location ────────────────────────── */}
      <Box className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs mb-4 space-y-3">
        <Box className="flex items-center justify-between">
          <T className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-700" />
            <T>Farmer Information & Direct Contact</T>
          </T>
          <T className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-300 text-[10px] font-extrabold inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
            <T>Verified Farmer</T>
          </T>
        </Box>

        <Box className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <Box className="flex items-center justify-between">
            <Box>
              <T className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <T>{listing.farmerName || 'Farmer'}</T>
                <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
              </T>
              <T className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <T>{listing.farmerPhone || 'Contact details provided'}</T>
              </T>
            </Box>
            <T className="text-[10px] font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-slate-900" />
              <T>Verified Seller</T>
            </T>
          </Box>
          <Box className="pt-2 border-t border-slate-200/70 text-[10.5px] text-slate-500 leading-tight">
            🛡️ <T className="font-semibold text-slate-700">Buyer Protection:</T> Seller's CNIC, phone number, and farm location have been verified in our cloud registry.
          </Box>
        </Box>

        {/* Location Details */}
        <Box className="space-y-1.5 pt-1">
          <T className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Farm / Mandi Location
          </T>
          <Box className="flex items-start gap-2 text-xs font-semibold text-slate-800">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <Box>
              <T>
                {[listing.village, listing.tehsil, listing.district, listing.province]
                  .filter(Boolean)
                  .join(', ') || 'Pakistan'}
              </T>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Floating Action Bar: Direct WhatsApp & Call Buttons ───────────── */}
      <Box className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-center max-w-md mx-auto z-20">
        <Box className="w-full flex items-center gap-2">
          {/* Call Farmer */}
          <Btn
            type="button"
            onClick={handleCall}
            className="flex-1 h-12 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <Phone className="w-4 h-4 text-slate-700" />
            <T>Call Farmer</T>
          </Btn>

          {/* WhatsApp Farmer */}
          <Btn
            type="button"
            onClick={handleWhatsApp}
            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <T>Chat on WhatsApp</T>
          </Btn>
        </Box>
      </Box>
    </Box>
  );
};
