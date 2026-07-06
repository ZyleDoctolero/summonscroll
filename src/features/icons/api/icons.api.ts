import { api } from '@/lib/api'

export interface IconMetadata {
  id: string
  name: string
  displayName: string
  type: string
  url: string
  format: string
  width: number
  height: number
  createdAt: string
  updatedAt: string
}

export interface IconsResponse {
  data: IconMetadata[]
  total: number
}

export interface IconResponse {
  data: IconMetadata
}

export async function getIcons(type?: string): Promise<IconsResponse> {
  const path = type ? `/icons?type=${encodeURIComponent(type)}` : '/icons'
  return api.get<IconsResponse>(path)
}

export async function getIconById(id: string): Promise<IconResponse> {
  return api.get<IconResponse>(`/icons/${id}`)
}

export async function uploadIcon(formData: FormData): Promise<IconResponse> {
  const token = (await import('@/stores/userStore')).useUserStore.getState().accessToken
  const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

  const response = await fetch(`${BASE_URL}/icons/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload icon')
  }

  return response.json() as Promise<IconResponse>
}

export async function updateIcon(
  id: string,
  data: Partial<Omit<IconMetadata, 'id' | 'name' | 'createdAt' | 'updatedAt'>>,
): Promise<IconResponse> {
  return api.patch<IconResponse>(`/icons/${id}`, data)
}

export async function deleteIcon(id: string): Promise<void> {
  await api.delete(`/icons/${id}`)
}
