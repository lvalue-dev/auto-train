export type TransportType = 'KTX' | 'SRT' | 'ITX' | 'MUGUNGHWA' | 'EXPRESS_BUS' | 'INTERCITY_BUS';

export interface Station {
  code: string;
  name: string;
  type: 'train' | 'bus';
}

export interface Schedule {
  id: string;
  type: TransportType;
  trainNo: string;
  departure: Station;
  arrival: Station;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  seats: SeatInfo;
  date: string;
}

export interface SeatInfo {
  special: number;
  general: number;
  standing: number;
}

export interface Alert {
  id: string;
  scheduleId: string;
  trainNo: string;
  type: TransportType;
  departure: string;
  arrival: string;
  date: string;
  departureTime: string;
  seatClass: 'special' | 'general' | 'standing';
  status: 'watching' | 'found' | 'booked' | 'expired';
  createdAt: string;
  notifiedAt?: string;
}

export interface SearchParams {
  departure: string;
  arrival: string;
  date: string;
  type: 'all' | 'train' | 'bus';
}
