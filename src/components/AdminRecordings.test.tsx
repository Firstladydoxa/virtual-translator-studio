import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminRecordings from './AdminRecordings';
import { recordingService } from '../services/recordingService';

jest.mock('../services/recordingService', () => ({
  recordingService: { adminList: jest.fn(), download: jest.fn(), remove: jest.fn() }
}));

const rec = (id: string, name: string, language: string) => ({
  id,
  translatorName: name,
  languageLabel: language,
  language: language.toLowerCase(),
  title: '',
  durationSeconds: 125,
  sizeBytes: 2 * 1024 * 1024,
  mimeType: 'audio/webm',
  createdAt: '2026-10-20T10:30:00.000Z'
});

const list = (recordings: any[]) => ({
  recordings,
  total: recordings.length,
  page: 1,
  pages: 1,
  totalSizeBytes: 4 * 1024 * 1024,
  totalDurationSeconds: 250,
  languages: ['french', 'german']
});

beforeEach(() => {
  (recordingService.adminList as jest.Mock).mockResolvedValue(list([rec('1', 'Olivia Owner', 'French'), rec('2', 'Otto Other', 'German')]));
  (recordingService.remove as jest.Mock).mockResolvedValue(undefined);
  (recordingService.download as jest.Mock).mockResolvedValue(new Blob(['x'], { type: 'audio/webm' }));
  (global as any).URL.createObjectURL = jest.fn(() => 'blob:test');
  (global as any).URL.revokeObjectURL = jest.fn();
});

test('lists recordings with translator, language and date', async () => {
  render(<AdminRecordings />);
  expect(await screen.findByText('Olivia Owner')).toBeInTheDocument();
  expect(screen.getByText('Otto Other')).toBeInTheDocument();
  expect(screen.getByText('French')).toBeInTheDocument();
  expect(screen.getAllByText('02:05').length).toBe(2);
  expect(screen.getByText('Total size')).toBeInTheDocument();
});

test('plays a recording through an authenticated download', async () => {
  render(<AdminRecordings />);
  await screen.findByText('Olivia Owner');
  fireEvent.click(screen.getAllByText(/Play/)[0]);
  await waitFor(() => expect(recordingService.download).toHaveBeenCalledWith('1'));
  expect(await screen.findByText(/Close/)).toBeInTheDocument();
});

test('deletes only after confirmation', async () => {
  const confirm = jest.spyOn(window, 'confirm');
  render(<AdminRecordings />);
  await screen.findByText('Olivia Owner');
  const row = screen.getAllByRole('row')[1];

  confirm.mockReturnValueOnce(false);
  fireEvent.click(within(row).getByText(/Delete/));
  expect(recordingService.remove).not.toHaveBeenCalled();

  confirm.mockReturnValueOnce(true);
  fireEvent.click(within(row).getByText(/Delete/));
  await waitFor(() => expect(recordingService.remove).toHaveBeenCalledWith('1'));
  expect(await screen.findByText('Recording deleted.')).toBeInTheDocument();
  confirm.mockRestore();
});

test('filters by language', async () => {
  render(<AdminRecordings />);
  await screen.findByText('Olivia Owner');
  fireEvent.change(screen.getByLabelText('Filter by language'), { target: { value: 'german' } });
  await waitFor(() =>
    expect(recordingService.adminList).toHaveBeenLastCalledWith(expect.objectContaining({ language: 'german', page: 1 }))
  );
});

test('shows a permission message for non-admins', async () => {
  (recordingService.adminList as jest.Mock).mockRejectedValue({ response: { status: 403 } });
  render(<AdminRecordings />);
  expect(await screen.findByText(/do not have permission/)).toBeInTheDocument();
});

test('shows an empty state', async () => {
  (recordingService.adminList as jest.Mock).mockResolvedValue(list([]));
  render(<AdminRecordings />);
  expect(await screen.findByText('No recordings yet.')).toBeInTheDocument();
});
