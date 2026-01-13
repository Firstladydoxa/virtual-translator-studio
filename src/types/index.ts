export interface User {
  id: string;
  username: string;
  email: string;
  fullname: string;
  country: string;
  language?: {
    label: string;
    value: string;
  };
  role?: 'translator' | 'admin' | 'superadmin' | 'designer';
}

export interface StreamingDetails {
  language: string;
  rtmpServer: string;
  streamKey: string;
  rtmpUsername: string;
  rtmpPassword: string;
  watchUrl: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  streamingDetails: StreamingDetails;
}

export interface RegisterRequest {
  fullname: string;
  username: string;
  email: string;
  country: string;
  language: string;
  password: string;
}

export interface Language {
  label: string;
  value: string;
}

export type LiveStatus = 'offline' | 'connecting' | 'online';

export type MessageType = 'info' | 'success' | 'error';
