import { supabase } from './supabase';
import type {
  ClientRow,
  ClientListItem,
  ClientStatus,
  CreateClientData,
  UpdateClientData,
} from '@/types/client';

export async function createClient(
  data: CreateClientData,
): Promise<{ id: string }> {
  // stub — implementation in next iteration
  void data;
  return { id: '' };
}

export async function loadClient(clientId: string): Promise<ClientRow> {
  // stub — implementation in next iteration
  void clientId;
  return {} as ClientRow;
}

export async function updateClient(
  clientId: string,
  data: UpdateClientData,
): Promise<void> {
  // stub — implementation in next iteration
  void clientId;
  void data;
}

export async function listClients(
  orgId: string,
  statusFilter?: ClientStatus,
  searchQuery?: string,
): Promise<ClientListItem[]> {
  // stub — implementation in next iteration
  void orgId;
  void statusFilter;
  void searchQuery;
  return [];
}

export async function deleteClient(clientId: string): Promise<void> {
  // stub — implementation in next iteration
  void clientId;
}

// Re-export supabase for testing purposes
export { supabase as _supabase };
