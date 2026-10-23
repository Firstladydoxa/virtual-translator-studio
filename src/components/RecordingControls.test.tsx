import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecordingControls from './RecordingControls';
import { recordingService } from '../services/recordingService';
import { recordingStore } from '../services/recordingStore';

jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
jest.mock('../services/recordingService', () => ({
  recordingService: { upload: jest.fn(), list: jest.fn(), download: jest.fn(), remove: jest.fn() }
}));
jest.mock('../services/recordingStore', () => ({
  recordingStore: {
    create: jest.fn(),
    appendChunk: jest.fn(),
    updateMeta: jest.fn(),
    list: jest.fn(),
    getBlob: jest.fn(),
    remove: jest.fn()
  }
}));

class FakeRecorder {
  static isTypeSupported = () => true;
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  mimeType = 'audio/webm;codecs=opus';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  start() { this.state = 'recording'; }
  pause() { this.state = 'paused'; }
  resume() { this.state = 'recording'; }
  stop() {
    this.ondataavailable?.({ data: new Blob(['audio-bytes'], { type: 'audio/webm' }) });
    this.state = 'inactive';
    this.onstop?.();
  }
}

const makeTrack = () => {
  const track: any = { readyState: 'live', stop: jest.fn(), onended: null };
  track.clone = () => makeTrack();
  return track;
};
const makeStream = () => ({ getAudioTracks: () => [makeTrack()] } as unknown as MediaStream);

beforeEach(() => {
  (global as any).MediaRecorder = FakeRecorder;
  (global as any).MediaStream = function () { return {}; };
  // CRA resets mock implementations before every test, so set them here
  (recordingStore.create as jest.Mock).mockResolvedValue(undefined);
  (recordingStore.appendChunk as jest.Mock).mockResolvedValue(undefined);
  (recordingStore.updateMeta as jest.Mock).mockResolvedValue(undefined);
  (recordingStore.remove as jest.Mock).mockResolvedValue(undefined);
  (recordingStore.list as jest.Mock).mockResolvedValue([]);
});

test('records and uploads, then clears the local backup', async () => {
  (recordingService.upload as jest.Mock).mockResolvedValue({ id: '1' });
  render(<RecordingControls getStream={makeStream} language="French" />);

  fireEvent.click(screen.getByText(/Start Recording/));
  expect(await screen.findByText('Recording')).toBeInTheDocument();

  fireEvent.click(screen.getByText(/Pause/));
  expect(screen.getByText('Paused')).toBeInTheDocument();
  fireEvent.click(screen.getByText(/Resume/));

  fireEvent.click(screen.getByText(/Stop & Save/));

  await waitFor(() => expect(recordingService.upload).toHaveBeenCalledTimes(1));
  const [blob, info] = (recordingService.upload as jest.Mock).mock.calls[0];
  expect(blob.size).toBeGreaterThan(0);
  expect(info.language).toBe('French');
  await waitFor(() => expect(recordingStore.remove).toHaveBeenCalled());
  expect(await screen.findByText(/Recording saved successfully/)).toBeInTheDocument();
});

test('keeps the local copy when the upload fails', async () => {
  (recordingService.upload as jest.Mock).mockRejectedValue({ response: { data: { error: 'Server down' } } });
  render(<RecordingControls getStream={makeStream} language="French" />);

  fireEvent.click(screen.getByText(/Start Recording/));
  await screen.findByText('Recording');
  fireEvent.click(screen.getByText(/Stop & Save/));

  expect(await screen.findByText(/Server down/)).toBeInTheDocument();
  expect(recordingStore.remove).not.toHaveBeenCalled();
});

test('shows an error and does not record without a microphone', async () => {
  render(<RecordingControls getStream={() => null} language="French" />);
  fireEvent.click(screen.getByText(/Start Recording/));
  expect(await screen.findByText(/select a microphone first/)).toBeInTheDocument();
  expect(screen.queryByText('Recording')).not.toBeInTheDocument();
});

test('offers recovery of unsaved recordings from a previous session', async () => {
  (recordingStore.list as jest.Mock).mockResolvedValue([
    { id: 'old', mimeType: 'audio/webm', language: 'French', startedAt: Date.now() - 1000, durationSeconds: 65, status: 'stopped' }
  ]);
  render(<RecordingControls getStream={makeStream} language="French" />);
  expect(await screen.findByText(/Unsaved recordings on this device/)).toBeInTheDocument();
  expect(screen.getByText(/01:05/)).toBeInTheDocument();
});

test('shows the registered language and uses it for the upload', async () => {
  (recordingService.upload as jest.Mock).mockResolvedValue({ id: '1' });
  render(<RecordingControls getStream={makeStream} language="munga_lelau" />);
  expect(screen.getByText('Munga Lelau')).toBeInTheDocument();

  fireEvent.click(screen.getByText(/Start Recording/));
  await screen.findByText('Recording');
  fireEvent.click(screen.getByText(/Stop & Save/));
  await waitFor(() => expect(recordingService.upload).toHaveBeenCalled());
  expect((recordingService.upload as jest.Mock).mock.calls[0][1].language).toBe('munga_lelau');
});
