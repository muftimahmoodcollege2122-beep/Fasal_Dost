// ─────────────────────────────────────────────────────────────────────────────
// src/screens/OnboardingScreen.tsx
// 5-Point Farmer Onboarding Flow (Name, Mobile, Identity, Village/Area, Language)
// Displayed immediately after splash screen with professional black & white UI
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { pickMedia, chooseSource } from '../utils/media';
import { Box, Btn, Img, Inp, Opt, Sel, T } from '../ui/web';
import { localStorage } from '../lib/kv';
import {
  User,
  Phone,
  CreditCard,
  MapPin,
  Languages,
  ArrowRight,
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sprout,
  ShieldCheck,
  X,
  Globe,
} from '../ui/icons';
import { Language, PROVINCES, SUPPORTED_LANGUAGES, t, isRTL } from '../utils/i18n';
import { saveFarmerProfile, setLang } from '../utils/store';

interface OnboardingScreenProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  currentLang,
  onLanguageChange,
  onComplete,
}) => {
  // Step tracker: 1 to 5
  const [step, setStep] = useState(1);

  // 1. Language
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLang);

  const handleSelectLanguage = (langCode: Language) => {
    setSelectedLanguage(langCode);
    setLang(langCode);
    onLanguageChange(langCode);
  };

  const activeLang = selectedLanguage || currentLang || 'en';

  const txts = {
    ur: {
      title: 'کسان پروفائل سیٹ اپ',
      step1Heading: 'اپنی زبان منتخب کریں',
      step1Sub: 'زرعی مشوروں اور ایپ کے استعمال کے لیے اپنی پسندیدہ زبان کا انتخاب کریں',
      step2Heading: 'آپ کا نام کیا ہے؟',
      step2Sub: 'براہ کرم اپنا مکمل نام درج کریں',
      step2Label: 'مکمل نام *',
      step2Placeholder: 'مثلاً محمد طارق خان',
      step2Help: 'آپ کا نام آپ کے پروفائل اور منڈی کی لسٹنگ پر ظاہر ہوگا',
      step3Heading: 'آپ کا موبائل نمبر',
      step3Sub: 'بیماریوں کے الرٹ اور خریداروں سے رابطے کے لیے فعال نمبر',
      step3Label: 'موبائل نمبر *',
      step3Placeholder: '0300 1234567',
      step3Help: 'پاکستان کے تمام نیٹ ورکس (جاز، زونگ، ٹیلی نار، یو فون) پر کارآمد',
      step4Heading: 'گاؤں اور فارم کا لوکیشن',
      step4Sub: 'علاقائی موسم، زرعی الرٹس اور منڈی کی معلومات کے لیے',
      villageLabel: 'گاؤں / چک / علاقے کا نام *',
      villagePlaceholder: 'مثلاً چک نمبر 204 آر بی، منانوالہ',
      provinceLabel: 'صوبہ *',
      districtLabel: 'ضلع *',
      districtPlaceholder: 'مثلاً فیصل آباد',
      tehsilLabel: 'تحصیل',
      tehsilPlaceholder: 'مثلاً جڑانوالہ',
      step5Heading: 'شناخت کی تصدیق',
      step5Sub: 'کسان کی تصدیق اور منڈی میں خریداروں کے اعتماد کے لیے',
      cnicLabel: '13 ہندسوں کا قومی شناختی کارڈ نمبر *',
      cnicPhotoLabel: 'شناختی کارڈ کی تصویر (اختیاری)',
      uploadBtn: 'شناختی کارڈ کی تصویر اپ لوڈ کریں',
      uploadHelp: 'اپنے اصل نادرا کارڈ کی صاف تصویر',
      cnicHelp: 'محفوظ اور انکرپٹڈ ڈیٹا بیس میں محفوظ',
      continueBtn: 'آگے بڑھیں',
      finishBtn: 'سیٹ اپ مکمل کریں',
      saving: 'سیٹ اپ مکمل ہو رہا ہے...',
    },
    en: {
      title: 'Farmer Setup',
      step1Heading: 'Select Your Language',
      step1Sub: 'Choose your preferred language for advice and app interface',
      step2Heading: 'What is your Name?',
      step2Sub: 'Please enter your full legal name as per official records',
      step2Label: 'Full Name *',
      step2Placeholder: 'e.g. Muhammad Tariq Khan',
      step2Help: 'Your name will appear on your farmer profile and produce listings',
      step3Heading: 'Your Mobile Number',
      step3Sub: 'Active contact number for disease advisories and buyer inquiries',
      step3Label: 'Mobile Number *',
      step3Placeholder: '0300 1234567',
      step3Help: 'Supports all active Pakistani mobile networks (Jazz, Zong, Telenor, Ufone)',
      step4Heading: 'Village & Farm Location',
      step4Sub: 'Locate your farm for tailored regional disease alerts and weather data',
      villageLabel: 'Village / Chak / Area Name *',
      villagePlaceholder: 'e.g. Chak 204 RB, Manawala',
      provinceLabel: 'Province *',
      districtLabel: 'District *',
      districtPlaceholder: 'e.g. Faisalabad',
      tehsilLabel: 'Tehsil',
      tehsilPlaceholder: 'e.g. Jaranwala',
      step5Heading: 'Identity Verification',
      step5Sub: 'Pakistani CNIC card verification for farmer trust & marketplace selling',
      cnicLabel: '13-Digit CNIC Number *',
      cnicPhotoLabel: 'CNIC Card Photo (Optional / Recommended)',
      uploadBtn: 'Upload CNIC Card Photo',
      uploadHelp: 'Clear photo of your original NADRA card',
      cnicHelp: 'Encrypted & stored in secure database storage',
      continueBtn: 'Continue',
      finishBtn: 'Complete Setup & Enter App',
      saving: 'Finalizing Setup...',
    },
    zh: {
      title: '农户设置',
      step1Heading: '选择您的语言',
      step1Sub: '选择您希望的农艺建议和界面语言',
      step2Heading: '您的姓名是什么？',
      step2Sub: '请输入您的完整姓名',
      step2Label: '完整姓名 *',
      step2Placeholder: '例如：张伟',
      step2Help: '您的姓名将显示在农户主页和农产品信息中',
      step3Heading: '您的手机号码',
      step3Sub: '用于接收病虫害预警和买家联系',
      step3Label: '手机号码 *',
      step3Placeholder: '0300 1234567',
      step3Help: '支持所有主要移动网络',
      step4Heading: '村庄与农场位置',
      step4Sub: '定位农场以获取区域预警和天气',
      villageLabel: '村庄 / 区域名称 *',
      villagePlaceholder: '例如：曼纳瓦拉',
      provinceLabel: '省份 *',
      districtLabel: '地区/县 *',
      districtPlaceholder: '例如：费萨拉巴德',
      tehsilLabel: '乡镇/街道',
      tehsilPlaceholder: '例如：贾兰瓦拉',
      step5Heading: '身份验证',
      step5Sub: '身份核验以建立农户信任',
      cnicLabel: '13位身份证件号码 *',
      cnicPhotoLabel: '身份证件照片（可选）',
      uploadBtn: '上传证件照片',
      uploadHelp: '清晰的身份证件照片',
      cnicHelp: '数据已加密安全存储',
      continueBtn: '继续',
      finishBtn: '完成设置并进入',
      saving: '正在完成设置...',
    },
    hi: {
      title: 'किसान सेटअप',
      step1Heading: 'अपनी भाषा चुनें',
      step1Sub: 'कृषि सलाह और इंटरफेस के लिए अपनी भाषा चुनें',
      step2Heading: 'आपका नाम क्या है?',
      step2Sub: 'कृपया अपना पूरा नाम दर्ज करें',
      step2Label: 'पूरा नाम *',
      step2Placeholder: 'उदा. मोहम्मद तारिक खान',
      step2Help: 'आपका नाम किसान प्रोफाइल और लिस्टिंग पर दिखाई देगा',
      step3Heading: 'आपका मोबाइल नंबर',
      step3Sub: 'फसल सलाह और खरीदार संपर्क के लिए सक्रिय नंबर',
      step3Label: 'मोबाइल नंबर *',
      step3Placeholder: '0300 1234567',
      step3Help: 'सभी मोबाइल नेटवर्क पर चालू',
      step4Heading: 'गांव और खेत का स्थान',
      step4Sub: 'स्थानीय मौसम और सलाह प्राप्त करने के लिए स्थान दर्ज करें',
      villageLabel: 'गांव / क्षेत्र का नाम *',
      villagePlaceholder: 'उदा. मनावाला',
      provinceLabel: 'प्रांत / राज्य *',
      districtLabel: 'जिला *',
      districtPlaceholder: 'उदा. फैसलाबाद',
      tehsilLabel: 'तहसील',
      tehsilPlaceholder: 'उदा. जरांवाला',
      step5Heading: 'पहचान सत्यापन',
      step5Sub: 'किसान की पुष्टि और मंडी में विश्वास के लिए',
      cnicLabel: '13-अंकों का पहचान पत्र नंबर *',
      cnicPhotoLabel: 'पहचान पत्र की फोटो (वैकल्पिक)',
      uploadBtn: 'फोटो अपलोड करें',
      uploadHelp: 'पहचान पत्र की स्पष्ट फोटो',
      cnicHelp: 'सुरक्षित डेटाबेस में संग्रहीत',
      continueBtn: 'आगे बढ़ें',
      finishBtn: 'सेटअप पूरा करें',
      saving: 'अंतिम रूप दिया जा रहा है...',
    },
    es: {
      title: 'Configuración de Agricultor',
      step1Heading: 'Seleccione su idioma',
      step1Sub: 'Elija su idioma preferido para consejos e interfaz',
      step2Heading: '¿Cuál es su nombre?',
      step2Sub: 'Ingrese su nombre completo',
      step2Label: 'Nombre completo *',
      step2Placeholder: 'ej. Muhammad Tariq Khan',
      step2Help: 'Su nombre aparecerá en su perfil de agricultor',
      step3Heading: 'Su número de teléfono móvil',
      step3Sub: 'Contacto para alertas y compradores',
      step3Label: 'Número de teléfono *',
      step3Placeholder: '0300 1234567',
      step3Help: 'Soporta redes móviles',
      step4Heading: 'Ubicación de la finca',
      step4Sub: 'Para datos climáticos y alertas regionales',
      villageLabel: 'Nombre de la aldea / zona *',
      villagePlaceholder: 'ej. Manawala',
      provinceLabel: 'Provincia *',
      districtLabel: 'Distrito *',
      districtPlaceholder: 'ej. Faisalabad',
      tehsilLabel: 'Municipio',
      tehsilPlaceholder: 'ej. Jaranwala',
      step5Heading: 'Verificación de identidad',
      step5Sub: 'Para mayor confianza en el mercado',
      cnicLabel: 'Número de identificación *',
      cnicPhotoLabel: 'Foto del documento (Opcional)',
      uploadBtn: 'Subir foto del documento',
      uploadHelp: 'Foto clara de su documento',
      cnicHelp: 'Encriptado y almacenado de forma segura',
      continueBtn: 'Continuar',
      finishBtn: 'Completar e ingresar',
      saving: 'Finalizando...',
    },
    ar: {
      title: 'إعداد المزارع',
      step1Heading: 'اختر لغتك المفضلة',
      step1Sub: 'اختر اللغة المناسبة للحصول على الإرشادات والواجهة',
      step2Heading: 'ما هو اسمك؟',
      step2Sub: 'يرجى إدخال اسمك الكامل وفقاً للسجلات الرسمية',
      step2Label: 'الاسم الكامل *',
      step2Placeholder: 'مثال: محمد طارق خان',
      step2Help: 'سيظهر اسمك في ملفك الشخصي وقوائم المنتجات',
      step3Heading: 'رقم هاتفك المحمول',
      step3Sub: 'رقم اتصال للتنبيهات واستفسارات المشترين',
      step3Label: 'رقم الهاتف المحمول *',
      step3Placeholder: '0300 1234567',
      step3Help: 'يدعم جميع شبكات الهاتف المحمول',
      step4Heading: 'موقع المزرعة والقرية',
      step4Sub: 'تحديد موقع مزرعتك للحصول على التنبيهات الإقليمية والمناخ',
      villageLabel: 'اسم القرية / المنطقة *',
      villagePlaceholder: 'مثال: ماناولا',
      provinceLabel: 'المحافظة / الإقليم *',
      districtLabel: 'المنطقة *',
      districtPlaceholder: 'مثال: فيصل آباد',
      tehsilLabel: 'المركز / النواحي',
      tehsilPlaceholder: 'مثال: جرانوالا',
      step5Heading: 'توثيق الهوية',
      step5Sub: 'توثيق بطاقة الهوية لزيادة موثوقية المزارع',
      cnicLabel: 'رقم بطاقة الهوية المكون من 13 رقماً *',
      cnicPhotoLabel: 'صورة بطاقة الهوية (اختياري)',
      uploadBtn: 'تحميل صورة الهوية',
      uploadHelp: 'صورة واضحة لبطاقة الهوية الأصلية',
      cnicHelp: 'مشفر ومخزن في قاعدة بيانات آمنة',
      continueBtn: 'متابعة',
      finishBtn: 'إكمال الإعداد والدخول',
      saving: 'جاري إنهاء الإعداد...',
    },
  };

  const tVal = txts[activeLang] || txts.en;

  // 2. Full Name
  const [fullName, setFullName] = useState('');

  // 3. Mobile Number
  const [phoneNumber, setPhoneNumber] = useState('');

  // 4. Village / Area
  const [province, setProvince] = useState('Punjab');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [villageArea, setVillageArea] = useState('');

  // 5. Identity Verification (CNIC & Card Photo)
  const [cnicNumber, setCnicNumber] = useState('');
  const [cnicPhoto, setCnicPhoto] = useState<string | null>(null);

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCnicChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 5 && digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
    setCnicNumber(formatted);
  };

  const handleFileUpload = async () => {
    const source = await chooseSource();
    if (!source) return;
    const [img] = await pickMedia({ source, facing: 'environment' });
    if (!img) return;
    if (img.base64.length * 0.75 > 12 * 1024 * 1024) {
      setErrorMsg('CNIC photo must be under 12MB.');
      return;
    }
    setCnicPhoto(img.dataUrl);
    setErrorMsg('');
  };

  const validateCurrentStep = (): boolean => {
    setErrorMsg('');

    if (step === 1) {
      if (!selectedLanguage) {
        setErrorMsg('Please select your preferred language.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMsg('Please enter your full name.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrorMsg('Please enter a valid active mobile phone number.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!villageArea.trim()) {
        setErrorMsg('Please enter your village, town, or local area.');
        return false;
      }
      if (!district.trim()) {
        setErrorMsg('Please enter your district.');
        return false;
      }
      return true;
    }

    if (step === 5) {
      const cleanCnic = cnicNumber.replace(/\D/g, '');
      if (cleanCnic.length !== 13) {
        setErrorMsg('Please enter a valid 13-digit Pakistani CNIC number.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      await handleFinishOnboarding();
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  const handleFinishOnboarding = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Save language preference
      setLang(selectedLanguage as Language);

      // 2. Persist Farmer Profile with all 5 elements
      await saveFarmerProfile({
        name: fullName.trim(),
        phone: phoneNumber.trim(),
        province,
        district: district.trim(),
        tehsil: tehsil.trim(),
        village: villageArea.trim(),
        cnicNumber: cnicNumber.trim(),
        isSellerVerified: !!cnicPhoto,
        savedAt: new Date().toISOString(),
      });

      // 3. Mark Onboarding as Completed
      localStorage.setItem('fd_onboarding_completed', 'true');
      localStorage.setItem('fd_auth_session', 'true');

      onComplete();
    } catch (err: any) {
      console.error('Onboarding save failed:', err);
      setErrorMsg(err?.message || 'Failed to save information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="flex flex-col min-h-full justify-between pb-6 pt-2 px-1 select-none">

      {/* Top Header & Step Tracker */}
      <Box>
        <Box className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200">
          {step > 1 ? (
            <Btn
              type="button"
              onClick={handlePrev}
              className="w-9 h-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-800 hover:bg-neutral-100 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Btn>
          ) : (
            <Box className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
              FD
            </Box>
          )}

          <Box className="text-center">
            <T className="text-xs font-black uppercase tracking-wider text-neutral-900">
              {tVal.title} ({step}/5)
            </T>
          </Box>

          <Box className="w-9 text-right text-xs font-bold text-neutral-400">
            {Math.round((step / 5) * 100)}%
          </Box>
        </Box>

        {/* 5-Step Progress Bar */}
        <Box className="grid grid-cols-5 gap-1.5 mb-5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Box
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}
            />
          ))}
        </Box>

        {/* Validation Error Notice */}
        {errorMsg && (
          <Box className="mb-4 p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0" />
            <T>{errorMsg}</T>
          </Box>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 1: LANGUAGE PREFERENCE
           ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <Box className="space-y-4">
            <Box className="text-center mb-4">
              <Box className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-900">
                <Globe className="w-6 h-6" />
              </Box>
              <T className="text-lg font-black text-neutral-900">
                {tVal.step1Heading}
              </T>
              <T className="text-xs text-neutral-500 mt-0.5">
                {tVal.step1Sub}
              </T>
            </Box>

            <Box className="grid grid-cols-2 gap-2.5">
              {SUPPORTED_LANGUAGES.map((langItem) => {
                const isSelected = selectedLanguage === langItem.code;
                return (
                  <Btn
                    key={langItem.code}
                    type="button"
                    onClick={() => handleSelectLanguage(langItem.code)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900'
                    }`}
                  >
                    <Box className="flex items-center justify-between w-full mb-1">
                      <T className="text-xs font-bold">{langItem.name}</T>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </Box>
                    <T
                      className={`text-sm font-black ${
                        isSelected ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {langItem.native}
                    </T>
                    <T
                      className={`text-[10px] font-semibold mt-1 ${
                        isSelected ? 'text-neutral-300' : 'text-neutral-400'
                      }`}
                    >
                      {langItem.population}
                    </T>
                  </Btn>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 2: FULL NAME
           ════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <Box className="space-y-4">
            <Box className="text-center mb-4">
              <Box className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-900">
                <User className="w-6 h-6" />
              </Box>
              <T className="text-lg font-black text-neutral-900">
                {tVal.step2Heading}
              </T>
              <T className="text-xs text-neutral-500 mt-0.5">
                {tVal.step2Sub}
              </T>
            </Box>

            <Box className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-2">
              <T className="block text-xs font-bold text-neutral-800">
                {tVal.step2Label}
              </T>
              <Box className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Inp
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={tVal.step2Placeholder}
                  className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </Box>
              <T className="text-[10px] text-neutral-400 pt-1">
                {tVal.step2Help}
              </T>
            </Box>
          </Box>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 3: MOBILE NUMBER
           ════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <Box className="space-y-4">
            <Box className="text-center mb-4">
              <Box className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-900">
                <Phone className="w-6 h-6" />
              </Box>
              <T className="text-lg font-black text-neutral-900">
                {tVal.step3Heading}
              </T>
              <T className="text-xs text-neutral-500 mt-0.5">
                {tVal.step3Sub}
              </T>
            </Box>

            <Box className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-2">
              <T className="block text-xs font-bold text-neutral-800">
                {tVal.step3Label}
              </T>
              <Box className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Inp
                  type="tel"
                  required
                  autoFocus
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={tVal.step3Placeholder}
                  className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </Box>
              <T className="text-[10px] text-neutral-400 pt-1">
                {tVal.step3Help}
              </T>
            </Box>
          </Box>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 4: VILLAGE / AREA
           ════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <Box className="space-y-4">
            <Box className="text-center mb-4">
              <Box className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-900">
                <MapPin className="w-6 h-6" />
              </Box>
              <T className="text-lg font-black text-neutral-900">
                {tVal.step4Heading}
              </T>
              <T className="text-xs text-neutral-500 mt-0.5">
                {tVal.step4Sub}
              </T>
            </Box>

            <Box className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
              {/* Village / Area */}
              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  {tVal.villageLabel}
                </T>
                <Inp
                  type="text"
                  required
                  autoFocus
                  value={villageArea}
                  onChange={(e) => setVillageArea(e.target.value)}
                  placeholder={tVal.villagePlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 font-semibold"
                />
              </Box>

              {/* Province */}
              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  {tVal.provinceLabel}
                </T>
                <Sel
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 font-semibold cursor-pointer"
                >
                  {PROVINCES.map((p) => (
                    <Opt key={p} value={p}>
                      {p}
                    </Opt>
                  ))}
                </Sel>
              </Box>

              {/* District & Tehsil */}
              <Box className="grid grid-cols-2 gap-2">
                <Box>
                  <T className="block text-xs font-bold text-neutral-800 mb-1">
                    {tVal.districtLabel}
                  </T>
                  <Inp
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder={tVal.districtPlaceholder}
                    className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 font-semibold"
                  />
                </Box>

                <Box>
                  <T className="block text-xs font-bold text-neutral-800 mb-1">
                    {tVal.tehsilLabel}
                  </T>
                  <Inp
                    type="text"
                    value={tehsil}
                    onChange={(e) => setTehsil(e.target.value)}
                    placeholder={tVal.tehsilPlaceholder}
                    className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 font-semibold"
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 5: IDENTITY VERIFICATION
           ════════════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <Box className="space-y-4">
            <Box className="text-center mb-4">
              <Box className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-900">
                <CreditCard className="w-6 h-6" />
              </Box>
              <T className="text-lg font-black text-neutral-900">
                {tVal.step5Heading}
              </T>
              <T className="text-xs text-neutral-500 mt-0.5">
                {tVal.step5Sub}
              </T>
            </Box>

            <Box className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
              {/* CNIC Number */}
              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  {tVal.cnicLabel}
                </T>
                <Inp
                  type="text"
                  required
                  autoFocus
                  maxLength={15}
                  value={cnicNumber}
                  onChange={(e) => handleCnicChange(e.target.value)}
                  placeholder="XXXXX-XXXXXXX-X"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-sm font-bold font-mono tracking-wider text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </Box>

              {/* CNIC Photo Upload */}
              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1.5">
                  {tVal.cnicPhotoLabel}
                </T>

                {cnicPhoto ? (
                  <Box className="relative aspect-16/9 rounded-xl overflow-hidden border border-neutral-300 bg-neutral-100">
                    <Img
                      src={cnicPhoto}
                      alt="CNIC Card"
                      className="w-full h-full object-cover"
                    />
                    <Btn
                      type="button"
                      onClick={() => setCnicPhoto(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Btn>
                    <T className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-neutral-900 text-[9px] font-bold text-white">
                      Document Attached
                    </T>
                  </Box>
                ) : (
                  <Btn
                    type="button"
                    onClick={() => handleFileUpload()}
                    className="w-full py-4 px-3 rounded-xl border-2 border-dashed border-neutral-300 hover:border-neutral-900 bg-neutral-50 flex flex-col items-center justify-center gap-1.5 text-neutral-600 transition cursor-pointer"
                  >
                    <Camera className="w-5 h-5 text-neutral-800" />
                    <T className="text-xs font-bold">{tVal.uploadBtn}</T>
                    <T className="text-[10px] text-neutral-400">
                      {tVal.uploadHelp}
                    </T>
                  </Btn>
                )}
              </Box>

              <Box className="pt-2 flex items-center gap-2 text-[10px] text-neutral-500 font-semibold border-t border-neutral-100">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                <T>{tVal.cnicHelp}</T>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Bottom CTA Actions */}
      <Box className="pt-4">
        <Btn
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className="w-full h-13 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99] cursor-pointer"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <T>{tVal.saving}</T>
            </>
          ) : step === 5 ? (
            <>
              <T>{tVal.finishBtn}</T>
              <CheckCircle2 className="w-4 h-4" />
            </>
          ) : (
            <>
              <T>{tVal.continueBtn}</T>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Btn>
      </Box>
    </Box>
  );
};
