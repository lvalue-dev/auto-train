'use client';

import { useState, useRef, useEffect } from 'react';
import { SearchParams } from '../lib/types';
import { ALL_STATIONS, TRAIN_STATIONS, BUS_TERMINALS } from '../lib/mockData';

interface Props {
  onSearch: (params: SearchParams) => void;
  loading?: boolean;
}

export default function SearchForm({ onSearch, loading }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [departure, setDeparture] = useState('SEO');
  const [arrival, setArrival] = useState('PSN');
  const [date, setDate] = useState(today);
  const [type, setType] = useState<'all' | 'train' | 'bus'>('all');
  const [depQuery, setDepQuery] = useState('서울');
  const [arrQuery, setArrQuery] = useState('부산');
  const [showDepSuggest, setShowDepSuggest] = useState(false);
  const [showArrSuggest, setShowArrSuggest] = useState(false);
  const depRef = useRef<HTMLDivElement>(null);
  const arrRef = useRef<HTMLDivElement>(null);

  const stationPool = type === 'train' ? TRAIN_STATIONS : type === 'bus' ? BUS_TERMINALS : ALL_STATIONS;

  const filteredDep = stationPool.filter(s => s.name.includes(depQuery) || s.code.toLowerCase().includes(depQuery.toLowerCase()));
  const filteredArr = stationPool.filter(s => s.name.includes(arrQuery) || s.code.toLowerCase().includes(arrQuery.toLowerCase()));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (depRef.current && !depRef.current.contains(e.target as Node)) setShowDepSuggest(false);
      if (arrRef.current && !arrRef.current.contains(e.target as Node)) setShowArrSuggest(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function swap() {
    setDeparture(arrival);
    setArrival(departure);
    setDepQuery(arrQuery);
    setArrQuery(depQuery);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSearch({ departure, arrival, date, type });
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg p-5 space-y-4">
      {/* Transport type tabs */}
      <div className="flex gap-2 mb-1">
        {([['all', '전체'], ['train', '기차'], ['bus', '버스']] as const).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setType(val)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              type === val
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Route */}
      <div className="flex items-center gap-2">
        {/* Departure */}
        <div className="flex-1 relative" ref={depRef}>
          <label className="text-xs text-gray-500 font-medium mb-1 block">출발</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={depQuery}
            onChange={e => { setDepQuery(e.target.value); setShowDepSuggest(true); }}
            onFocus={() => setShowDepSuggest(true)}
            placeholder="출발역/터미널"
          />
          {showDepSuggest && filteredDep.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {filteredDep.map(s => (
                <button
                  key={s.code}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between items-center"
                  onClick={() => { setDeparture(s.code); setDepQuery(s.name); setShowDepSuggest(false); }}
                >
                  <span>{s.name}</span>
                  <span className="text-xs text-gray-400">{s.type === 'train' ? '기차' : '버스'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap */}
        <button
          type="button"
          onClick={swap}
          className="mt-5 p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors"
          title="출발/도착 교체"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        {/* Arrival */}
        <div className="flex-1 relative" ref={arrRef}>
          <label className="text-xs text-gray-500 font-medium mb-1 block">도착</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={arrQuery}
            onChange={e => { setArrQuery(e.target.value); setShowArrSuggest(true); }}
            onFocus={() => setShowArrSuggest(true)}
            placeholder="도착역/터미널"
          />
          {showArrSuggest && filteredArr.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {filteredArr.map(s => (
                <button
                  key={s.code}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between items-center"
                  onClick={() => { setArrival(s.code); setArrQuery(s.name); setShowArrSuggest(false); }}
                >
                  <span>{s.name}</span>
                  <span className="text-xs text-gray-400">{s.type === 'train' ? '기차' : '버스'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="text-xs text-gray-500 font-medium mb-1 block">날짜</label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={e => setDate(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Quick date buttons */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map(offset => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          const val = d.toISOString().split('T')[0];
          const labels = ['오늘', '내일', '모레', '3일 후'];
          return (
            <button
              key={offset}
              type="button"
              onClick={() => setDate(val)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${
                date === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {labels[offset]}
            </button>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
        조회하기
      </button>
    </form>
  );
}
