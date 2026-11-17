import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const GuideCard: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-labelledby="heading-panduan"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-12 flex items-center justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-emerald-600 rounded-xl"
      >
        <h2 id="heading-panduan" className="text-lg font-bold text-stone-900 dark:text-stone-100">
          Panduan Ringkas &amp; Penyelesaian Masalah
        </h2>
        <ChevronDown
          className={`w-6 h-6 text-stone-600 dark:text-stone-400 transition-transform shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-3">
              6 Langkah Siaran Langsung
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-base text-stone-800 dark:text-stone-200 leading-relaxed">
              <li>Pastikan OBS Studio dibuka dan panel ini berstatus Bersambung.</li>
              <li>Lengkapkan ke-8 item dalam Senarai Semak Sebelum Siaran.</li>
              <li>Pilih Paparan (Scene) yang sesuai seperti Kuliah atau Khutbah.</li>
              <li>Isi Tajuk, Penceramah dan Teks Berjalan, kemudian tekan Hantar ke Skrin.</li>
              <li>Semak meter Audio berada di paras hijau–kuning tanpa amaran merah.</li>
              <li>Tekan MULA SIARAN dua kali, dan tekan TAMAT SIARAN dua kali apabila selesai.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-3">
              5 Penyelesaian Masalah Lazim
            </h3>
            <dl className="space-y-3 text-sm sm:text-base text-stone-800 dark:text-stone-200">
              <div>
                <dt className="font-bold">1. Tiada bunyi dalam siaran</dt>
                <dd className="text-stone-600 dark:text-stone-400">
                  Semak butang Senyap (Mute) di bahagian Audio, pastikan mixer dihidupkan dan kabel USB ke UM2 dipasang kemas.
                </dd>
              </div>
              <div>
                <dt className="font-bold">2. Bunyi berganda atau bergema</dt>
                <dd className="text-stone-600 dark:text-stone-400">
                  Jika ada amaran merah di bahagian Audio, tekan Matikan monitor. Pastikan Monitor ditetapkan kepada None.
                </dd>
              </div>
              <div>
                <dt className="font-bold">3. Siaran putus-putus</dt>
                <dd className="text-stone-600 dark:text-stone-400">
                  Perhatikan Bingkai gugur di Kad Siaran. Jika melebihi 2%, guna sambungan kabel LAN terus ke router, bukan Wi-Fi.
                </dd>
              </div>
              <div>
                <dt className="font-bold">4. Gambar tersangkut</dt>
                <dd className="text-stone-600 dark:text-stone-400">
                  Semak CPU OBS. Tutup aplikasi berat lain di komputer OBS dan pastikan kabel HDMI/PTZ tidak longgar.
                </dd>
              </div>
              <div>
                <dt className="font-bold">5. Tak boleh sambung ke OBS</dt>
                <dd className="text-stone-600 dark:text-stone-400">
                  Dalam OBS, buka Tools → WebSocket Server Settings → tandakan Enable WebSocket server (Port 4455) dan tetapkan kata laluan yang kuat (huruf + nombor + simbol). Jika dari telefon, guna alamat IP komputer OBS (cth. 192.168.1.20).
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
};
