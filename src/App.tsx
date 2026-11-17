import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AudioCard } from './components/AudioCard';
import { BroadcastLogDrawer } from './components/BroadcastLogDrawer';
import { ChecklistCard, CHECKLIST_ITEMS } from './components/ChecklistCard';
import { ConnectionDialog } from './components/ConnectionDialog';
import { GuideCard } from './components/GuideCard';
import { LayersCard } from './components/LayersCard';
import { LiveCard } from './components/LiveCard';
import { PreviewTemplatesCard } from './components/PreviewTemplatesCard';
import { ScenesCard } from './components/ScenesCard';
import { StyleCustomizerDialog } from './components/StyleCustomizerDialog';
import { TextOverlayCard } from './components/TextOverlayCard';
import { TooltipManager } from './components/TooltipManager';
import { TopBar } from './components/TopBar';
import { MockObs } from './obs/MockObs';
import { ObsAuthError, ObsClient } from './obs/ObsClient';
import {
  ConnectionPhase,
  IObsClient,
  MonitorType,
  ObsAudioInput,
  ObsRecordStatus,
  ObsScene,
  ObsSceneItem,
  ObsStats,
  ObsStreamStatus,
} from './obs/types';
import {
  autoMapTextInputs,
  extractPeakDb,
  isAudioInputKind,
  isTextInputKind,
  TextFieldKey,
  TextInputMapping,
} from './utils/obsAudio';
import {
  loadChecklistTicks,
  loadMosqueName,
  loadPresets,
  loadQrInfo,
  loadSavedConnection,
  loadStyleConfig,
  loadTextDraft,
  loadTextMapping,
  loadTheme,
  QrOverlayInfo,
  saveChecklistTicks,
  saveConnection,
  SavedConnection,
  saveMosqueName,
  savePresets,
  saveQrInfo,
  saveStyleConfig,
  saveTextDraft,
  saveTextMapping,
  saveTheme,
  TextDraft,
  TextPreset,
} from './utils/storage';
import {
  classifySceneItem,
  DashboardStyleConfig,
  LayerCategory,
  OutputTemplate,
  resolveTemplateLayerActions,
} from './utils/templates';
import {
  appendLogEntry,
  BroadcastLogEntry,
  createLogEntry,
  loadBroadcastLogs,
  LogCategory,
  saveBroadcastLogs,
} from './utils/broadcastLog';

interface ToastItem {
  id: number;
  message: string;
  tone: 'info' | 'ok' | 'warn' | 'bad';
}

export default function App() {
  const [mosqueName, setMosqueName] = useState<string>(() => loadMosqueName());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());
  const [styleConfig, setStyleConfig] = useState<DashboardStyleConfig>(() => loadStyleConfig());
  const [qrInfo, setQrInfo] = useState<QrOverlayInfo>(() => loadQrInfo());

  const [phase, setPhase] = useState<ConnectionPhase>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string>('Belum bersambung');
  const [connError, setConnError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);

  const [savedConfig, setSavedConfig] = useState<SavedConnection>(() => {
    return loadSavedConnection() ?? { host: 'localhost', port: 4455, pass: '', rem: true };
  });

  // OBS State
  const [scenes, setScenes] = useState<string[]>([]);
  const [currentScene, setCurrentScene] = useState<string>('');
  const [sceneItems, setSceneItems] = useState<ObsSceneItem[]>([]);
  const [audioInputs, setAudioInputs] = useState<ObsAudioInput[]>([]);
  const [textInputNames, setTextInputNames] = useState<string[]>([]);

  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [skippedFrames, setSkippedFrames] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [cpuUsage, setCpuUsage] = useState<number | null>(null);
  const [fps, setFps] = useState<number | null>(null);

  // User data persisted locally
  const [ticks, setTicks] = useState<number[]>(() => loadChecklistTicks());
  const [mapping, setMapping] = useState<TextInputMapping>(() => loadTextMapping());
  const [presets, setPresets] = useState<TextPreset[]>(() => loadPresets());
  const [draft, setDraft] = useState<TextDraft>(() => loadTextDraft());
  const [logs, setLogs] = useState<BroadcastLogEntry[]>(() => loadBroadcastLogs());
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const clientRef = useRef<IObsClient | null>(null);
  const meterLevelsRef = useRef<Record<string, number>>({});
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubscribesRef = useRef<Array<() => void>>([]);
  const currentSceneRef = useRef<string>('');
  const toastIdRef = useRef(1);

  currentSceneRef.current = currentScene;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', styleConfig.accent);
    document.documentElement.setAttribute('data-layout', styleConfig.layout);
    saveStyleConfig(styleConfig);
  }, [styleConfig]);

  useEffect(() => {
    document.title = `Panel Siaran OBS — ${mosqueName}`;
  }, [mosqueName]);

  const addToast = useCallback((message: string, tone: ToastItem['tone'] = 'info') => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev.slice(-1), { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, tone === 'bad' ? 6000 : 3000);
  }, []);

  const recordLog = useCallback(
    (category: LogCategory, title: string, detail?: string) => {
      const entry = createLogEntry(category, title, detail);
      setLogs((prev) => {
        const next = appendLogEntry(prev, entry);
        saveBroadcastLogs(next);
        return next;
      });
    },
    []
  );

  const clearClientTimersAndSubs = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    unsubscribesRef.current.forEach((unsub) => unsub());
    unsubscribesRef.current = [];
  }, []);

  const loadItemsForScene = useCallback(async (client: IObsClient, sceneName: string): Promise<ObsSceneItem[]> => {
    if (!sceneName) {
      setSceneItems([]);
      return [];
    }
    try {
      const res = await client.call<{ sceneItems: ObsSceneItem[] }>('GetSceneItemList', {
        sceneName,
      });
      const list = (res.sceneItems || []).slice().reverse();
      setSceneItems(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const loadScenes = useCallback(
    async (client: IObsClient) => {
      const res = await client.call<{
        currentProgramSceneName: string;
        scenes: ObsScene[];
      }>('GetSceneList');
      const names = (res.scenes || []).slice().reverse().map((s) => s.sceneName);
      setScenes(names);
      setCurrentScene(res.currentProgramSceneName || '');
      currentSceneRef.current = res.currentProgramSceneName || '';
      await loadItemsForScene(client, res.currentProgramSceneName);
    },
    [loadItemsForScene]
  );

  const loadInputs = useCallback(async (client: IObsClient) => {
    const res = await client.call<{
      inputs: Array<{ inputName: string; inputKind: string }>;
    }>('GetInputList');
    const allInputs = res.inputs || [];
    const texts = allInputs
      .filter((i) => isTextInputKind(i.inputKind))
      .map((i) => i.inputName);
    setTextInputNames(texts);

    setMapping((prevMap) => {
      const { mapping: nextMap, changed } = autoMapTextInputs(texts, prevMap);
      if (changed) saveTextMapping(nextMap);
      return nextMap;
    });

    const audioList = allInputs.filter((i) => isAudioInputKind(i.inputKind));
    const hydrated = await Promise.all(
      audioList.map(async (inp): Promise<ObsAudioInput | null> => {
        try {
          const [muteRes, volRes, monRes] = await Promise.all([
            client.call<{ inputMuted: boolean }>('GetInputMute', {
              inputName: inp.inputName,
            }),
            client.call<{ inputVolumeDb: number }>('GetInputVolume', {
              inputName: inp.inputName,
            }),
            client
              .call<{ monitorType: MonitorType }>('GetInputAudioMonitorType', {
                inputName: inp.inputName,
              })
              .catch(() => ({ monitorType: 'OBS_MONITORING_TYPE_NONE' as MonitorType })),
          ]);
          return {
            name: inp.inputName,
            kind: inp.inputKind,
            muted: !!muteRes.inputMuted,
            db: Math.round((volRes.inputVolumeDb ?? 0) * 2) / 2,
            monitorType: monRes.monitorType || 'OBS_MONITORING_TYPE_NONE',
          };
        } catch {
          return null;
        }
      })
    );
    setAudioInputs(hydrated.filter((x): x is ObsAudioInput => x !== null));
  }, []);

  const pollStatus = useCallback(async (client: IObsClient) => {
    if (!client.isConnected) return;
    try {
      const [streamRes, recRes, statsRes] = await Promise.all([
        client.call<ObsStreamStatus>('GetStreamStatus'),
        client.call<ObsRecordStatus>('GetRecordStatus'),
        client.call<ObsStats>('GetStats'),
      ]);
      setStreaming(!!streamRes.outputActive);
      setDurationMs(streamRes.outputDuration || 0);
      setSkippedFrames(streamRes.outputSkippedFrames || 0);
      setTotalFrames(streamRes.outputTotalFrames || 0);
      setRecording(!!recRes.outputActive);
      setCpuUsage(statsRes.cpuUsage ?? null);
      setFps(statsRes.activeFps ?? null);
    } catch {
      // Ignore transient poll errors
    }
  }, []);

  const bindClientEvents = useCallback(
    (client: IObsClient, isDemoMode: boolean, onUnexpectedClose: () => void) => {
      const subs: Array<() => void> = [];

      subs.push(
        client.on('close', (ev) => {
          if (client.isManualClose) return;
          if (ev.authFailed) {
            setPhase('auth_error');
            setStatusMessage('Kata laluan salah');
            setConnError('Kata laluan salah');
            return;
          }
          if (!isDemoMode) {
            onUnexpectedClose();
          }
        })
      );

      subs.push(
        client.on('CurrentProgramSceneChanged', (d) => {
          setCurrentScene(d.sceneName);
          currentSceneRef.current = d.sceneName;
          loadItemsForScene(client, d.sceneName);
        })
      );

      subs.push(
        client.on('SceneListChanged', () => {
          loadScenes(client);
        })
      );

      subs.push(
        client.on('SceneItemEnableStateChanged', (d) => {
          if (d.sceneName === currentSceneRef.current) {
            setSceneItems((prev) =>
              prev.map((item) =>
                item.sceneItemId === d.sceneItemId
                  ? { ...item, sceneItemEnabled: d.sceneItemEnabled }
                  : item
              )
            );
          }
        })
      );

      subs.push(
        client.on('StreamStateChanged', (d) => {
          setStreaming(!!d.outputActive);
          if (!d.outputActive) setDurationMs(0);
        })
      );

      subs.push(
        client.on('RecordStateChanged', (d) => {
          setRecording(!!d.outputActive);
        })
      );

      subs.push(
        client.on('InputMuteStateChanged', (d) => {
          setAudioInputs((prev) =>
            prev.map((a) =>
              a.name === d.inputName ? { ...a, muted: !!d.inputMuted } : a
            )
          );
        })
      );

      subs.push(
        client.on('InputVolumeChanged', (d) => {
          setAudioInputs((prev) =>
            prev.map((a) =>
              a.name === d.inputName
                ? { ...a, db: Math.round((d.inputVolumeDb ?? 0) * 2) / 2 }
                : a
            )
          );
        })
      );

      subs.push(client.on('InputCreated', () => loadInputs(client)));
      subs.push(client.on('InputRemoved', () => loadInputs(client)));
      subs.push(client.on('InputNameChanged', () => loadInputs(client)));

      subs.push(
        client.on('InputVolumeMeters', (d) => {
          for (const inp of d.inputs || []) {
            meterLevelsRef.current[inp.inputName] = extractPeakDb(inp.inputLevelsMul);
          }
        })
      );

      unsubscribesRef.current = subs;
    },
    [loadInputs, loadItemsForScene, loadScenes]
  );

  const disconnect = useCallback(
    (showToast = false) => {
      clearClientTimersAndSubs();
      if (clientRef.current) {
        clientRef.current.close();
        clientRef.current = null;
      }
      meterLevelsRef.current = {};
      setScenes([]);
      setCurrentScene('');
      setSceneItems([]);
      setAudioInputs([]);
      setTextInputNames([]);
      setStreaming(false);
      setRecording(false);
      setDurationMs(0);
      setSkippedFrames(0);
      setTotalFrames(0);
      setCpuUsage(null);
      setFps(null);
      setPhase('disconnected');
      setStatusMessage('Belum bersambung');
      if (showToast) addToast('Sambungan diputuskan.', 'info');
    },
    [addToast, clearClientTimersAndSubs]
  );

  const startDemoMode = useCallback(async () => {
    clearClientTimersAndSubs();
    if (clientRef.current) {
      clientRef.current.close();
      clientRef.current = null;
    }
    setConnError(null);
    setPhase('connecting');
    setStatusMessage('Memulakan Mod Demo…');

    const mock = new MockObs();
    clientRef.current = mock;
    bindClientEvents(mock, true, () => {});

    await mock.connect();
    setPhase('demo');
    setStatusMessage('Mod Demo');
    recordLog('connection', 'Mod Demo Dimulakan', 'Simulasi panel kawalan aktif');

    await Promise.all([loadScenes(mock), loadInputs(mock), pollStatus(mock)]);
    pollTimerRef.current = setInterval(() => pollStatus(mock), 1200);
  }, [bindClientEvents, clearClientTimersAndSubs, loadInputs, loadScenes, pollStatus, recordLog]);

  const connectRealObs = useCallback(
    async (cfg: SavedConnection, isAutoReconnect = false): Promise<boolean> => {
      clearClientTimersAndSubs();
      if (clientRef.current) {
        clientRef.current.close();
        clientRef.current = null;
      }

      setConnError(null);
      setSavedConfig(cfg);
      setPhase(isAutoReconnect ? 'reconnecting' : 'connecting');
      setStatusMessage(isAutoReconnect ? 'Cuba sambung semula…' : 'Menyambung ke OBS…');

      const obs = new ObsClient();
      clientRef.current = obs;

      const scheduleReconnect = () => {
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        setPhase('reconnecting');
        setStatusMessage('Terputus — cuba sambung semula…');
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        reconnectTimerRef.current = setTimeout(() => {
          if (clientRef.current === obs && !obs.isManualClose) {
            connectRealObs(cfg, true);
          }
        }, 6000);
      };

      bindClientEvents(obs, false, () => {
        addToast('Sambungan ke OBS terputus. Mencuba semula dalam 6 saat.', 'warn');
        scheduleReconnect();
      });

      const url = `ws://${cfg.host}:${cfg.port}`;
      try {
        await obs.connect(url, cfg.pass);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal menyambung ke OBS.';
        if (err instanceof ObsAuthError) {
          setPhase('auth_error');
          setStatusMessage('Kata laluan salah');
          setConnError('Kata laluan salah');
          addToast('Kata laluan salah. Semak kata laluan WebSocket dalam OBS.', 'bad');
          return false;
        }
        setPhase('error');
        setStatusMessage('Tidak bersambung');
        setConnError(msg);
        if (!isAutoReconnect) {
          addToast(msg, 'bad');
        }
        if (!obs.isManualClose) {
          scheduleReconnect();
        }
        return false;
      }

      saveConnection(cfg);
      setPhase('connected');
      setStatusMessage('Bersambung ke OBS');
      setConnError(null);
      recordLog('connection', 'Bersambung ke OBS Studio', `${cfg.host}:${cfg.port}`);
      if (!isAutoReconnect) {
        addToast('Berjaya bersambung ke OBS Studio.', 'ok');
      }

      await Promise.all([loadScenes(obs), loadInputs(obs), pollStatus(obs)]);
      pollTimerRef.current = setInterval(() => pollStatus(obs), 1200);
      return true;
    },
    [
      addToast,
      bindClientEvents,
      clearClientTimersAndSubs,
      loadInputs,
      loadScenes,
      pollStatus,
    ]
  );

  // Startup flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      startDemoMode();
      return () => disconnect(false);
    }

    const saved = loadSavedConnection();
    if (saved && saved.rem && saved.host) {
      connectRealObs(saved, false).then((ok) => {
        if (!ok) {
          setDialogOpen(true);
        }
      });
    } else {
      startDemoMode();
    }

    return () => {
      clearClientTimersAndSubs();
      if (clientRef.current) {
        clientRef.current.close();
        clientRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const callSafe = async <T = Record<string, unknown>>(
    requestType: string,
    requestData: Record<string, unknown> = {},
    errorPrefix = 'Ralat'
  ): Promise<T | null> => {
    const client = clientRef.current;
    if (!client || !client.isConnected) {
      addToast('Belum bersambung ke OBS.', 'warn');
      return null;
    }
    try {
      return await client.call<T>(requestType, requestData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Permintaan gagal';
      addToast(`${errorPrefix}: ${msg}`, 'bad');
      return null;
    }
  };

  // Actions
  const handleStartStream = async () => {
    const res = await callSafe('StartStream', {}, 'Gagal mula siaran');
    if (res !== null) {
      setStreaming(true);
      recordLog(
        'stream',
        'Siaran Dimulakan',
        phase === 'demo' ? 'Mod Demo' : `Paparan: ${currentScene || '–'}`
      );
      addToast(
        phase === 'demo'
          ? 'Demo: Siaran contoh dimulakan.'
          : 'Siaran langsung telah dimulakan.',
        'ok'
      );
    }
  };

  const handleStopStream = async () => {
    const res = await callSafe('StopStream', {}, 'Gagal tamat siaran');
    if (res !== null) {
      setStreaming(false);
      setDurationMs(0);
      recordLog('stream', 'Siaran Ditamatkan', `Paparan akhir: ${currentScene || '–'}`);
      addToast('Siaran telah ditamatkan.', 'ok');
    }
  };

  const handleToggleRecord = async () => {
    const req = recording ? 'StopRecord' : 'StartRecord';
    const res = await callSafe(req, {}, 'Gagal tukar rakaman');
    if (res !== null) {
      const next = !recording;
      setRecording(next);
      recordLog('stream', next ? 'Rakaman Dimulakan' : 'Rakaman Dihentikan');
      addToast(recording ? 'Rakaman dihentikan.' : 'Rakaman dimulakan.', 'ok');
    }
  };

  const handleSelectScene = async (sceneName: string) => {
    const prevScene = currentScene;
    const res = await callSafe(
      'SetCurrentProgramScene',
      { sceneName },
      'Gagal tukar paparan'
    );
    if (res !== null) {
      setCurrentScene(sceneName);
      currentSceneRef.current = sceneName;
      recordLog('scene', 'Paparan Ditukar', prevScene ? `${prevScene} → ${sceneName}` : sceneName);
      if (clientRef.current) {
        await loadItemsForScene(clientRef.current, sceneName);
      }
    }
  };

  const handleToggleItem = async (sceneItemId: number, enabled: boolean) => {
    const targetItem = sceneItems.find((i) => i.sceneItemId === sceneItemId);
    const res = await callSafe(
      'SetSceneItemEnabled',
      {
        sceneName: currentScene,
        sceneItemId,
        sceneItemEnabled: enabled,
      },
      'Gagal tukar lapisan'
    );
    if (res !== null) {
      setSceneItems((prev) =>
        prev.map((item) =>
          item.sceneItemId === sceneItemId
            ? { ...item, sceneItemEnabled: enabled }
            : item
        )
      );
      if (targetItem) {
        recordLog(
          'layer',
          'Lapisan Diubah',
          `${targetItem.sourceName}: ${enabled ? 'HIDUP' : 'MATI'}`
        );
      }
    }
  };

  const handleApplyTemplate = async (template: OutputTemplate) => {
    const client = clientRef.current;
    if (!client || !client.isConnected) return;

    let targetScene = currentScene;
    let activeItems = sceneItems;

    // Optionally switch to matching scene if pattern matches and differs
    if (template.preferredScenePattern) {
      const matchedScene = scenes.find((s) => template.preferredScenePattern!.test(s));
      if (matchedScene && matchedScene !== currentScene) {
        const switched = await callSafe(
          'SetCurrentProgramScene',
          { sceneName: matchedScene },
          'Gagal tukar paparan template'
        );
        if (switched !== null) {
          targetScene = matchedScene;
          setCurrentScene(matchedScene);
          currentSceneRef.current = matchedScene;
          activeItems = await loadItemsForScene(client, matchedScene);
        }
      }
    }

    const actions = resolveTemplateLayerActions(activeItems, template);
    for (const act of actions) {
      await callSafe(
        'SetSceneItemEnabled',
        {
          sceneName: targetScene,
          sceneItemId: act.sceneItemId,
          sceneItemEnabled: act.targetEnabled,
        },
        `Gagal kemas kini ${act.sourceName}`
      );
    }

    await loadItemsForScene(client, targetScene);
    recordLog('template', 'Template Digunakan', `${template.name} (${targetScene})`);
    addToast(`Template "${template.name}" digunakan.`, 'ok');
  };

  const handleQuickToggleCategory = async (category: LayerCategory, enable: boolean) => {
    const matching = sceneItems.filter((item) => classifySceneItem(item.sourceName) === category);
    if (matching.length === 0) {
      addToast(`Tiada lapisan "${category}" dijumpai dalam paparan semasa.`, 'warn');
      return;
    }
    for (const item of matching) {
      await handleToggleItem(item.sceneItemId, enable);
    }
  };

  const handleSendText = async (values: TextDraft) => {
    const keys: TextFieldKey[] = ['Tajuk', 'Penceramah', 'Berjalan'];
    let updated = 0;
    for (const key of keys) {
      const targetName = mapping[key];
      if (!targetName) continue;
      const res = await callSafe(
        'SetInputSettings',
        {
          inputName: targetName,
          inputSettings: { text: values[key] },
          overlay: true,
        },
        `Gagal kemas kini ${key}`
      );
      if (res !== null) updated++;
    }
    if (updated === 0) {
      addToast(
        'Tiada sumber teks OBS dipetakan. Buka bahagian Lanjutan untuk memilih.',
        'warn'
      );
    } else {
      const isClearing = !values.Tajuk && !values.Penceramah && !values.Berjalan;
      recordLog(
        'text',
        isClearing ? 'Teks Skrin Dikosongkan' : 'Teks Dihantar ke Skrin',
        isClearing ? undefined : values.Tajuk || values.Penceramah || 'Teks Berjalan'
      );
      addToast(`${updated} paparan teks berjaya dihantar ke skrin.`, 'ok');
    }
  };

  const handleClearScreen = async () => {
    await handleSendText({ Tajuk: '', Penceramah: '', Berjalan: '' });
  };

  const handleToggleMute = async (inputName: string, nextMuted: boolean) => {
    const res = await callSafe(
      'SetInputMute',
      { inputName, inputMuted: nextMuted },
      'Gagal tukar Mute'
    );
    if (res !== null) {
      setAudioInputs((prev) =>
        prev.map((a) => (a.name === inputName ? { ...a, muted: nextMuted } : a))
      );
      recordLog('audio', nextMuted ? 'Audio Disenyapkan' : 'Audio Dihidupkan', inputName);
    }
  };

  const handleVolumeChange = async (inputName: string, db: number) => {
    setAudioInputs((prev) =>
      prev.map((a) => (a.name === inputName ? { ...a, db } : a))
    );
    await callSafe(
      'SetInputVolume',
      { inputName, inputVolumeDb: db },
      'Gagal laras kelantangan'
    );
  };

  const handleMonitorChange = async (inputName: string, monitorType: MonitorType) => {
    const res = await callSafe(
      'SetInputAudioMonitorType',
      { inputName, monitorType },
      'Gagal tukar Monitor'
    );
    if (res !== null) {
      setAudioInputs((prev) =>
        prev.map((a) => (a.name === inputName ? { ...a, monitorType } : a))
      );
      if (monitorType === 'OBS_MONITORING_TYPE_NONE') {
        recordLog('audio', 'Monitor Dimatikan', inputName);
        addToast(`Monitor dimatikan untuk ${inputName}.`, 'ok');
      } else {
        recordLog('audio', 'Monitor Diubah', `${inputName}: ${monitorType}`);
      }
    }
  };

  const handleDisableAllMonitors = async (inputNames: string[]) => {
    for (const name of inputNames) {
      await handleMonitorChange(name, 'OBS_MONITORING_TYPE_NONE');
    }
  };

  const isConnected = phase === 'connected' || phase === 'demo';
  const spacingClass =
    styleConfig.layout === 'studio' ? 'space-y-3.5 py-4' : 'space-y-5 py-6';

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <TopBar
        mosqueName={mosqueName}
        onMosqueNameChange={(name) => {
          setMosqueName(name);
          saveMosqueName(name);
        }}
        phase={phase}
        statusMessage={statusMessage}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onOpenLog={() => setLogDrawerOpen(true)}
        onOpenStyleSettings={() => setStyleDialogOpen(true)}
        onOpenSettings={() => setDialogOpen(true)}
      />

      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 ${spacingClass}`}>
        {/* Kad 1: Siaran */}
        <LiveCard
          connected={isConnected}
          streaming={streaming}
          recording={recording}
          durationMs={durationMs}
          skippedFrames={skippedFrames}
          totalFrames={totalFrames}
          cpuUsage={cpuUsage}
          fps={fps}
          checklistCompleted={ticks.length}
          checklistTotal={CHECKLIST_ITEMS.length}
          onStartStream={handleStartStream}
          onStopStream={handleStopStream}
          onToggleRecord={handleToggleRecord}
        />

        {/* Pratonton Skrin Siaran & Pilihan Template Keluar */}
        {styleConfig.showPreview && (
          <PreviewTemplatesCard
            connected={isConnected}
            streaming={streaming}
            mosqueName={mosqueName}
            currentScene={currentScene}
            sceneItems={sceneItems}
            draft={draft}
            overlayStyle={styleConfig.overlayStyle}
            onOverlayStyleChange={(overlayStyle) =>
              setStyleConfig((prev) => ({ ...prev, overlayStyle }))
            }
            qrInfo={qrInfo}
            onQrInfoChange={(info) => {
              setQrInfo(info);
              saveQrInfo(info);
            }}
            onApplyTemplate={handleApplyTemplate}
            onQuickToggleCategory={handleQuickToggleCategory}
          />
        )}

        {/* Kad 2: Pilih Paparan + Senarai Semak */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className={styleConfig.showChecklist ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <ScenesCard
              connected={isConnected}
              scenes={scenes}
              currentScene={currentScene}
              onSelectScene={handleSelectScene}
            />
          </div>
          {styleConfig.showChecklist && (
            <div className="lg:col-span-5">
              <ChecklistCard
                ticks={ticks}
                onToggleTick={(idx) => {
                  setTicks((prev) => {
                    const set = new Set(prev);
                    if (set.has(idx)) set.delete(idx);
                    else set.add(idx);
                    const next = Array.from(set).sort((a, b) => a - b);
                    saveChecklistTicks(next);
                    return next;
                  });
                }}
                onReset={() => {
                  setTicks([]);
                  saveChecklistTicks([]);
                }}
              />
            </div>
          )}
        </div>

        {/* Kad 3: Tajuk & Penceramah + Kad 4: Logo & Lapisan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-6">
            <TextOverlayCard
              connected={isConnected}
              draft={draft}
              onDraftChange={(next) => {
                setDraft(next);
                saveTextDraft(next);
              }}
              availableTextInputs={textInputNames}
              mapping={mapping}
              onMappingChange={(next) => {
                setMapping(next);
                saveTextMapping(next);
              }}
              presets={presets}
              onSavePreset={(name) => {
                setPresets((prev) => {
                  const next = [
                    ...prev.filter((p) => p.name !== name),
                    { name, ...draft },
                  ];
                  savePresets(next);
                  return next;
                });
                addToast(`Preset "${name}" disimpan.`, 'ok');
              }}
              onDeletePreset={(name) => {
                setPresets((prev) => {
                  const next = prev.filter((p) => p.name !== name);
                  savePresets(next);
                  return next;
                });
                addToast(`Preset "${name}" dipadam.`, 'info');
              }}
              onSendToScreen={handleSendText}
              onClearScreen={handleClearScreen}
            />
          </div>
          <div className="lg:col-span-6">
            <LayersCard
              connected={isConnected}
              currentScene={currentScene}
              items={sceneItems}
              onToggleItem={handleToggleItem}
            />
          </div>
        </div>

        {/* Kad 5: Audio */}
        <AudioCard
          connected={isConnected}
          audioInputs={audioInputs}
          meterLevelsRef={meterLevelsRef}
          onToggleMute={handleToggleMute}
          onVolumeChange={handleVolumeChange}
          onMonitorChange={handleMonitorChange}
          onDisableAllMonitors={handleDisableAllMonitors}
        />

        {/* Panduan Ringkas */}
        {styleConfig.showGuide && <GuideCard />}
      </main>

      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 pb-8 pt-2 text-center text-sm text-stone-600 dark:text-stone-400">
        {mosqueName} · Panel kawalan OBS tempatan (tanpa pelayan luar atau internet pihak ketiga).
      </footer>

      <ConnectionDialog
        open={dialogOpen}
        initialConfig={savedConfig}
        isConnected={phase === 'connected'}
        isDemo={phase === 'demo'}
        errorMsg={connError}
        onClose={() => setDialogOpen(false)}
        onConnectObs={(cfg) => connectRealObs(cfg, false)}
        onDisconnect={() => disconnect(true)}
        onStartDemo={startDemoMode}
      />

      <StyleCustomizerDialog
        open={styleDialogOpen}
        config={styleConfig}
        onChange={setStyleConfig}
        onClose={() => setStyleDialogOpen(false)}
      />

      <BroadcastLogDrawer
        open={logDrawerOpen}
        mosqueName={mosqueName}
        entries={logs}
        onClose={() => setLogDrawerOpen(false)}
        onClear={() => {
          setLogs([]);
          saveBroadcastLogs([]);
          addToast('Rekod siaran telah dikosongkan.', 'info');
        }}
      />

      <TooltipManager />

      {/* Toast stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 max-w-[min(380px,calc(100vw-2rem))]"
      >
        {toasts.map((t) => {
          const style =
            t.tone === 'bad'
              ? 'bg-red-800 text-white border-red-900'
              : t.tone === 'ok'
              ? 'bg-emerald-800 text-white border-emerald-900'
              : t.tone === 'warn'
              ? 'bg-amber-700 text-white border-amber-800'
              : 'bg-stone-900 text-white border-stone-700';
          return (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${style}`}
            >
              {t.message}
            </div>
          );
        })}
      </div>
    </div>
  );
}
