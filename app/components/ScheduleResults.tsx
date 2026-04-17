'use client';

import { useState, useMemo } from 'react';
import { Schedule } from '../lib/types';
import ScheduleCard from './ScheduleCard';
import { getTransportLabel } from '../lib/mockData';

interface Props {
  schedules: Schedule[];
  onAlertCreated: () => void;
}

type SortKey = 'time' | 'price' | 'duration';
type FilterKey = 'all' | 'available';

export default function ScheduleResults({ schedules, onAlertCreated }: Props) {
  const [sort, setSort] = useState<SortKey>('time');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const types = useMemo(() => {
    const s = new Set(schedules.map(s => s.type));
    return ['all', ...Array.from(s)];
  }, [schedules]);

  const sorted = useMemo(() => {
    let list = [...schedules];
    if (filter === 'available') {
      list = list.filter(s => s.seats.special + s.seats.general + s.seats.standing > 0);
    }
    if (typeFilter !== 'all') {
      list = list.filter(s => s.type === typeFilter);
    }
    if (sort === 'time') list.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    if (sort === 'price') list.sort((a, b) => a.price - b.price);
    if (sort === 'duration') {
      list.sort((a, b) => {
        const toMin = (d: string) => {
          const h = d.match(/(\d+)시간/)?.[1] ?? '0';
          const m = d.match(/(\d+)분/)?.[1] ?? '0';
          return parseInt(h) * 60 + parseInt(m);
        };
        return toMin(a.duration) - toMin(b.duration);
      });
    }
    return list;
  }, [schedules, sort, filter, typeFilter]);

  const availableCount = schedules.filter(s => s.seats.special + s.seats.general + s.seats.standing > 0).length;

  if (schedules.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <div className="text-4xl mb-2">🔍</div>
        <div className="text-sm">해당 구간의 열차/버스가 없습니다</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>총 <b className="text-gray-900">{schedules.length}</b>편 · 예매 가능 <b className="text-blue-600">{availableCount}</b>편</span>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {/* Type filter */}
        {types.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
              typeFilter === t ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'all' ? '전체' : getTransportLabel(t as Parameters<typeof getTransportLabel>[0])}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
          >전체</button>
          <button
            onClick={() => setFilter('available')}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${filter === 'available' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >잔석만</button>
        </div>
      </div>

      {/* Sort */}
      <div className="flex gap-2 text-xs">
        <span className="text-gray-400 self-center">정렬:</span>
        {([['time', '출발시간'], ['price', '가격'], ['duration', '소요시간']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`px-2.5 py-1 rounded-full font-medium transition-all ${sort === key ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label} {sort === key ? '↑' : ''}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {sorted.map(s => (
          <ScheduleCard key={s.id} schedule={s} onAlertCreated={onAlertCreated} />
        ))}
      </div>
    </div>
  );
}
