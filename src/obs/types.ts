export type MonitorType =
  | 'OBS_MONITORING_TYPE_NONE'
  | 'OBS_MONITORING_TYPE_MONITOR_ONLY'
  | 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT';

export type ConnectionPhase =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'demo'
  | 'reconnecting'
  | 'auth_error'
  | 'error';

export interface ObsScene {
  sceneName: string;
  sceneIndex: number;
}

export interface ObsSceneItem {
  sceneItemId: number;
  sourceName: string;
  sceneItemEnabled: boolean;
  inputKind?: string;
}

export interface ObsInput {
  inputName: string;
  inputKind: string;
}

export interface ObsAudioInput {
  name: string;
  kind: string;
  muted: boolean;
  db: number;
  monitorType: MonitorType;
}

export interface ObsStreamStatus {
  outputActive: boolean;
  outputDuration: number;
  outputSkippedFrames: number;
  outputTotalFrames: number;
}

export interface ObsRecordStatus {
  outputActive: boolean;
  outputDuration: number;
}

export interface ObsStats {
  cpuUsage: number;
  activeFps: number;
}

export interface ObsEventMap {
  close: { code?: number; reason?: string; authFailed?: boolean };
  CurrentProgramSceneChanged: { sceneName: string };
  SceneListChanged: { scenes?: ObsScene[] };
  SceneItemEnableStateChanged: {
    sceneName: string;
    sceneItemId: number;
    sceneItemEnabled: boolean;
  };
  StreamStateChanged: { outputActive: boolean; outputState?: string };
  RecordStateChanged: { outputActive: boolean; outputState?: string };
  InputMuteStateChanged: { inputName: string; inputMuted: boolean };
  InputVolumeChanged: { inputName: string; inputVolumeDb: number; inputVolumeMul?: number };
  InputAudioMonitorTypeChanged?: { inputName: string; monitorType: MonitorType };
  InputCreated: { inputName: string; inputKind: string };
  InputRemoved: { inputName: string };
  InputNameChanged: { oldInputName: string; inputName: string };
  InputVolumeMeters: {
    inputs: Array<{
      inputName: string;
      inputLevelsMul: number[][];
    }>;
  };
}

export type ObsEventHandler<K extends keyof ObsEventMap> = (data: ObsEventMap[K]) => void;

export interface IObsClient {
  readonly isConnected: boolean;
  readonly isManualClose: boolean;
  connect(url?: string, password?: string): Promise<void>;
  close(): void;
  call<T = Record<string, unknown>>(
    requestType: string,
    requestData?: Record<string, unknown>
  ): Promise<T>;
  on<K extends keyof ObsEventMap>(event: K, handler: ObsEventHandler<K>): () => void;
}
