import { Station, TransportType } from './types';

export const TRAIN_STATIONS: Station[] = [
  { code: 'SEO',  name: '서울',      type: 'train' },
  { code: 'YON',  name: '용산',      type: 'train' },
  { code: 'SUS',  name: '수서(SRT)', type: 'train' },
  { code: 'DTN',  name: '동탄',      type: 'train' },
  { code: 'PTJ',  name: '평택지제',  type: 'train' },
  { code: 'CHN',  name: '천안아산',  type: 'train' },
  { code: 'OSN',  name: '오송',      type: 'train' },
  { code: 'DAJ',  name: '대전',      type: 'train' },
  { code: 'GJN',  name: '공주',      type: 'train' },
  { code: 'IKS',  name: '익산',      type: 'train' },
  { code: 'GWJ',  name: '광주송정',  type: 'train' },
  { code: 'MOK',  name: '목포',      type: 'train' },
  { code: 'GJG',  name: '김천구미',  type: 'train' },
  { code: 'DGU',  name: '동대구',    type: 'train' },
  { code: 'GYG',  name: '신경주',    type: 'train' },
  { code: 'ULS',  name: '울산',      type: 'train' },
  { code: 'PSN',  name: '부산',      type: 'train' },
  { code: 'POH',  name: '포항',      type: 'train' },
  { code: 'GNW',  name: '강릉',      type: 'train' },
  { code: 'WOJ',  name: '원주',      type: 'train' },
  { code: 'JEJ2', name: '전주',      type: 'train' },
];

export const BUS_TERMINALS: Station[] = [
  { code: 'SEO_B', name: '서울경부(고속)', type: 'bus' },
  { code: 'SEO_S', name: '서울남부(시외)', type: 'bus' },
  { code: 'SEO_D', name: '동서울(시외)',   type: 'bus' },
  { code: 'INH',   name: '인천(고속)',     type: 'bus' },
  { code: 'SUW_B', name: '수원(시외)',     type: 'bus' },
  { code: 'DAJ_B', name: '대전복합(고속)', type: 'bus' },
  { code: 'DGU_B', name: '대구북부(시외)', type: 'bus' },
  { code: 'PSN_B', name: '부산(고속)',     type: 'bus' },
  { code: 'GWJ_B', name: '광주유스퀘어(고속)', type: 'bus' },
  { code: 'JEJ_B', name: '전주(시외)',    type: 'bus' },
  { code: 'CHN_B', name: '천안(시외)',    type: 'bus' },
  { code: 'GNW_B', name: '강릉(시외)',    type: 'bus' },
  { code: 'SKC',   name: '속초(시외)',    type: 'bus' },
];

export const ALL_STATIONS = [...TRAIN_STATIONS, ...BUS_TERMINALS];

const TRANSPORT_LABELS: Record<TransportType, string> = {
  KTX:           'KTX',
  SRT:           'SRT',
  ITX:           'ITX-새마을',
  MUGUNGHWA:     '무궁화',
  EXPRESS_BUS:   '고속버스',
  INTERCITY_BUS: '시외버스',
};

export function getTransportLabel(type: TransportType): string {
  return TRANSPORT_LABELS[type];
}

export const TRANSPORT_COLORS: Record<TransportType, string> = {
  KTX:           'bg-red-500',
  SRT:           'bg-sky-600',
  ITX:           'bg-blue-500',
  MUGUNGHWA:     'bg-green-600',
  EXPRESS_BUS:   'bg-orange-500',
  INTERCITY_BUS: 'bg-purple-500',
};

export const TRANSPORT_TEXT_COLORS: Record<TransportType, string> = {
  KTX:           'text-red-600',
  SRT:           'text-sky-700',
  ITX:           'text-blue-600',
  MUGUNGHWA:     'text-green-700',
  EXPRESS_BUS:   'text-orange-600',
  INTERCITY_BUS: 'text-purple-600',
};
