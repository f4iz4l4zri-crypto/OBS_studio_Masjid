# PROMPT UNTUK GOOGLE AI STUDIO — Dashboard Kawalan Siaran OBS (Masjid)

> Cara guna: buka Google AI Studio → Build / Apps → paste SEMUA teks di bawah garisan (mulai "PERANAN"). Pilih model terbaik yang ada (Gemini Pro). Selepas app siap, minta AI Studio "Export / Download" projek, kemudian ujian dengan OBS sebenar.
> Penting: app ini mesti berjalan di PC/LAN masjid dan bersambung ke OBS terus melalui WebSocket. Pastikan AI Studio TIDAK menggunakan Gemini API/backend luar dalam app akhir.

---

## PERANAN
Anda ialah jurutera frontend senior. Bina satu aplikasi web **single-page, tanpa backend, tanpa API luar** (tiada panggilan ke Gemini atau mana-mana pelayan internet) yang berfungsi sebagai **panel kawalan siaran langsung untuk OBS Studio**, untuk digunakan oleh AJK masjid yang bukan teknikal. Semua teks antara muka dalam **Bahasa Melayu mudah**. Istilah teknikal yang lazim dalam OBS (Scene, Stream, Record, Monitor, Mute) kekalkan dalam bahasa Inggeris tetapi sertakan penerangan Bahasa Melayu dalam tooltip.

## OBJEKTIF
Pengendali masjid boleh, hanya dengan klik besar dan jelas: memulakan/menamatkan siaran, menukar paparan (scene), menghantar tajuk & nama penceramah ke skrin, menghidup/matikan logo, dan mengawal audio — tanpa membuka OBS. App menyambung ke **obs-websocket v5** (terbina dalam OBS 28+), port lalai **4455**.

## KEPERLUAN TEKNIKAL
- Output: aplikasi yang boleh diekspot sebagai satu folder statik (atau satu fail HTML). Boleh guna React + TypeScript + Vite + Tailwind, tetapi **tiada kebergantungan masa-jalan ke CDN/pelayan luar** (bundle semua). Hasil akhir mesti boleh dibuka dari `http://localhost` atau `file://` atau LAN.
- Sambungan: `new WebSocket("ws://HOST:PORT", "obswebsocket.json")`. Tiada pustaka obs-websocket-js; laksanakan protokol sendiri (ringkas, di bawah).
- Pengesahan (jika OBS ada kata laluan) mesti guna **SHA-256**. Jangan bergantung pada `crypto.subtle` sahaja (ia tidak tersedia pada HTTP bukan-localhost); sediakan **fallback SHA-256 JavaScript tulen**.
- Sambung semula automatik setiap 6 saat jika terputus; papar status jelas. Jangan tunjuk ralat palsu apabila pengguna sendiri memutuskan sambungan.
- Responsif: mesti selesa di desktop 1366×768 dan telefon (320–430px), butang besar untuk sentuhan.

## PROTOKOL obs-websocket v5 (ikut tepat)
1. Selepas sambung, terima mesej `op:0` (Hello) → `d.authentication` mungkin ada `{challenge, salt}`.
2. Hantar `op:1` (Identify): `{rpcVersion:1, eventSubscriptions: 2047 | 65536, authentication?}`.
   - 2047 = semua event umum; 65536 = `InputVolumeMeters` (high-volume) untuk meter audio.
   - Auth: `secret = base64(sha256(password + salt))`; `authentication = base64(sha256(secret + challenge))`. (sha256 ialah bait mentah, kemudian base64.)
3. Terima `op:2` (Identified) → sambungan sedia.
4. Request: `{op:6, d:{requestType, requestId, requestData}}`; respons `op:7` dengan `requestStatus.result` (boolean) dan `responseData`. Gunakan Promise berdasarkan `requestId` (UUID/nombor unik) dengan timeout 8 saat.
5. Event: `op:5` dengan `d.eventType`, `d.eventData`.

**Request yang perlu digunakan:** GetSceneList, SetCurrentProgramScene, GetSceneItemList, SetSceneItemEnabled, GetInputList, GetInputSettings, SetInputSettings (`overlay:true`; kunci teks = `"text"`), GetInputMute, SetInputMute, GetInputVolume, SetInputVolume (`inputVolumeDb`), GetInputAudioMonitorType, SetInputAudioMonitorType (`OBS_MONITORING_TYPE_NONE | OBS_MONITORING_TYPE_MONITOR_ONLY | OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT`), GetStreamStatus, GetRecordStatus, GetStats, StartStream, StopStream, StartRecord, StopRecord.

**Event yang perlu didengar:** StreamStateChanged, RecordStateChanged, CurrentProgramSceneChanged, SceneListChanged, SceneItemEnableStateChanged, InputMuteStateChanged, InputVolumeChanged, InputVolumeMeters (`inputLevelsMul` = senarai `[magnitude, peak, inputPeak]` setiap saluran; tukar ke paparan 0–100 dengan skala dB/log yang munasabah).

## SKRIN & CIRI (urutan kad, atas ke bawah)
**Bar atas:** nama masjid (boleh diedit & disimpan), lampu status sambungan OBS (hijau/kuning/merah), butang "Sambungan" (tetapan).

**Kad 1 — Siaran:** lencana besar "TIDAK BERSIARAN" / "SEDANG BERSIARAN" (merah berkelip). Butang **MULA SIARAN** dan **TAMAT SIARAN**: **dua langkah** (klik pertama "Klik sekali lagi untuk sahkan", tamat automatik 4 saat) supaya tidak tertekan tersilap. Butang Rakaman (mula/henti). Statistik ringkas: tempoh siaran, bingkai gugur (% ), CPU, FPS — dengan amaran warna jika bingkai gugur > 2% ("Internet tidak stabil").

**Kad 2 — Pilih Paparan:** butang besar bagi setiap Scene; scene aktif diserlah. Tukar scene ketika siaran dibenarkan tanpa dialog.

**Senarai Semak sebelum siaran (8 item, tick manual):** contohnya: Mixer dihidupkan; Mikrofon dibuka; Kamera PTZ menyala; Internet OK; OBS dibuka; Kabel audio ke UM2 dipasang; Monitor OBS = None; Logo/tajuk disemak. Tetap ke `localStorage` kunci `mj_chk` dan **reset setiap hari**.

**Kad 3 — Tajuk & Penceramah:** 3 medan (Tajuk, Penceramah, Teks Berjalan). Butang **Hantar ke Skrin** dan **Kosongkan**. Pemetaan automatik ke sumber teks OBS dengan regex pada nama input: `/tajuk|title/i`, `/penceramah|speaker|ustaz/i`, `/berjalan|ticker|scroll/i`; simpan pemetaan di `mj_map`; benarkan pengguna ubah pemetaan dalam bahagian "Lanjutan" (lipat). **Preset**: simpan/panggil senarai tajuk+penceramah (`mj_presets`), dengan butang padam.

**Kad 4 — Logo & Lapisan:** suis on/off bagi item dalam scene aktif (guna GetSceneItemList + SetSceneItemEnabled); kemas kini serta-merta melalui event.

**Kad 5 — Audio:** untuk setiap input audio (kesan melalui regex pada `inputKind`, contoh: wasapi_input_capture, wasapi_output_capture, coreaudio_*, pulse_*, alsa_*, dshow_input, ffmpeg_source, browser_source): meter masa nyata (bar hijau/kuning/merah), butang Mute, gelangsar volum −60..0 dB, dropdown **Monitor**. **Penting:** jika mana-mana input mempunyai monitor ≠ None, papar kotak amaran merah: "Monitor menghantar bunyi semula ke speaker — ini punca bunyi berganda" dengan butang **Matikan monitor** (set None).

**Panduan Ringkas** (lipat): 6 langkah siaran + 5 penyelesaian masalah lazim (tiada bunyi, bunyi berganda, siaran putus-putus, gambar tersangkut, tak boleh sambung ke OBS).

**Dialog Sambungan:** host (lalai `localhost`), port (lalai `4455`), kata laluan, pilihan "Ingat tetapan" (`mj_conn`), butang **Sambung**, dan butang **Mod Demo**. Auto-sambung jika tetapan tersimpan. Sokong `?demo=1` untuk mula terus dalam Mod Demo.

**Mod Demo (wajib):** kelas `MockObs` dengan antara muka sama seperti klien sebenar (`call(type,data)`, event) yang mensimulasikan scene, input audio, meter bergerak, status siaran, supaya seluruh UI boleh diuji tanpa OBS.

## TOOLTIP & BAHASA
- Setiap butang/kawalan ada tooltip (`data-tip`) dalam BM mudah, 1–2 ayat, cth: Mula Siaran → "Mulakan siaran langsung ke YouTube/Facebook. Pastikan senarai semak lengkap dahulu."
- Tooltip mesti berfungsi dengan **hover (desktop)** dan **sentuh (telefon)**; ia muncul dalam satu kotak tetap supaya tidak terpotong skrin; klik di luar menyembunyikannya.
- Nada mesra, ayat pendek, tiada jargon. Nama istilah OBS dikekalkan dalam English.

## REKA BENTUK
- Gaya bersih, kontras tinggi, fon ≥ 16px, butang ≥ 48px tinggi, warna konsisten (hijau = OK/aktif, merah = bahaya/siaran, kuning = perhatian). Sokong mod gelap dan terang.
- Tiada animasi berlebihan; hormati `prefers-reduced-motion`.
- Aksesibiliti: label ARIA, fokus kelihatan, boleh dikendali papan kekunci.

## KESELAMATAN & PRIVASI
- Tiada pelayan luar, tiada analitik, tiada font/CDN luar. Kata laluan OBS disimpan hanya jika pengguna pilih "Ingat tetapan", dalam `localStorage` sahaja.
- Papar nota di dialog Sambungan: "Gunakan dalam rangkaian masjid sahaja. Jangan dedahkan port OBS ke internet."
- Gunakan akaun/kata laluan OBS WebSocket yang kuat (panduan dalam bahagian Panduan).

## PENERIMAAN (periksa sebelum menyerahkan)
1. Demo mode: semua kad berfungsi, meter bergerak, butang Mula/Tamat dua-langkah, amaran monitor muncul dan boleh dibetulkan.
2. Auth OBS dengan kata laluan betul → sambung; salah → mesej "Kata laluan salah" tanpa gelung sambung semula.
3. Fallback SHA-256 menghasilkan nilai sama dengan `crypto.subtle` (sertakan ujian kecil).
4. Tukar scene, mute, volum, set teks overlay, Start/StopStream berfungsi melalui WebSocket sebenar.
5. Tiada permintaan rangkaian keluar selain ke host OBS (semak tab Network).
6. Paparan telefon 360×640 tidak terpotong; tooltip berfungsi dengan sentuhan.
7. Sertakan fail `README.md` ringkas BM: cara aktifkan OBS WebSocket (OBS → Tools → WebSocket Server Settings → Enable, tetapkan kata laluan), cara jalankan app (`npm run dev` / buka fail), dan penyelesaian masalah sambungan (firewall, port 4455).

Serahkan kod penuh yang boleh dijalankan, bukan pseudo-kod. Jika ada keputusan reka bentuk yang tidak jelas, ambil pilihan paling mudah untuk pengguna bukan teknikal dan nyatakan dalam README.
