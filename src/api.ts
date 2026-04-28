import type { Court, Partner, PlayerProfile, SocialPost } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001/api';

type Bootstrap = {
  profile: PlayerProfile;
  partners: Partner[];
  courts: Court[];
  posts: SocialPost[];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(email: string, password: string) {
    return request<{ token: string; profile: PlayerProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register(email: string, password: string, username: string, profile: PlayerProfile) {
    return request<{ token: string; profile: PlayerProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, profile }),
    });
  },
  bootstrap() {
    return request<Bootstrap>('/bootstrap');
  },
  updateProfile(profile: PlayerProfile) {
    return request<PlayerProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },
  createPost(post: Pick<SocialPost, 'author' | 'handle' | 'role' | 'city' | 'text' | 'tag'>) {
    return request<SocialPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  },
  togglePost(id: string, action: 'like' | 'repost') {
    return request<SocialPost>(`/posts/${id}/${action}`, { method: 'POST' });
  },
};
