# Fasal Dost (فصل دوست) — Guardian of Your Harvest

Fasal Dost is an intelligent crop disease diagnosis and agricultural marketplace web application designed specifically for Pakistani farmers.

## Features

- **Instant AI Disease Detection**: Capture or upload crop leaf photos to detect diseases (Yellow Rust, Bacterial Blight, Early Blight, Leaf Curl Virus, etc.) with Pakistani agronomist precision.
- **Urdu & English Bilingual Interface**: Complete RTL support for Urdu and LTR for English with instant language toggling.
- **Urdu Voice Reader (🔊)**: Reads full diagnosis, severity, urgency, and step-by-step treatment in Urdu for illiterate farmers.
- **Kisan Market (کسان بازار)**: Farmers can list produce with photos, quantity (Maund, KG, Ton), price in PKR, quality grading, and direct WhatsApp / call connection with buyers.
- **Farmer Profile Management**: 3-step profile covering personal information, location (Division, District, Tehsil), and land size & main crops.
- **Offline-First Scan History**: Keeps local scan records with full offline retrieval, duplicate prevention, and shareable reports.
- **Daily Scan Quota**: Built-in 10 scans/day quota tracker to prevent API abuse.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Bundler & Dev Server**: Vite (running on port 3000)
- **AI Diagnostics**: Google Generative AI integration with fallback expert agronomy model
