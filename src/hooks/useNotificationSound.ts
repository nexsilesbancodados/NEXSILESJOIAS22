import { useCallback, useRef, useEffect, useState } from 'react';

// Notification sound types
type NotificationSoundType = 'default' | 'interest' | 'view' | 'alert' | 'success';

// Sound frequencies for different notification types
const soundConfigs: Record<NotificationSoundType, { frequencies: number[]; duration: number }> = {
  default: { frequencies: [523, 659, 784], duration: 100 },     // C5, E5, G5 - pleasant chime
  interest: { frequencies: [784, 988, 1175], duration: 120 },   // G5, B5, D6 - excited tone
  view: { frequencies: [440, 554], duration: 80 },              // A4, C#5 - soft notification
  alert: { frequencies: [880, 698, 880], duration: 150 },       // A5, F5, A5 - attention
  success: { frequencies: [523, 659, 784, 1047], duration: 100 }, // Major chord ascending
};

// Map notification types to sound types
const notificationTypeToSound: Record<string, NotificationSoundType> = {
  interesse_maleta: 'interest',
  visualizacao_maleta: 'view',
  estoque_baixo: 'alert',
  maleta_vencendo: 'alert',
  novo_pedido: 'success',
  meta_proxima: 'success',
  aniversario: 'default',
  romaneio_pendente: 'default',
};

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('notification-sound-enabled');
    return stored !== 'false'; // Default to true
  });
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(() => {
    const stored = localStorage.getItem('notification-vibration-enabled');
    return stored !== 'false'; // Default to true
  });

  // Initialize AudioContext on first user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a frequency sequence
  const playSound = useCallback((type: NotificationSoundType = 'default') => {
    if (!isSoundEnabled) return;

    try {
      const ctx = initAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const config = soundConfigs[type];
      const { frequencies, duration } = config;

      frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const startTime = ctx.currentTime + (index * duration) / 1000;
        const endTime = startTime + duration / 1000;

        // Fade in and out for smoother sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

        oscillator.start(startTime);
        oscillator.stop(endTime + 0.1);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [isSoundEnabled, initAudioContext]);

  // Vibrate device
  const vibrate = useCallback((pattern: number | number[] = [100, 50, 100]) => {
    if (!isVibrationEnabled) return;
    
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.error('Error vibrating:', error);
    }
  }, [isVibrationEnabled]);

  // Play notification based on type
  const playNotification = useCallback((notificationType?: string) => {
    const soundType = notificationType 
      ? notificationTypeToSound[notificationType] || 'default'
      : 'default';
    
    playSound(soundType);
    
    // Different vibration patterns for different notification types
    if (soundType === 'interest' || soundType === 'alert') {
      vibrate([100, 50, 100, 50, 100]); // Triple vibration for important
    } else {
      vibrate([100, 50, 100]); // Double vibration for normal
    }
  }, [playSound, vibrate]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('notification-sound-enabled', String(newValue));
      return newValue;
    });
  }, []);

  // Toggle vibration
  const toggleVibration = useCallback(() => {
    setIsVibrationEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('notification-vibration-enabled', String(newValue));
      return newValue;
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playSound,
    playNotification,
    vibrate,
    isSoundEnabled,
    isVibrationEnabled,
    toggleSound,
    toggleVibration,
    initAudioContext,
  };
}

// Singleton for global access
let globalNotificationSound: ReturnType<typeof useNotificationSound> | null = null;

export function getNotificationSound() {
  return globalNotificationSound;
}

export function setGlobalNotificationSound(instance: ReturnType<typeof useNotificationSound>) {
  globalNotificationSound = instance;
}
