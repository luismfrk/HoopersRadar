import type { Court, Partner, SocialPost } from '../types';

export const mockPartners: Partner[] = [];

export const mockCourts: Court[] = [
  {
    id: 'c1',
    name: 'Quadra Municipal de Mallet',
    address: 'Centro, Mallet-PR',
    lat: -25.8813,
    lng: -50.8245,
    price: 'Gratuita',
    surface: 'Piso cimento',
    status: 'Comunidade local',
    occupancy: 'Media',
  },
  {
    id: 'c2',
    name: 'Quadra Publica de Curitiba',
    address: 'Agua Verde, Curitiba-PR',
    lat: -25.4484,
    lng: -49.2769,
    price: 'Gratuita',
    surface: 'Piso cimento',
    status: 'Aberta hoje',
    occupancy: 'Alta',
  },
  {
    id: 'c3',
    name: 'Ginasio em Ponta Grossa',
    address: 'Centro, Ponta Grossa-PR',
    lat: -25.0945,
    lng: -50.1633,
    price: 'R$ 30/h',
    surface: 'Piso madeira',
    status: 'Reserva indicada',
    occupancy: 'Media',
  },
  {
    id: 'c4',
    name: 'Quadra da Orla',
    address: 'Boa Viagem, Recife-PE',
    lat: -8.1259,
    lng: -34.8996,
    price: 'Gratuita',
    surface: 'Piso externo',
    status: 'Aberta agora',
    occupancy: 'Baixa',
  },
];

export const mockPosts: SocialPost[] = [];

export const mockStories = [];
