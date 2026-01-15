// ========================================
// ONESIGNAL SERVICE - Web SDK v16
// Initialize and manage OneSignal SDK
// ========================================

declare global {
  interface Window {
    OneSignal: any;
  }
}

const ONESIGNAL_APP_ID = '60e31ffd-52a9-416d-b164-80a302ac80bd';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : 'https://ministryprogs.tniglobal.org';

class OneSignalService {
  private initialized = false;

  /**
   * Initialize OneSignal Web SDK v16
   */
  async init() {
    if (this.initialized) {
      console.log('OneSignal already initialized');
      return;
    }

    try {
      // Wait for OneSignal to load
      if (!window.OneSignal) {
        console.error('OneSignal SDK not loaded');
        return;
      }

      // Initialize with v16 API
      await window.OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
      });

      this.initialized = true;
      console.log('✓ OneSignal initialized successfully');

      // Check if user is already subscribed
      const isSubscribed = window.OneSignal.User?.PushSubscription?.optedIn || false;
      console.log('Push notifications status:', isSubscribed ? 'Enabled' : 'Disabled');
      
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
    }
  }

  /**
   * Show permission prompt using v16 Slidedown API
   */
  async showPrompt() {
    try {
      if (!this.initialized) {
        await this.init();
      }

      // Check current permission
      const permission = window.OneSignal.Notifications?.permission;
      
      if (permission === 'granted') {
        console.log('Notifications already granted');
        return;
      }

      if (permission === 'denied') {
        console.log('Notifications denied by user');
        return;
      }

      // Show slidedown prompt (v16 API)
      await window.OneSignal.Slidedown.promptPush();
      console.log('OneSignal prompt shown');
      
    } catch (error) {
      console.error('Error showing OneSignal prompt:', error);
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribe(token: string) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      // Subscribe using v16 API
      await window.OneSignal.User.PushSubscription.optIn();
      
      // Wait a moment for subscription to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get OneSignal Player ID (v16 API)
      const playerId = window.OneSignal.User?.PushSubscription?.id;
      
      if (playerId) {
        console.log('OneSignal Player ID:', playerId);
        
        // Register with backend
        await this.registerWithBackend(playerId, token);
        
        console.log('✓ Subscribed to push notifications');
        return true;
      } else {
        console.error('Failed to get player ID');
        return false;
      }
      
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(token: string) {
    try {
      // Unsubscribe using v16 API
      await window.OneSignal.User.PushSubscription.optOut();
      
      // Unregister from backend
      const response = await fetch(`${API_URL}/api/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('✓ Unsubscribed from push notifications');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Get OneSignal player ID (v16: subscription ID)
   */
  getPlayerId(): string | null {
    try {
      return window.OneSignal.User?.PushSubscription?.id || null;
    } catch (error) {
      console.error('Error getting player ID:', error);
      return null;
    }
  }

  /**
   * Check if user is subscribed
   */
  isSubscribed(): boolean {
    try {
      return window.OneSignal.User?.PushSubscription?.optedIn || false;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus(): string {
    try {
      return window.OneSignal.Notifications?.permission || 'default';
    } catch (error) {
      console.error('Error getting permission:', error);
      return 'default';
    }
  }

  /**
   * Register OneSignal player ID with backend
   */
  private async registerWithBackend(playerId: string, token: string) {
    try {
      const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId,
          preferences: {
            pushEnabled: true,
            sound: true,
            badge: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register with backend');
      }

      const data = await response.json();
      console.log('✓ Registered with backend:', data);
      
    } catch (error) {
      console.error('Error registering with backend:', error);
      throw error;
    }
  }

  /**
   * Send tag to OneSignal for user segmentation
   */
  async sendTag(key: string, value: string) {
    try {
      await window.OneSignal.User.addTag(key, value);
      console.log(`✓ Tag sent: ${key}=${value}`);
    } catch (error) {
      console.error('Error sending tag:', error);
    }
  }

  /**
   * Send multiple tags at once
   */
  async sendTags(tags: Record<string, string>) {
    try {
      await window.OneSignal.User.addTags(tags);
      console.log('✓ Tags sent:', tags);
    } catch (error) {
      console.error('Error sending tags:', error);
    }
  }

  /**
   * Link OneSignal user with backend user ID
   */
  async setExternalUserId(userId: string) {
    try {
      window.OneSignal.login(userId);
      console.log('✓ External user ID set:', userId);
    } catch (error) {
      console.error('Error setting external user ID:', error);
    }
  }

  /**
   * Listen for subscription changes (v16 API)
   */
  onSubscriptionChange(callback: (isSubscribed: boolean) => void) {
    try {
      window.OneSignal.User?.PushSubscription?.addEventListener('change', (event: any) => {
        const isSubscribed = event.current?.optedIn || false;
        console.log('Subscription changed:', isSubscribed);
        callback(isSubscribed);
      });
    } catch (error) {
      console.error('Error setting up subscription listener:', error);
    }
  }
}

// Export singleton instance
export default new OneSignalService();
