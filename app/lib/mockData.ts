import { Station, Schedule, TransportType } from './types';

export const TRAIN_STATIONS: Station[] = [
  { code: 'SEO', name: '서울', type: 'train' },
  { code: 'YON', name: '용산', type: 'train' },
  { code: 'SUW', name: '수원', type: 'train' },
  { code: 'DAJ', name: '대전', type: 'train' },
  { code: 'DGU', name: '동대구', type: 'train' },
  { code: 'PSN', name: '부산', type: 'train' },
  { code: 'GWJ', name: '광주송정', type: 'train' },
  { code: 'MOK', name: '목포', type: 'train' },
  { code: 'JEJ', name: '제주', type: 'train' },
  { code: 'CHN', name: '천안아산', type: 'train' },
  { code: 'OSN', name: '오송', type: 'train' },
  { code: 'GYG', name: '경주', type: 'train' },
  { code: 'ULS', name: '울산', type: 'train' },
  { code: 'POH', name: '포항', type: 'train' },
  { code: 'GNW', name: '강릉', type: 'train' },
  { code: 'WOJ', name: '원주', type: 'train' },
  { code: 'CHJ', name: '청주', type: 'train' },
  { code: 'JEJ2', name: '전주', type: 'train' },
];

export const BUS_TERMINALS: Station[] = [
  { code: 'SEO_B', name: '서울경부(고속)', type: 'bus' },
  { code: 'SEO_S', name: '서울남부(시외)', type: 'bus' },
  { code: 'SEO_D', name: '동서울(시외)', type: 'bus' },
  { code: 'SEO_H', name: '서울홍천(시외)', type: 'bus' },
  { code: 'INH', name: '인천(고속)', type: 'bus' },
  { code: 'SUW_B', name: '수원(시외)', type: 'bus' },
  { code: 'DAJ_B', name: '대전복합(고속)', type: 'bus' },
  { code: 'DGU_B', name: '대구북부(시외)', type: 'bus' },
  { code: 'PSN_B', name: '부산(고속)', type: 'bus' },
  { code: 'GWJ_B', name: '광주유스퀘어(고속)', type: 'bus' },
  { code: 'JEJ_B', name: '전주(시외)', type: 'bus' },
  { code: 'CHN_B', name: '천안(시외)', type: 'bus' },
  { code: 'GNW_B', name: '강릉(시외)', type: 'bus' },
  { code: 'SKC', name: '속초(시외)', type: 'bus' },
];

export const ALL_STATIONS = [...TRAIN_STATIONS, ...BUS_TERMINALS];

const TRANSPORT_LABELS: Record<TransportType, string> = {
  KTX: 'KTX',
  ITX: 'ITX-새마을',
  MUGUNGHWA: '무궁화',
  EXPRESS_BUS: '고속버스',
  INTERCITY_BUS: '시외버스',
};

export function getTransportLabel(type: TransportType): string {
  return TRANSPORT_LABELS[type];
}

export const TRANSPORT_COLORS: Record<TransportType, string> = {
  KTX: 'bg-red-500',
  ITX: 'bg-blue-500',
  MUGUNGHWA: 'bg-green-600',
  EXPRESS_BUS: 'bg-orange-500',
  INTERCITY_BUS: 'bg-purple-500',
};

export const TRANSPORT_TEXT_COLORS: Record<TransportType, string> = {
  KTX: 'text-red-600',
  ITX: 'text-blue-600',
  MUGUNGHWA: 'text-green-700',
  EXPRESS_BUS: 'text-orange-600',
  INTERCITY_BUS: 'text-purple-600',
};

function randomSeats(available: boolean): { special: number; general: number; standing: number } {
  if (!available) return { special: 0, general: 0, standing: 0 };
  return {
    special: Math.random() > 0.4 ? Math.floor(Math.random() * 30) : 0,
    general: Math.random() > 0.3 ? Math.floor(Math.random() * 80) : 0,
    standing: Math.random() > 0.6 ? Math.floor(Math.random() * 20) : 0,
  };
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function durationStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

interface RouteTemplate {
  type: TransportType;
  trainNo: string;
  departureCode: string;
  departureName: string;
  arrivalCode: string;
  arrivalName: string;
  times: string[];
  durationMins: number;
  price: number;
}

const ROUTE_TEMPLATES: RouteTemplate[] = [
  // Seoul - Busan KTX
  { type: 'KTX', trainNo: 'KTX 101', departureCode: 'SEO', departureName: '서울', arrivalCode: 'PSN', arrivalName: '부산', times: ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'], durationMins: 160, price: 59800 },
  { type: 'KTX', trainNo: 'KTX 103', departureCode: 'YON', departureName: '용산', arrivalCode: 'PSN', arrivalName: '부산', times: ['06:15', '07:15', '09:15', '11:15', '14:15', '17:15', '20:15'], durationMins: 155, price: 59800 },
  { type: 'ITX', trainNo: 'ITX 1001', departureCode: 'SEO', departureName: '서울', arrivalCode: 'PSN', arrivalName: '부산', times: ['07:00', '09:00', '12:00', '15:00', '18:00'], durationMins: 240, price: 42600 },
  { type: 'MUGUNGHWA', trainNo: '무궁화 1201', departureCode: 'SEO', departureName: '서울', arrivalCode: 'PSN', arrivalName: '부산', times: ['07:30', '11:00', '15:30', '19:00'], durationMins: 340, price: 28600 },
  // Seoul - Daejeon
  { type: 'KTX', trainNo: 'KTX 201', departureCode: 'SEO', departureName: '서울', arrivalCode: 'DAJ', arrivalName: '대전', times: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'], durationMins: 50, price: 23700 },
  { type: 'ITX', trainNo: 'ITX 2001', departureCode: 'SEO', departureName: '서울', arrivalCode: 'DAJ', arrivalName: '대전', times: ['06:30', '09:30', '13:00', '16:30', '20:00'], durationMins: 90, price: 15300 },
  // Seoul - Gwangju
  { type: 'KTX', trainNo: 'KTX 401', departureCode: 'YON', departureName: '용산', arrivalCode: 'GWJ', arrivalName: '광주송정', times: ['06:20', '07:20', '08:20', '09:20', '10:20', '12:20', '14:20', '16:20', '18:20', '20:20'], durationMins: 95, price: 46800 },
  // Seoul - Gangneung
  { type: 'KTX', trainNo: 'KTX 801', departureCode: 'SEO', departureName: '서울', arrivalCode: 'GNW', arrivalName: '강릉', times: ['06:30', '08:00', '09:30', '11:00', '13:00', '15:00', '17:00', '19:00'], durationMins: 108, price: 27600 },
  // Express Bus Seoul - Busan
  { type: 'EXPRESS_BUS', trainNo: '경부선 고속', departureCode: 'SEO_B', departureName: '서울경부(고속)', arrivalCode: 'PSN_B', arrivalName: '부산(고속)', times: ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'], durationMins: 240, price: 28600 },
  { type: 'EXPRESS_BUS', trainNo: '경부 우등', departureCode: 'SEO_B', departureName: '서울경부(고속)', arrivalCode: 'PSN_B', arrivalName: '부산(고속)', times: ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'], durationMins: 240, price: 37700 },
  // Express Bus Seoul - Daejeon
  { type: 'EXPRESS_BUS', trainNo: '대전 고속', departureCode: 'SEO_B', departureName: '서울경부(고속)', arrivalCode: 'DAJ_B', arrivalName: '대전복합(고속)', times: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'], durationMins: 100, price: 9500 },
  // Intercity Bus Seoul - Gangneung
  { type: 'INTERCITY_BUS', trainNo: '강릉 시외', departureCode: 'SEO_D', departureName: '동서울(시외)', arrivalCode: 'GNW_B', arrivalName: '강릉(시외)', times: ['06:30', '07:30', '08:30', '09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30', '16:30', '17:30', '18:30'], durationMins: 155, price: 18600 },
  // Intercity Bus Seoul - Sokcho
  { type: 'INTERCITY_BUS', trainNo: '속초 시외', departureCode: 'SEO_D', departureName: '동서울(시외)', arrivalCode: 'SKC', arrivalName: '속초(시외)', times: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'], durationMins: 185, price: 22400 },
];

let scheduleCache: Map<string, Schedule[]> = new Map();

export function generateSchedules(
  departureCode: string,
  arrivalCode: string,
  date: string,
  type: 'all' | 'train' | 'bus'
): Schedule[] {
  const cacheKey = `${departureCode}-${arrivalCode}-${date}-${type}`;
  if (scheduleCache.has(cacheKey)) return scheduleCache.get(cacheKey)!;

  const routes = ROUTE_TEMPLATES.filter(r => {
    const matchRoute = r.departureCode === departureCode && r.arrivalCode === arrivalCode;
    if (!matchRoute) return false;
    if (type === 'train') return r.type !== 'EXPRESS_BUS' && r.type !== 'INTERCITY_BUS';
    if (type === 'bus') return r.type === 'EXPRESS_BUS' || r.type === 'INTERCITY_BUS';
    return true;
  });

  const schedules: Schedule[] = [];
  let counter = 1;

  for (const route of routes) {
    for (const time of route.times) {
      const seed = `${route.trainNo}-${time}-${date}`;
      const rand = seededRandom(seed);
      const hasSeats = rand > 0.2;

      schedules.push({
        id: `${route.departureCode}-${route.arrivalCode}-${route.type}-${counter++}-${date}`,
        type: route.type,
        trainNo: route.trainNo,
        departure: { code: route.departureCode, name: route.departureName, type: route.type === 'EXPRESS_BUS' || route.type === 'INTERCITY_BUS' ? 'bus' : 'train' },
        arrival: { code: route.arrivalCode, name: route.arrivalName, type: route.type === 'EXPRESS_BUS' || route.type === 'INTERCITY_BUS' ? 'bus' : 'train' },
        departureTime: time,
        arrivalTime: addMinutes(time, route.durationMins),
        duration: durationStr(route.durationMins),
        price: route.price,
        seats: randomSeats(hasSeats),
        date,
      });
    }
  }

  schedules.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  scheduleCache.set(cacheKey, schedules);
  return schedules;
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 100) / 100;
}

export function refreshScheduleSeats(scheduleId: string, schedules: Schedule[]): Schedule[] {
  return schedules.map(s => {
    if (s.id !== scheduleId) return s;
    const rand = Math.random();
    return {
      ...s,
      seats: randomSeats(rand > 0.3),
    };
  });
}
