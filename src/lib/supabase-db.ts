/**
 * Loose-typed Supabase client wrapper
 * 
 * This module provides a type-loose wrapper around the Supabase client
 * to bypass TypeScript schema validation errors until all database
 * migrations are applied and types are regenerated.
 * 
 * Usage:
 * import { db, dbRpc, supabase } from '@/lib/supabase-db';
 * 
 * // Instead of: supabase.from('table_name')
 * // Use: db.from('table_name')
 * 
 * // Instead of: supabase.rpc('function_name', params)
 * // Use: dbRpc('function_name', params)
 */

import { supabase as originalSupabase } from '@/integrations/supabase/client';

// Loose-typed Supabase client for database operations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = originalSupabase as any;

// Helper function for RPC calls with loose typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dbRpc = (fn: string, params?: Record<string, any>) => {
  return (originalSupabase as any).rpc(fn, params);
};

// Re-export the original supabase client for auth and other operations
// Also export as 'supabase' with loose typing for backwards compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = originalSupabase as any;
