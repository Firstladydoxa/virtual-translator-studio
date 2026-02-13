import * as mediasoupClient from 'mediasoup-client';
import { Device } from 'mediasoup-client';
import { Transport, Producer } from 'mediasoup-client/lib/types';
import { Capacitor } from '@capacitor/core';

const API_URL = Capacitor.isNativePlatform()
  ? 'https://ministryprogs.tniglobal.org'
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://ministryprogs.tniglobal.org');

class WebRTCService {
  private device: Device | null = null;
  private producerTransport: Transport | null = null;
  private videoProducer: Producer | null = null;
  private audioProducer: Producer | null = null;
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async initializeDevice() {
    console.log('🚀 Initializing MediaSoup Device...');
    
    // Get router RTP capabilities
    const { rtpCapabilities } = await this.request('/webrtc/router-capabilities');
    
    // Create device
    this.device = new Device();
    
    // Load device with router capabilities
    await this.device.load({ routerRtpCapabilities: rtpCapabilities });
    
    console.log('✅ Device loaded, can produce:', {
      audio: this.device.canProduce('audio'),
      video: this.device.canProduce('video')
    });
  }

  async createProducerTransport() {
    if (!this.device) {
      throw new Error('Device not initialized');
    }

    console.log('📡 Creating producer transport...');
    
    // Request transport from server
    const transportParams = await this.request('/webrtc/create-producer-transport', 'POST');
    
    // Create transport on device
    this.producerTransport = this.device.createSendTransport(transportParams);
    
    // Handle 'connect' event
    this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        console.log('🔗 Connecting producer transport...');
        await this.request('/webrtc/connect-transport', 'POST', {
          transportId: this.producerTransport!.id,
          dtlsParameters
        });
        callback();
        console.log('✅ Producer transport connected');
      } catch (error) {
        console.error('❌ Error connecting transport:', error);
        errback(error as Error);
      }
    });

    // Handle 'produce' event
    this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        console.log(`🎬 Producing ${kind}...`);
        const { id } = await this.request('/webrtc/produce', 'POST', {
          transportId: this.producerTransport!.id,
          kind,
          rtpParameters
        });
        callback({ id });
        console.log(`✅ ${kind} producer created, ID:`, id);
      } catch (error) {
        console.error(`❌ Error producing ${kind}:`, error);
        errback(error as Error);
      }
    });

    console.log('✅ Producer transport created');
  }

  async produceMedia(stream: MediaStream) {
    if (!this.producerTransport) {
      throw new Error('Producer transport not created');
    }

    console.log('🎥 Starting to produce media...');
    
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    if (!videoTrack || !audioTrack) {
      throw new Error('Stream must contain both video and audio tracks');
    }

    try {
      // Produce video
      this.videoProducer = await this.producerTransport.produce({
        track: videoTrack,
        encodings: [
          { maxBitrate: 2500000 },  // 2.5 Mbps
        ],
        codecOptions: {
          videoGoogleStartBitrate: 1000
        }
      });

      console.log('✅ Video producer created, ID:', this.videoProducer.id);

      // Produce audio
      this.audioProducer = await this.producerTransport.produce({
        track: audioTrack,
        codecOptions: {
          opusStereo: true,
          opusDtx: true
        }
      });

      console.log('✅ Audio producer created, ID:', this.audioProducer.id);

      // Handle producer close
      this.videoProducer.on('transportclose', () => {
        console.log('🔴 Video producer transport closed');
      });

      this.audioProducer.on('transportclose', () => {
        console.log('🔴 Audio producer transport closed');
      });

    } catch (error) {
      console.error('❌ Error producing media:', error);
      throw error;
    }
  }

  async stopProducing() {
    console.log('🛑 Stopping producers...');

    if (this.videoProducer) {
      this.videoProducer.close();
      this.videoProducer = null;
    }

    if (this.audioProducer) {
      this.audioProducer.close();
      this.audioProducer = null;
    }

    if (this.producerTransport) {
      this.producerTransport.close();
      this.producerTransport = null;
    }

    // Notify server
    try {
      await this.request('/webrtc/stop', 'POST');
    } catch (error) {
      console.error('Error notifying server of stop:', error);
    }

    console.log('✅ Producers stopped');
  }

  isProducing(): boolean {
    return this.videoProducer !== null || this.audioProducer !== null;
  }

  cleanup() {
    this.stopProducing();
    this.device = null;
  }
}

export default new WebRTCService();
