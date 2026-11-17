# Panel Kawalan Siaran OBS (Masjid)

Aplikasi web **single-page tanpa backend** untuk membantu AJK masjid mengawal siaran langsung **OBS Studio** melalui rangkaian tempatan (LAN) menggunakan protokol **obs-websocket v5**. Semua teks paparan dalam Bahasa Melayu mudah dan tiada panggilan ke API atau CDN luar.

---

## 1. Cara Aktifkan OBS WebSocket (OBS Studio 28 ke atas)

1. Buka aplikasi **OBS Studio** di komputer siaran masjid.
2. Pada menu atas, klik **Tools → WebSocket Server Settings**.
3. Tandakan kotak **Enable WebSocket server**.
4. Pastikan **Server Port** ialah **`4455`** (port lalai).
5. Tandakan **Enable Authentication** dan tetapkan kata laluan yang kuat (gabungan huruf besar, huruf kecil, nombor dan simbol, sekurang-kurangnya 12 aksara).
6. Klik **Apply** dan **OK**.

> **Nota Keselamatan:** Gunakan panel ini dalam rangkaian Wi-Fi/LAN masjid sahaja. Jangan lakukan *port forwarding* pada router atau dedahkan port `4455` ke internet.

---

## 2. Cara Jalankan Aplikasi

### Untuk pembangunan / ujian tempatan:
```bash
npm install
npm run dev
```
Kemudian buka pelayar web ke `http://localhost:3000`.

- Untuk terus masuk ke **Mod Demo** melalui URL: buka `http://localhost:3000/?demo=1`.
- Secara lalai, jika belum ada tetapan OBS disimpan, aplikasi akan bermula terus dalam **Mod Demo** supaya AJK boleh berlatih tanpa risiko memulakan siaran sebenar.

### Untuk bina fail statik (diguna tanpa pelayan / pada PC masjid):
```bash
npm run build
```
Folder `dist/` mengandungi semua fail yang telah dibundel sepenuhnya tanpa kebergantungan CDN luar. Anda boleh hoskan `dist/` pada pelayan web tempatan (contoh: `npx vite preview` atau `python3 -m http.server`) pada PC siaran atau LAN masjid.

---

## 3. Ujian Unit (SHA-256, Audio & Protokol obs-websocket v5)

Untuk mengesahkan fallback SHA-256 tulen JavaScript sepadan dengan WebCrypto `crypto.subtle` serta menguji protokol `obs-websocket v5`:
```bash
npx --yes tsx --test src/utils/sha256.test.ts src/utils/obsAudio.test.ts src/obs/ObsClient.test.ts
```

---

## 4. Penyelesaian Masalah Sambungan

| Masalah | Punca & Langkah Penyelesaian |
| :--- | :--- |
| **Gagal sambung dari telefon / tablet** | Pastikan telefon dan PC OBS berada dalam rangkaian Wi-Fi/LAN yang sama. Masukkan alamat IP PC OBS (contoh `192.168.1.20`), bukan `localhost`. |
| **Disekat Firewall Windows / Mac** | Benarkan aplikasi **OBS Studio** dan port TCP **`4455`** melalui Windows Defender Firewall (*Private Network*). |
| **Mesej "Kata laluan salah"** | Semak kata laluan di OBS (**Tools → WebSocket Server Settings → Show Connect Info**). Panel tidak akan cuba sambung berulang-ulang jika kata laluan salah. |
| **Sambungan HTTP bukan-localhost (LAN)** | Pelayar menyekat `crypto.subtle` pada alamat HTTP LAN (`http://192.168.x.x`). Aplikasi ini menyertakan **fallback SHA-256 JavaScript tulen** supaya pengesahan kata laluan OBS tetap berfungsi pada LAN. |
| **Bunyi berganda / bergema** | Buka bahagian **5. Audio**. Jika kelihatan kotak amaran merah *"Monitor menghantar bunyi semula ke speaker"*, tekan butang **Matikan monitor**. |

---

## 5. Keputusan Reka Bentuk untuk Pengguna Bukan Teknikal

- **Mod Demo automatik pada kali pertama:** Supaya AJK baharu dapat mencuba semua butang tanpa rasa takut tersilap memulakan siaran langsung.
- **Pengesahan dua langkah (4 saat):** Kedua-dua butang **MULA SIARAN** dan **TAMAT SIARAN** memerlukan klik kedua dalam masa 4 saat untuk mengelakkan tekan tidak sengaja.
- **Senarai Semak reset harian:** Disimpan mengikut tarikh tempatan (`mj_chk`) supaya automatik kosong keesokan harinya tanpa perlu reset manual.
- **Tooltip sentuh & hover:** Ikon `?` boleh disentuh di skrin telefon dan kotak penerangan sentiasa dikekalkan dalam ruang skrin.
