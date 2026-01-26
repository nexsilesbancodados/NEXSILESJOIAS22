import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-db';

interface PresenceState {
  isRevendedoraOnline: boolean;
  viewersCount: number;
}

/**
 * Hook to track presence on a maleta's public page
 * Use type 'revendedora' when viewing as the seller, 'viewer' when viewing as a customer
 */
export function useMaletaPresence(maletaId: string | undefined, type: 'revendedora' | 'viewer' = 'viewer') {
  const [presenceState, setPresenceState] = useState<PresenceState>({
    isRevendedoraOnline: false,
    viewersCount: 0,
  });

  useEffect(() => {
    if (!maletaId) return;

    const channelName = `maleta-presence-${maletaId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const allPresences = Object.values(state).flat() as { type: string }[];
        
        // Check if revendedora is online
        const revendedoraOnline = allPresences.some(p => p.type === 'revendedora');
        
        // Count viewers (exclude revendedora)
        const viewers = allPresences.filter(p => p.type === 'viewer').length;
        
        setPresenceState({
          isRevendedoraOnline: revendedoraOnline,
          viewersCount: viewers,
        });
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('[Presence] Joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('[Presence] Left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await channel.track({
            type,
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [maletaId, type]);

  return presenceState;
}

/**
 * Hook specifically for revendedora to broadcast their presence when viewing a maleta
 */
export function useRevendedoraPresence(maletaId: string | undefined) {
  return useMaletaPresence(maletaId, 'revendedora');
}
