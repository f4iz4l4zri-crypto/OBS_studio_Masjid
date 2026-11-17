import {
  IObsClient,
  MonitorType,
  ObsEventHandler,
  ObsEventMap,
  ObsSceneItem,
} from './types';

export class MockObs implements IObsClient {
  private listeners = new Map<keyof ObsEventMap, Set<(data: never) => void>>();
  private connected = false;
  private manual = false;
  private meterTimer: ReturnType<typeof setInterval> | null = null;
  private phase = 0;

  private currentScene = 'KULIAH PERDANA';
  private readonly scenes = [
    'SEBENTAR LAGI',
    'INFAQ & PENGUMUMAN',
    'KHUTBAH JUMAAT',
    'KULIAH PERDANA',
  ];

  private sceneItems: Record<string, ObsSceneItem[]> = {};
  private readonly inputs: Array<{ inputName: string; inputKind: string }> = [
    { inputName: 'Kamera PTZ Mimbar', inputKind: 'ffmpeg_source' },
    { inputName: 'Logo Masjid', inputKind: 'image_source' },
    { inputName: 'Teks Tajuk', inputKind: 'text_gdiplus_v3' },
    { inputName: 'Teks Penceramah', inputKind: 'text_gdiplus_v3' },
    { inputName: 'Teks Berjalan', inputKind: 'text_gdiplus_v3' },
    { inputName: 'QR Jom Infaq', inputKind: 'image_source' },
    { inputName: 'Mixer USB (Mic/Aux)', inputKind: 'wasapi_input_capture' },
    { inputName: 'Audio PC (Desktop)', inputKind: 'wasapi_output_capture' },
  ];

  private mutes: Record<string, boolean> = {
    'Mixer USB (Mic/Aux)': false,
    'Audio PC (Desktop)': true,
    'Kamera PTZ Mimbar': true,
  };

  private volumesDb: Record<string, number> = {
    'Mixer USB (Mic/Aux)': -6,
    'Audio PC (Desktop)': 0,
    'Kamera PTZ Mimbar': 0,
  };

  // Intentionally set Audio PC monitor to MONITOR_AND_OUTPUT initially
  // so users can verify the red monitor warning and fix button in Demo Mode.
  private monitorTypes: Record<string, MonitorType> = {
    'Mixer USB (Mic/Aux)': 'OBS_MONITORING_TYPE_NONE',
    'Audio PC (Desktop)': 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT',
    'Kamera PTZ Mimbar': 'OBS_MONITORING_TYPE_NONE',
  };

  private textValues: Record<string, string> = {
    'Teks Tajuk': 'Kuliah Maghrib — Tafsir Surah Al-Kahfi',
    'Teks Penceramah': 'Ustaz Mohd Yasin',
    'Teks Berjalan': 'Selamat datang ke siaran langsung Masjid Jeram. Jom infaq melalui kod QR.',
  };

  private streaming = false;
  private streamStartMs = 0;
  private recording = false;
  private recordStartMs = 0;

  constructor() {
    this.scenes.forEach((sceneName) => {
      this.sceneItems[sceneName] = [
        {
          sceneItemId: 1,
          sourceName: 'Kamera PTZ Mimbar',
          sceneItemEnabled: sceneName !== 'SEBENTAR LAGI',
          inputKind: 'ffmpeg_source',
        },
        {
          sceneItemId: 2,
          sourceName: 'Logo Masjid',
          sceneItemEnabled: true,
          inputKind: 'image_source',
        },
        {
          sceneItemId: 3,
          sourceName: 'Teks Tajuk',
          sceneItemEnabled: true,
          inputKind: 'text_gdiplus_v3',
        },
        {
          sceneItemId: 4,
          sourceName: 'Teks Penceramah',
          sceneItemEnabled: sceneName !== 'SEBENTAR LAGI',
          inputKind: 'text_gdiplus_v3',
        },
        {
          sceneItemId: 5,
          sourceName: 'Teks Berjalan',
          sceneItemEnabled: true,
          inputKind: 'text_gdiplus_v3',
        },
        {
          sceneItemId: 6,
          sourceName: 'QR Jom Infaq',
          sceneItemEnabled: sceneName !== 'KHUTBAH JUMAAT',
          inputKind: 'image_source',
        },
      ];
    });
  }

  get isConnected(): boolean {
    return this.connected;
  }

  get isManualClose(): boolean {
    return this.manual;
  }

  on<K extends keyof ObsEventMap>(event: K, handler: ObsEventHandler<K>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const wrapped = handler as (data: never) => void;
    set.add(wrapped);
    return () => {
      set?.delete(wrapped);
    };
  }

  private emit<K extends keyof ObsEventMap>(event: K, data: ObsEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((fn) => {
      try {
        (fn as ObsEventHandler<K>)(data);
      } catch (err) {
        console.error(err);
      }
    });
  }

  async connect(): Promise<void> {
    this.manual = false;
    await new Promise((r) => setTimeout(r, 150));
    this.connected = true;
    this.meterTimer = setInterval(() => this.emitMeters(), 100);
  }

  close(): void {
    this.manual = true;
    this.connected = false;
    if (this.meterTimer) {
      clearInterval(this.meterTimer);
      this.meterTimer = null;
    }
  }

  private emitMeters(): void {
    if (!this.connected) return;
    this.phase += 0.38;
    const speechWave = Math.max(0, Math.sin(this.phase) * 0.45 + Math.sin(this.phase * 2.3) * 0.18 + 0.45);
    const audioNames = ['Mixer USB (Mic/Aux)', 'Audio PC (Desktop)', 'Kamera PTZ Mimbar'];

    const inputs = audioNames.map((name) => {
      const muted = !!this.mutes[name];
      if (muted) {
        return {
          inputName: name,
          inputLevelsMul: [
            [0.0001, 0.0001, 0.0001],
            [0.0001, 0.0001, 0.0001],
          ],
        };
      }
      const volDb = this.volumesDb[name] ?? 0;
      const targetDb = volDb - 28 + speechWave * (24 + Math.random() * 5);
      const lin = Math.max(0.0005, Math.min(0.98, Math.pow(10, targetDb / 20)));
      const linR = Math.max(0.0005, Math.min(0.98, lin * (0.9 + Math.random() * 0.14)));
      return {
        inputName: name,
        inputLevelsMul: [
          [lin * 0.85, lin, lin],
          [linR * 0.85, linR, linR],
        ],
      };
    });

    this.emit('InputVolumeMeters', { inputs });
  }

  async call<T = Record<string, unknown>>(
    requestType: string,
    requestData: Record<string, unknown> = {}
  ): Promise<T> {
    if (!this.connected) {
      throw new Error('Mod Demo belum disambungkan.');
    }
    await new Promise((r) => setTimeout(r, 20));

    switch (requestType) {
      case 'GetSceneList':
        return {
          currentProgramSceneName: this.currentScene,
          scenes: this.scenes.map((sceneName, sceneIndex) => ({ sceneName, sceneIndex })),
        } as T;

      case 'SetCurrentProgramScene': {
        const sceneName = String(requestData.sceneName || '');
        if (!this.scenes.includes(sceneName)) {
          throw new Error(`Paparan "${sceneName}" tidak dijumpai.`);
        }
        this.currentScene = sceneName;
        this.emit('CurrentProgramSceneChanged', { sceneName });
        return {} as T;
      }

      case 'GetSceneItemList': {
        const sceneName = String(requestData.sceneName || this.currentScene);
        const list = (this.sceneItems[sceneName] || []).map((item) => ({ ...item }));
        return { sceneItems: list } as T;
      }

      case 'SetSceneItemEnabled': {
        const sceneName = String(requestData.sceneName || this.currentScene);
        const sceneItemId = Number(requestData.sceneItemId);
        const sceneItemEnabled = Boolean(requestData.sceneItemEnabled);
        const list = this.sceneItems[sceneName] || [];
        const target = list.find((item) => item.sceneItemId === sceneItemId);
        if (target) {
          target.sceneItemEnabled = sceneItemEnabled;
          this.emit('SceneItemEnableStateChanged', {
            sceneName,
            sceneItemId,
            sceneItemEnabled,
          });
        }
        return {} as T;
      }

      case 'GetInputList':
        return { inputs: this.inputs.map((i) => ({ ...i })) } as T;

      case 'GetInputSettings': {
        const inputName = String(requestData.inputName || '');
        return { inputSettings: { text: this.textValues[inputName] ?? '' } } as T;
      }

      case 'SetInputSettings': {
        const inputName = String(requestData.inputName || '');
        const settings = (requestData.inputSettings ?? {}) as Record<string, unknown>;
        if ('text' in settings) {
          this.textValues[inputName] = String(settings.text ?? '');
        }
        return {} as T;
      }

      case 'GetInputMute': {
        const inputName = String(requestData.inputName || '');
        return { inputMuted: Boolean(this.mutes[inputName]) } as T;
      }

      case 'SetInputMute': {
        const inputName = String(requestData.inputName || '');
        const inputMuted = Boolean(requestData.inputMuted);
        this.mutes[inputName] = inputMuted;
        this.emit('InputMuteStateChanged', { inputName, inputMuted });
        return {} as T;
      }

      case 'GetInputVolume': {
        const inputName = String(requestData.inputName || '');
        const db = this.volumesDb[inputName] ?? 0;
        return { inputVolumeDb: db, inputVolumeMul: Math.pow(10, db / 20) } as T;
      }

      case 'SetInputVolume': {
        const inputName = String(requestData.inputName || '');
        const db = Number(requestData.inputVolumeDb ?? 0);
        this.volumesDb[inputName] = db;
        this.emit('InputVolumeChanged', {
          inputName,
          inputVolumeDb: db,
          inputVolumeMul: Math.pow(10, db / 20),
        });
        return {} as T;
      }

      case 'GetInputAudioMonitorType': {
        const inputName = String(requestData.inputName || '');
        return {
          monitorType: this.monitorTypes[inputName] ?? 'OBS_MONITORING_TYPE_NONE',
        } as T;
      }

      case 'SetInputAudioMonitorType': {
        const inputName = String(requestData.inputName || '');
        const monitorType = requestData.monitorType as MonitorType;
        this.monitorTypes[inputName] = monitorType;
        return {} as T;
      }

      case 'GetStreamStatus': {
        const dur = this.streaming ? Date.now() - this.streamStartMs : 0;
        const total = this.streaming ? Math.max(1, Math.floor(dur / 33)) : 0;
        const skipped = this.streaming ? Math.floor(total * 0.004) : 0;
        return {
          outputActive: this.streaming,
          outputDuration: dur,
          outputSkippedFrames: skipped,
          outputTotalFrames: total,
        } as T;
      }

      case 'GetRecordStatus': {
        const dur = this.recording ? Date.now() - this.recordStartMs : 0;
        return {
          outputActive: this.recording,
          outputDuration: dur,
        } as T;
      }

      case 'GetStats':
        return {
          cpuUsage: 7.4 + Math.random() * 2.5,
          activeFps: 30,
        } as T;

      case 'StartStream':
        this.streaming = true;
        this.streamStartMs = Date.now();
        this.emit('StreamStateChanged', {
          outputActive: true,
          outputState: 'OBS_WEBSOCKET_OUTPUT_STARTED',
        });
        return {} as T;

      case 'StopStream':
        this.streaming = false;
        this.emit('StreamStateChanged', {
          outputActive: false,
          outputState: 'OBS_WEBSOCKET_OUTPUT_STOPPED',
        });
        return {} as T;

      case 'StartRecord':
        this.recording = true;
        this.recordStartMs = Date.now();
        this.emit('RecordStateChanged', {
          outputActive: true,
          outputState: 'OBS_WEBSOCKET_OUTPUT_STARTED',
        });
        return {} as T;

      case 'StopRecord':
        this.recording = false;
        this.emit('RecordStateChanged', {
          outputActive: false,
          outputState: 'OBS_WEBSOCKET_OUTPUT_STOPPED',
        });
        return { outputPath: 'demo_rakaman.mkv' } as T;

      default:
        throw new Error(`Permintaan "${requestType}" tidak disokong dalam Mod Demo.`);
    }
  }
}
