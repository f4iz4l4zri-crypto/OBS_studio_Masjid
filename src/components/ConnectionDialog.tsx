import React, { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { SavedConnection } from '../utils/storage';

interface ConnectionDialogProps {
  open: boolean;
  initialConfig: SavedConnection;
  isConnected: boolean;
  isDemo: boolean;
  errorMsg: string | null;
  onClose: () => void;
  onConnectObs: (config: SavedConnection) => Promise<boolean>;
  onDisconnect: () => void;
  onStartDemo: () => Promise<void>;
}

export const ConnectionDialog: React.FC<ConnectionDialogProps> = ({
  open,
  initialConfig,
  isConnected,
  isDemo,
  errorMsg,
  onClose,
  onConnectObs,
  onDisconnect,
  onStartDemo,
}) => {
  const [host, setHost] = useState(initialConfig.host || 'localhost');
  const [port, setPort] = useState(String(initialConfig.port || 4455));
  const [pass, setPass] = useState(initialConfig.pass || '');
  const [rem, setRem] = useState(initialConfig.rem);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setHost(initialConfig.host || 'localhost');
      setPort(String(initialConfig.port || 4455));
      setPass(initialConfig.pass || '');
      setRem(initialConfig.rem);
    }
  }, [open, initialConfig]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsedPort = Math.max(1, Math.min(65535, parseInt(port, 10) || 4455));
      const ok = await onConnectObs({
        host: host.trim() || 'localhost',
        port: parsedPort,
        pass,
        rem,
      });
      if (ok) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dlg-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 id="dlg-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Sambungan ke OBS Studio
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup tetingkap sambungan"
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
          Sambung terus ke OBS melalui WebSocket v5 (port lalai 4455).
        </p>

        <div className="mb-4 p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-100 text-sm flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          <span>
            Gunakan dalam rangkaian masjid sahaja. Jangan dedahkan port OBS ke internet.
          </span>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 text-sm font-semibold"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="conn-host"
                className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1"
              >
                Alamat Host / IP OBS
              </label>
              <input
                id="conn-host"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost"
                className="w-full min-h-12 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
              />
            </div>

            <div>
              <label
                htmlFor="conn-port"
                className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1"
              >
                Port
              </label>
              <input
                id="conn-port"
                type="number"
                min={1}
                max={65535}
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full min-h-12 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base font-mono-tabular"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="conn-pass"
              className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1"
            >
              Kata laluan WebSocket
            </label>
            <input
              id="conn-pass"
              type="password"
              autoComplete="off"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Kosongkan jika tiada kata laluan"
              className="w-full min-h-12 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={rem}
              onChange={(e) => setRem(e.target.checked)}
              className="w-5 h-5 rounded accent-emerald-700"
            />
            <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
              Ingat tetapan sambungan pada peranti ini
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="min-h-12 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold whitespace-nowrap disabled:opacity-50"
              >
                {submitting ? 'Menyambung…' : 'Sambung'}
              </button>

              {(isConnected || isDemo) && (
                <button
                  type="button"
                  onClick={() => {
                    onDisconnect();
                    onClose();
                  }}
                  className="min-h-12 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-semibold whitespace-nowrap"
                >
                  Putuskan
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                await onStartDemo();
                onClose();
              }}
              className="min-h-12 px-4 rounded-xl border border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-bold whitespace-nowrap"
            >
              Mod Demo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
