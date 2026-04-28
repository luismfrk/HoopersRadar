export type PlayerProfile = {
  name: string;
  username: string;
  age: string;
  height: string;
  weight: string;
  position: string;
  level: string;
  availability: string;
  characteristics: string;
  history: string;
  city: string;
};

export type Partner = {
  id: string;
  name: string;
  position: string;
  level: string;
  availability: string;
  description: string;
  city: string;
  neighborhood: string;
  matchScore: number;
  rating: number;
};

export type Court = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  price: string;
  surface: string;
  status: string;
  occupancy: string;
};

export type SocialPost = {
  id: string;
  author: string;
  handle: string;
  role: string;
  city: string;
  time: string;
  text: string;
  tag: string;
  likes: number;
  replies: number;
  reposts: number;
  liked?: boolean;
  reposted?: boolean;
};
