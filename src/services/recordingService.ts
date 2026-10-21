import api from './api';

export interface ServerRecording {
  id: string;
  language: string;
  title: string;
  durationSeconds: number;
  sizeBytes: number;
  mimeType: string;
  startedAt?: string;
  createdAt: string;
}

export const recordingService = {
  upload: async (
    blob: Blob,
    info: { durationSeconds: number; language: string; startedAt: number; title?: string },
    onProgress?: (percent: number) => void
  ): Promise<ServerRecording> => {
    const form = new FormData();
    form.append('audio', blob, `recording.${blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm'}`);
    form.append('durationSeconds', String(info.durationSeconds));
    form.append('language', info.language);
    form.append('startedAt', new Date(info.startedAt).toISOString());
    if (info.title) form.append('title', info.title);

    const response = await api.post<{ recording: ServerRecording }>('/api/recordings', form, {
      // Let the browser set the multipart boundary
      headers: { 'Content-Type': undefined },
      timeout: 10 * 60 * 1000,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    return response.data.recording;
  },

  list: async (): Promise<ServerRecording[]> => {
    const response = await api.get<{ recordings: ServerRecording[] }>('/api/recordings', { params: { limit: 20 } });
    return response.data.recordings;
  },

  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/api/recordings/${id}/download`, { responseType: 'blob' });
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/recordings/${id}`);
  }
};
