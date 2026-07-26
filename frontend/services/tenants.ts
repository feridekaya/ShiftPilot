import { Tenant } from '@/types';
import api from './api';

export async function getMyTenant(): Promise<Tenant> {
  const { data } = await api.get<Tenant>('/api/tenants/me/');
  return data;
}
