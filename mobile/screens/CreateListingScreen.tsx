// ─────────────────────────────────────────────────────────────────────────────
// src/screens/CreateListingScreen.tsx
// Form to post a produce listing with 1-8 images and up to 3 videos
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { pickMedia, chooseSource } from '../utils/media';
import { Box, Btn, Img, Inp, Opt, Sel, T, Vid } from '../ui/web';
import {
  ArrowLeft,
  Camera,
  Video,
  UploadCloud,
  X,
  Plus,
  RefreshCw,
  Store,
  MapPin,
  Phone,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
} from '../ui/icons';
import {
  Language,
  CROPS,
  UNITS,
  QUALITY_OPTIONS,
  PROVINCES,
} from '../utils/i18n';
import { createListing, getFarmerProfile, isSellerVerified } from '../utils/store';

interface CreateListingScreenProps {
  lang: Language;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

export const CreateListingScreen: React.FC<CreateListingScreenProps> = ({
  lang: _lang,
  onNavigate,
  onBack,
}) => {
  // Produce details
  const [cropName, setCropName] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [variety, setVariety] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Maund');
  const [price, setPrice] = useState('');
  const [quality, setQuality] = useState('Premium Quality');
  const [harvestDate, setHarvestDate] = useState('');
  const [description, setDescription] = useState('');

  // Farmer & Location metadata
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [province, setProvince] = useState('Punjab');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [village, setVillage] = useState('');

  // Multi-media upload states (1 to 8 images, up to 3 videos)
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);


  useEffect(() => {
    (async () => {
      const verified = await isSellerVerified();
      if (!verified) {
        onNavigate('SellerVerification');
        return;
      }

      const p = await getFarmerProfile();
      if (p) {
        if (p.name) setFarmerName(p.name);
        if (p.phone) setFarmerPhone(p.phone);
        if (p.province) setProvince(p.province);
        if (p.district) setDistrict(p.district);
        if (p.tehsil) setTehsil(p.tehsil);
        if (p.village) setVillage(p.village);
      }
    })();
  }, []);

  // Handle uploading 1 to 8 images
  const handleAddImages = async () => {
    setErrorMsg('');
    const remainingSlots = 8 - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg('You have reached the maximum limit of 8 images.');
      return;
    }
    const source = await chooseSource();
    if (!source) return;
    const picked = await pickMedia({ source, multiple: true });
    const add = picked.slice(0, remainingSlots).map((p) => p.dataUrl);
    setImages((prev) => [...prev, ...add].slice(0, 8));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle uploading up to 3 videos
  const handleAddVideos = async () => {
    setErrorMsg('');
    const remainingSlots = 3 - videos.length;
    if (remainingSlots <= 0) {
      setErrorMsg('You have reached the maximum limit of 3 videos.');
      return;
    }
    const picked = await pickMedia({ source: 'gallery', video: true, multiple: true });
    const ok: string[] = [];
    for (const p of picked.slice(0, remainingSlots)) {
      // base64 length ~ 4/3 of bytes: reject > 30MB clips
      if (p.base64.length * 0.75 > 30 * 1024 * 1024) {
        setErrorMsg('Video file must be under 30MB for fast buyer streaming.');
        continue;
      }
      ok.push(p.dataUrl);
    }
    setVideos((prev) => [...prev, ...ok].slice(0, 3));
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedCropName = cropName === 'Other' ? customCrop : cropName;

  const calculateTotal = () => {
    const q = parseFloat(quantity);
    const p = parseFloat(price);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      return (q * p).toLocaleString('en-PK');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCropName.trim()) {
      setErrorMsg('Please select or specify the crop name.');
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setErrorMsg('Please enter a valid quantity.');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setErrorMsg('Please enter a valid price per unit.');
      return;
    }
    if (!farmerName.trim()) {
      setErrorMsg('Farmer name is required so buyers can identify the seller.');
      return;
    }
    if (!farmerPhone.trim()) {
      setErrorMsg('Farmer phone number is required so buyers can call or WhatsApp you.');
      return;
    }
    if (images.length === 0) {
      setErrorMsg('Please upload at least 1 image of your produce (1 to 8 images allowed).');
      return;
    }

    setLoading(true);

    try {
      const newId = await createListing({
        cropName: selectedCropName.trim(),
        variety: variety.trim(),
        quantity: quantity.trim(),
        unit,
        price: price.trim(),
        quality: quality as any,
        harvestDate: harvestDate.trim(),
        description: description.trim(),
        farmerName: farmerName.trim(),
        farmerPhone: farmerPhone.trim(),
        province,
        district: district.trim(),
        tehsil: tehsil.trim(),
        village: village.trim(),
        images,
        videos,
      });

      if (newId) {
        setSuccess(true);
        setTimeout(() => {
          onNavigate('Marketplace');
        }, 1200);
      } else {
        setErrorMsg('Failed to publish listing to the database. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while publishing the listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex flex-col min-h-full pb-10">

      {/* Header */}
      <Box className="flex items-center justify-between py-2 mb-3 border-b border-slate-100 pb-3">
        <Btn
          type="button"
          onClick={onBack}
          title="Back"
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Btn>

        <Box className="text-center">
          <T className="text-base font-extrabold text-slate-900 inline-flex items-center gap-1.5">
            <Store className="w-4 h-4 text-slate-800" />
            <T>Post Produce Listing</T>
          </T>
          <T className="text-[10px] text-slate-400 font-medium">
            1-8 Photos & 3 Videos
          </T>
        </Box>

        <Box className="w-10" />
      </Box>

      {success ? (
        <Box className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4 space-y-3">
          <Box className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
            <CheckCircle2 className="w-8 h-8" />
          </Box>
          <T className="text-base font-bold text-slate-900">
            Listing Published Successfully!
          </T>
          <T className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Your produce has been saved to the database and is now visible on the Marketplace for buyers nationwide.
          </T>
        </Box>
      ) : (
        <Box onSubmit={handleSubmit} className="space-y-4">
          {/* Verified Seller Trust Banner */}
          <Box className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-2xs">
            <Box className="flex items-center gap-2.5">
              <Box className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
              </Box>
              <Box>
                <T className="text-xs font-extrabold text-emerald-950">
                  Verified Genuine Farmer
                </T>
                <T className="text-[10px] text-emerald-700 font-semibold">
                  CNIC & Anti-Bot Identity Authenticated
                </T>
              </Box>
            </Box>
            <T className="px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-bold border border-emerald-300">
              Active Seller
            </T>
          </Box>

          {errorMsg && (
            <Box className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <T>{errorMsg}</T>
            </Box>
          )}

          {/* ── Section 1: 1-8 Images Upload ─────────────────────────────────── */}
          <Box className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <Box className="flex items-center justify-between">
              <T className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-700" />
                <T>Upload Photos (1 to 8 Images) *</T>
              </T>
              <T className="text-[10px] font-bold text-slate-500">
                {images.length}/8 Photos
              </T>
            </Box>

            {/* Photo Grid Preview */}
            <Box className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <Box
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white group shadow-2xs"
                >
                  <Img
                    src={img}
                    alt={`Listing photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Btn
                    type="button"
                    onClick={() => removeImage(idx)}
                    title="Remove image"
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </Btn>
                  {idx === 0 && (
                    <T className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-slate-900/80 text-[8px] font-bold text-white leading-none">
                      Cover
                    </T>
                  )}
                </Box>
              ))}

              {images.length < 8 && (
                <Btn
                  type="button"
                  onClick={() => handleAddImages()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-800 hover:bg-white bg-slate-100/50 flex flex-col items-center justify-center gap-1 transition text-slate-500 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <T className="text-[9px] font-bold">Add Photo</T>
                </Btn>
              )}
            </Box>

            <T className="text-[10px] text-slate-400">
              Clear photos of the crop, harvested piles, and sacks attract 4x more buyers.
            </T>
          </Box>

          {/* ── Section 2: Up to 3 Videos Upload ─────────────────────────────── */}
          <Box className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <Box className="flex items-center justify-between">
              <T className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-slate-700" />
                <T>Upload Videos (Up to 3 Videos)</T>
              </T>
              <T className="text-[10px] font-bold text-slate-500">
                {videos.length}/3 Videos
              </T>
            </Box>

            {/* Video List Preview */}
            {videos.length > 0 && (
              <Box className="grid grid-cols-3 gap-2">
                {videos.map((vid, vIdx) => (
                  <Box
                    key={vIdx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-black group"
                  >
                    <Vid
                      src={vid}
                      className="w-full h-full object-cover"
                    />
                    <Btn
                      type="button"
                      onClick={() => removeVideo(vIdx)}
                      title="Remove video"
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </Btn>
                    <T className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-rose-600/90 text-[8px] font-bold text-white leading-none">
                      Video {vIdx + 1}
                    </T>
                  </Box>
                ))}
              </Box>
            )}

            {videos.length < 3 && (
              <Btn
                type="button"
                onClick={() => handleAddVideos()}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-800 hover:bg-white bg-slate-100/50 flex items-center justify-center gap-2 transition text-slate-600 text-xs font-bold cursor-pointer"
              >
                <Video className="w-4 h-4 text-slate-700" />
                <T>Add Crop Video (Field / Harvest Walkthrough)</T>
              </Btn>
            )}
          </Box>

          {/* ── Section 3: Produce Details ───────────────────────────────────── */}
          <Box className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <T className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Produce Information
            </T>

            {/* Crop Name */}
            <Box>
              <T className="block text-[11px] font-bold text-slate-700 mb-1">
                Crop Name *
              </T>
              <Sel
                required
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <Opt value="">Select Crop</Opt>
                {CROPS.map((c) => (
                  <Opt key={c.en} value={c.en}>
                    {c.en}
                  </Opt>
                ))}
              </Sel>
            </Box>

            {cropName === 'Other' && (
              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  Specify Crop Name *
                </T>
                <Inp
                  type="text"
                  required
                  value={customCrop}
                  onChange={(e) => setCustomCrop(e.target.value)}
                  placeholder="e.g. Watermelon, Garlic"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </Box>
            )}

            {/* Variety / Sub-Type */}
            <Box>
              <T className="block text-[11px] font-bold text-slate-700 mb-1">
                Crop Variety / Type (Optional)
              </T>
              <Inp
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. Super Kernel Basmati, Faisalabad-2008, Desi"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </Box>

            {/* Quantity & Unit */}
            <Box className="grid grid-cols-2 gap-2">
              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  Quantity *
                </T>
                <Inp
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </Box>

              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  Unit *
                </T>
                <Sel
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  {UNITS.map((u) => (
                    <Opt key={u.en} value={u.en}>
                      {u.name}
                    </Opt>
                  ))}
                  <Opt value="Bags">Bags (Bori)</Opt>
                  <Opt value="Crates">Crates</Opt>
                </Sel>
              </Box>
            </Box>

            {/* Price & Quality */}
            <Box className="grid grid-cols-2 gap-2">
              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  Price per {unit} (PKR) *
                </T>
                <Inp
                  type="number"
                  required
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 3800"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </Box>

              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  Quality Grade
                </T>
                <Sel
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  {QUALITY_OPTIONS.map((q) => (
                    <Opt key={q.en} value={q.name}>
                      {q.name}
                    </Opt>
                  ))}
                </Sel>
              </Box>
            </Box>

            {/* Total Estimated Value preview */}
            {calculateTotal() && (
              <Box className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-center justify-between">
                <T className="font-semibold text-[11px]">Total Estimated Value:</T>
                <T className="font-black text-slate-900">PKR {calculateTotal()}</T>
              </Box>
            )}

            {/* Harvest Date */}
            <Box>
              <T className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <T>Harvest Date / Ready Date</T>
              </T>
              <Inp
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
              />
            </Box>

            {/* Description */}
            <Box>
              <T className="block text-[11px] font-bold text-slate-700 mb-1">
                Produce Description & Field Notes
              </T>
              <Inp
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention moisture content, grain size, packaging bags, pickup location or loading facility..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900 resize-none"
              />
            </Box>
          </Box>

          {/* ── Section 4: Farmer Identity & Location Metadata ───────────────── */}
          <Box className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <T className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-700" />
              <T>Farmer Details & Location Metadata</T>
            </T>

            {/* Farmer Name & Phone */}
            <Box className="grid grid-cols-2 gap-2">
              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  Farmer Name *
                </T>
                <Inp
                  type="text"
                  required
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </Box>

              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  Contact Phone Number *
                </T>
                <Inp
                  type="tel"
                  required
                  value={farmerPhone}
                  onChange={(e) => setFarmerPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </Box>
            </Box>

            {/* Province & District */}
            <Box className="grid grid-cols-2 gap-2">
              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  Province *
                </T>
                <Sel
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  {PROVINCES.map((prov) => (
                    <Opt key={prov} value={prov}>
                      {prov}
                    </Opt>
                  ))}
                </Sel>
              </Box>

              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  District *
                </T>
                <Inp
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Multan, Faisalabad"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </Box>
            </Box>

            {/* Tehsil & Village/Mandi */}
            <Box className="grid grid-cols-2 gap-2">
              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tehsil
                </T>
                <Inp
                  type="text"
                  value={tehsil}
                  onChange={(e) => setTehsil(e.target.value)}
                  placeholder="e.g. Shujabad"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </Box>

              <Box>
                <T className="block text-[11px] font-bold text-slate-700 mb-1">
                  Village / Mandi
                </T>
                <Inp
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Chak 42-JB"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </Box>
            </Box>
          </Box>

          {/* Submit Button */}
          <Btn
            type="submit"
            disabled={loading || images.length === 0}
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <T>Publish Produce to Marketplace</T>
              </>
            )}
          </Btn>
        </Box>
      )}
    </Box>
  );
};
