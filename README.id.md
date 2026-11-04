<p align="center">
  <img src="assets/icon.png" width="108" height="108" alt="Focus App Icon" style="border-radius: 26px;" />
</p>

# Focus

Aplikasi timer Pomodoro dan to-do list harian untuk Android. Bersih, bebas distraksi, 100% offline, tanpa iklan, dan tanpa tracking.

<p align="center">
  <a href="https://github.com/MuhamadYazri/Focus/releases"><img src="https://img.shields.io/badge/Release-v1.0.2-111111?style=for-the-badge&logo=android" alt="Release" /></a>
  <a href="https://github.com/MuhamadYazri/Focus/releases"><img src="https://img.shields.io/badge/Ukuran-3.7_MB-34A853?style=for-the-badge" alt="Ukuran" /></a>
  <a href="https://developer.android.com/about/dashboards"><img src="https://img.shields.io/badge/Android-8.0+-4285F4?style=for-the-badge&logo=android" alt="Versi Android" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/Lisensi-MIT-52504C?style=for-the-badge" alt="Lisensi" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <strong>Bahasa Indonesia</strong>
</p>

---

## Kenapa Gue Bikin Ini

Sering banget pas lagi enak-enaknya fokus 25 menit, begitu timer selesai langsung dihajar iklan video 30 detik bersuara kencang. Belum lagi fitur basic yang dikunci harus langganan bulanan. Bukannya fokus malah bikin kesel.

Gue bikin Focus karena cuma pengen alat sederhana dan jujur buat kerja tanpa gangguan. Sharing aja di sini, siapa tau ada yang butuh juga. Konsepnya simpel: timer Pomodoro dipadu to-do list harian. Mulai timernya, taruh HP, langsung fokus kerja.

---

## Fitur Utama

- **Jam Meja Gede**: Angka timer super besar, enak dilihat dari jauh pas ditaruh di meja. Tinggal tap buat masuk mode layar penuh.
- **Suara Alam Penenang**: Ada pilihan audio latar (Hujan, Ombak Laut, Suasana Kafe, Hutan, Jam Dinding) buat nutupin suara bising sekitar.
- **Strict Mode**: Otomatis senyapin notifikasi HP dan sembunyiin status bar selama timer jalan biar gak kegoda buka HP.
- **Kontrol dari Lock Screen**: Pause, skip, atau cek sisa waktu langsung dari layar kunci tanpa perlu buka aplikasinya.
- **List Tugas Harian**: Kelompokkan tugas per kategori dan pantau sesi pomodoro. Otomatis reset tiap pagi biar mulai hari dengan fresh.
- **Statistik Fokus**: Grafik batang 7 hari dan peta streak tahunan buat mantau konsistensi lu.
- **Bebas Ribet**: Gak perlu bikin akun, gak butuh internet, gak ada iklan sama sekali.

---

## Performa & Kompatibilitas

- **Super Ringan**: Ukuran download cuma ~3.7 MB. Langsung ke-install cepet dan gak makan memori HP.
- **Lancar Jaya di HP Mana Aja**: Udah dites dan jalan mulus tanpa lag, bahkan di HP budget entry-level kayak **Realme Narzo 30a**.
- **Hemat Baterai**: Kode native efisien, gak nguras baterai di latar belakang.
- **Support Android**: Bisa jalan di Android 8.0 ke atas.

---

## Cara Install

1. Buka halaman [Releases](https://github.com/MuhamadYazri/Focus/releases).
2. Download file **`Focus_v1.0.2.apk`**.
3. Buka file hasil download di HP lu, lalu pilih **Install** (izinkan install dari browser kalau diminta).

---

## Buat Developer

Dibangun pakai Kotlin dan Jetpack Compose.

### Yang Dibutuhkan Dulu
- **Android Studio**: Versi Ladybug (2024.2+) atau yang lebih baru
- **JDK**: Versi 17+
- **Android SDK**: Platform API 36 (minSdk 26, targetSdk 35)

### Clone & Build

```bash
git clone git@github.com:MuhamadYazri/Focus.git
cd Focus

# Build APK debug
./gradlew assembleDebug

# Build APK release
./gradlew assembleRelease
```

---

## Kredit

- **Audio Latar**: Joseph SARDIN di [BigSoundBank.com](https://bigsoundbank.com) (Lisensi Domain Publik CC0).
- **Animasi Maskot**: Tom Fabre di [LottieFiles](https://lottiefiles.com) (Lottie Simple License).

---

## Lisensi

Didistribusikan di bawah lisensi [MIT](LICENSE).
