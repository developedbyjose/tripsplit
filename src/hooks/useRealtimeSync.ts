import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';

/**
 * Custom hook to listen for Supabase Realtime changes and automatically
 * invalidate TanStack Query caches to sync all screens instantly.
 */
export function useRealtimeSync(spaceId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!spaceId) return;

    const isSandbox = localStorage.getItem('tripsplit_sandbox_user') !== null;
    if (isSandbox) return;

    // Establish channel connection
    const channel = supabase
      .channel(`realtime-space-${spaceId}`)
      // Expense CRUD changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `space_id=eq.${spaceId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expenses', spaceId] });
          queryClient.invalidateQueries({ queryKey: ['space-activity', spaceId] });
        }
      )
      // Participants modifications
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expense_participants' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expenses', spaceId] });
        }
      )
      // Member changes (e.g. joining via QR)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `space_id=eq.${spaceId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['members', spaceId] });
        }
      )
      // Settlement records
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements', filter: `space_id=eq.${spaceId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['settlements', spaceId] });
        }
      )
      .subscribe();

    // Clean up channel subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [spaceId, queryClient]);
}
