// ─────────────────────────────────────────────────────────────────────────────
// src/utils/i18n.js
//
// PURPOSE:
//   Internationalization (i18n) — all user-facing text strings in Urdu and English.
//   Also exports static data lists: crops, provinces.
//
// USAGE:
//   import { t, textAlign, CROPS, PROVINCES } from '../utils/i18n';
//   t('appName', 'ur')  → 'فصل دوست'
//   t('appName', 'en')  → 'FasalDost'
//
// ADDING A NEW STRING:
//   1. Add it to the `strings` object below with both 'ur' and 'en' values
//   2. Use t('yourKey', lang) in any screen
//
// ─────────────────────────────────────────────────────────────────────────────

/** All UI text strings — Urdu and English */
const strings = {
  // ── App identity ──────────────────────────────────────────────────────────
  appName:           { ur: 'فصل دوست',                              en: 'FasalDost'                          },
  tagline:           { ur: 'آپ کی فصل کا محافظ',                    en: 'Guardian of Your Harvest'           },

  // ── Home screen ───────────────────────────────────────────────────────────
  subtitle:          { ur: 'فصل کی تصویر لے کر بیماری معلوم کریں', en: 'Scan your crop to detect diseases'  },
  takePhoto:         { ur: 'تصویر کھینچیں',                         en: 'Take Photo'                         },
  uploadPhoto:       { ur: 'گیلری سے لیں',                          en: 'Upload from Gallery'                },
  howItWorks:        { ur: 'یہ کیسے کام کرتا ہے',                   en: 'How It Works'                       },
  step1Title:        { ur: 'تصویر لیں',                              en: 'Take Photo'                         },
  step1Desc:         { ur: 'بیمار پتے کی تصویر',                     en: 'Of the affected leaf'               },
  step2Title:        { ur: 'AI تجزیہ',                               en: 'AI Analysis'                        },
  step2Desc:         { ur: 'فوری تشخیص',                             en: 'Instant diagnosis'                  },
  step3Title:        { ur: 'علاج جانیں',                             en: 'Get Treatment'                      },
  step3Desc:         { ur: 'قدم بہ قدم ہدایات',                       en: 'Step by step guide'                 },

  // ── Scan screen ───────────────────────────────────────────────────────────
  selectCrop:        { ur: 'فصل منتخب کریں',                        en: 'Select Crop'                        },
  cropHint:          { ur: 'فصل چنیں یا لکھیں',                      en: 'Select or type crop name'           },
  typeManually:      { ur: 'یا خود لکھیں',                           en: 'Or type manually'                   },
  analyzeBtn:        { ur: 'بیماری معلوم کریں',                       en: 'Detect Disease'                     },
  analyzing:         { ur: 'تجزیہ ہو رہا ہے',                        en: 'Analyzing'                          },
  tapToChange:       { ur: 'تصویر تبدیل کریں',                       en: 'Tap to change image'                },
  unclearImage:      { ur: 'تصویر واضح نہیں — قریب سے دوبارہ لیں',  en: 'Image unclear — retake closer photo'},

  // ── Result screen ─────────────────────────────────────────────────────────
  diagnosis:         { ur: 'تشخیص',                                  en: 'Diagnosis'                          },
  severity:          { ur: 'شدت',                                    en: 'Severity'                           },
  treatment:         { ur: 'علاج',                                   en: 'Treatment'                          },
  prevention:        { ur: 'احتیاط',                                 en: 'Prevention'                         },
  symptoms:          { ur: 'علامات',                                 en: 'Symptoms'                           },
  scanAgain:         { ur: 'نئی اسکین',                              en: 'Scan Again'                         },
  share:             { ur: 'شیئر کریں',                              en: 'Share'                              },
  confidence:        { ur: 'اعتماد',                                 en: 'Confidence'                         },
  healthy:           { ur: 'فصل صحت مند ہے',                         en: 'Crop is Healthy'                    },
  multipleDetected:  { ur: 'متعدد بیماریاں',                         en: 'Multiple diseases'                  },
  disease:           { ur: 'بیماری',                                 en: 'Disease'                            },

  // ── Severity levels ───────────────────────────────────────────────────────
  low:               { ur: 'کم خطرہ',                               en: 'Low Risk'                           },
  medium:            { ur: 'درمیانہ',                               en: 'Medium Risk'                        },
  high:              { ur: 'زیادہ خطرہ',                            en: 'High Risk'                          },

  // ── History screen ────────────────────────────────────────────────────────
  history:           { ur: 'اسکین تاریخ',                           en: 'Scan History'                       },
  noHistory:         { ur: 'ابھی تک کوئی اسکین نہیں',               en: 'No scans yet'                       },
  noHistoryDesc:     { ur: 'پہلی اسکین کریں اور یہاں دیکھیں',      en: 'Scan a crop and it will appear here'},
  clearHistory:      { ur: 'تاریخ صاف کریں',                        en: 'Clear History'                      },
  clearConfirm:      { ur: 'تمام اسکین ریکارڈ حذف کریں؟',           en: 'Delete all scan records?'           },
  yes:               { ur: 'ہاں',                                   en: 'Yes'                                },
  cancel:            { ur: 'منسوخ',                                 en: 'Cancel'                             },

  // ── Farmer profile screen ─────────────────────────────────────────────────
  farmerProfile:     { ur: 'کسان پروفائل',                          en: 'Farmer Profile'                     },
  welcomeTitle:      { ur: 'فصل دوست میں خوش آمدید',               en: 'Welcome to FasalDost'               },
  welcomeDesc:       { ur: 'شروع کرنے کے لیے اپنی معلومات دیں',    en: 'Enter your details to get started'  },
  farmerName:        { ur: 'آپ کا نام',                             en: 'Your Name'                          },
  farmerPhone:       { ur: 'موبائل نمبر',                           en: 'Mobile Number'                      },
  farmerProvince:    { ur: 'صوبہ',                                  en: 'Province'                           },
  farmerDivision:    { ur: 'ڈویژن',                                 en: 'Division'                           },
  farmerDistrict:    { ur: 'ضلع',                                   en: 'District'                           },
  farmerTehsil:      { ur: 'تحصیل',                                 en: 'Tehsil'                             }, // ← NEW
  farmerLand:        { ur: 'زمین کا رقبہ (ایکڑ)',                   en: 'Land Size (Acres)'                  },
  farmerCrops:       { ur: 'اہم فصلیں',                             en: 'Main Crops'                         },
  saveProfile:       { ur: 'محفوظ کریں',                            en: 'Save Profile'                       },
  profileSaved:      { ur: 'پروفائل محفوظ ہو گیا ✅',               en: 'Profile saved ✅'                   },
  nameRequired:      { ur: 'نام ضروری ہے',                          en: 'Name is required'                   },
  provinceRequired:  { ur: 'صوبہ منتخب کریں',                       en: 'Please select a province'           },

  // ── Input placeholders ────────────────────────────────────────────────────
  namePH:            { ur: 'مثلاً محمد علی',                        en: 'e.g. Muhammad Ali'                  },
  phonePH:           { ur: '03001234567',                            en: '03001234567'                        },
  divisionPH:        { ur: 'مثلاً فیصل آباد ڈویژن',                 en: 'e.g. Faisalabad Division'           }, // ← NEW
  districtPH:        { ur: 'مثلاً فیصل آباد',                       en: 'e.g. Faisalabad'                    },
  tehsilPH:          { ur: 'مثلاً سمندری',                          en: 'e.g. Samundri'                      }, // ← NEW
  landPH:            { ur: 'مثلاً 5',                               en: 'e.g. 5'                             },

  // ── Error messages ────────────────────────────────────────────────────────
  error:             { ur: 'خرابی آ گئی',                           en: 'Something went wrong'               },
  tryAgain:          { ur: 'دوبارہ کوشش کریں',                       en: 'Please try again'                   },
  noImage:           { ur: 'پہلے تصویر لیں',                         en: 'Please select an image first'       },
  networkError:      { ur: 'انٹرنیٹ کنکشن چیک کریں',                en: 'Check your internet connection'     },
};

/**
 * Translate a key to the given language.
 * Falls back to English if Urdu is not available.
 * Returns the key itself if not found (so missing strings are visible).
 *
 * @param {string} key  - Translation key (e.g. 'appName')
 * @param {string} lang - Language code: 'ur' or 'en'
 * @returns {string}
 */
export const t = (key, lang = 'ur') => {
  const val = strings[key];
  if (!val) return key; // Key not found — return key as fallback (easy to spot)
  return val[lang] ?? val.en ?? key;
};

/**
 * Returns CSS text alignment direction for given language.
 * Urdu is right-to-left, English is left-to-right.
 * @param {string} lang
 * @returns {'right'|'left'}
 */
export const textAlign = (lang) => (lang === 'ur' ? 'right' : 'left');

/**
 * Returns true if language is Urdu.
 * @param {string} lang
 * @returns {boolean}
 */
export const isUrdu = (lang) => lang === 'ur';

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA LISTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pakistani crop list — shown in crop selector dropdown on ScanScreen
 * and as chip selection on FarmerProfileScreen.
 * @type {Array<{en: string, ur: string}>}
 */
export const CROPS = [
  { en: 'Wheat',      ur: 'گندم'       },
  { en: 'Cotton',     ur: 'کپاس'       },
  { en: 'Rice',       ur: 'چاول'       },
  { en: 'Sugarcane',  ur: 'گنا'        },
  { en: 'Maize',      ur: 'مکئی'       },
  { en: 'Mango',      ur: 'آم'         },
  { en: 'Tomato',     ur: 'ٹماٹر'      },
  { en: 'Potato',     ur: 'آلو'        },
  { en: 'Onion',      ur: 'پیاز'       },
  { en: 'Chili',      ur: 'مرچ'        },
  { en: 'Mustard',    ur: 'سرسوں'      },
  { en: 'Sunflower',  ur: 'سورج مکھی'  },
  { en: 'Chickpea',   ur: 'چنا'        },
  { en: 'Lentil',     ur: 'مسور'       },
  { en: 'Banana',     ur: 'کیلا'       },
  { en: 'Citrus',     ur: 'کھٹے پھل'   },
  { en: 'Guava',      ur: 'امرود'      },
  { en: 'Okra',       ur: 'بھنڈی'      },
  { en: 'Pumpkin',    ur: 'کدو'        },
  { en: 'Other',      ur: 'دیگر'       },
];

/**
 * Pakistan's provinces and territories.
 * Shown as chip selector on FarmerProfileScreen.
 * @type {string[]}
 */
export const PROVINCES = [
  'Punjab',
  'Sindh',
  'KPK',
  'Balochistan',
  'Gilgit-Baltistan',
  'AJK',
];
