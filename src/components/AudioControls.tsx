import React, { useState, useEffect, useRef } from 'react';
import './AudioControls.css';

interface AudioControlsProps {
  onMicrophoneChange: (stream: MediaStream | null) => void;
  isActive: boolean;
}

const AudioControls: React.FC<AudioControlsProps> = ({ onMicrophoneChange, isActive }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  useEffect(() => {
    if (isActive && selectedDevice) {
      startAudioMonitoring();
    } else {
      stopAudioMonitoring();
    }
  }, [isActive]);

  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Media devices not supported. HTTPS required.');
        return;
      }

      // Request permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      await loadDevices();
    } catch (err) {
      console.error('Microphone permission error:', err);
      setError('Microphone access denied. Please grant permissions.');
    }
  };

  const loadDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = allDevices.filter(device => device.kind === 'audioinput');
      setDevices(audioDevices);
      
      if (audioDevices.length === 1) {
        setSelectedDevice(audioDevices[0].deviceId);
        await selectMicrophone(audioDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error loading devices:', err);
      setError('Failed to load audio devices');
    }
  };

  const selectMicrophone = async (deviceId: string) => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (!deviceId) {
        streamRef.current = null;
        onMicrophoneChange(null);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      onMicrophoneChange(stream);
      setError('');
    } catch (err) {
      console.error('Error selecting microphone:', err);
      setError('Failed to access selected microphone');
    }
  };

  const startAudioMonitoring = () => {
    if (!streamRef.current) return;

    audioContextRef.current = new AudioContext();
    const microphone = audioContextRef.current.createMediaStreamSource(streamRef.current);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    microphone.connect(analyserRef.current);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (!analyserRef.current || !isActive) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const level = (average / 255) * 100;
      
      setAudioLevel(level);
      animationRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const stopAudioMonitoring = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedDevice(deviceId);
    selectMicrophone(deviceId);
  };

  return (
    <div className="audio-controls">
      <h3>Audio Input</h3>
      
      {error && <div className="audio-error">{error}</div>}
      
      {!hasPermission ? (
        <button onClick={checkMicrophonePermission} className="btn-secondary">
          Request Microphone Access
        </button>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="microphone">Select Microphone:</label>
            <select
              id="microphone"
              value={selectedDevice}
              onChange={handleDeviceChange}
              disabled={!hasPermission || devices.length === 0}
            >
              <option value="">Select microphone...</option>
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div className="audio-level-container">
            <label>Audio Level:</label>
            <div className="audio-level-bar">
              <div
                className="audio-level-fill"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AudioControls;
