'use client';

import { useState, useEffect, useCallback } from 'react';
import SearchForm from './components/SearchForm';
import ScheduleResults from './components/ScheduleResults';
import AlertList from './components/AlertList';
import { Schedule, SearchParams } from './lib/types';
import { generateSchedules } from './lib/mockData';

type Tab = 'search' | 'alerts';

export default function Home() {
  const [tab, setTab] = useState<Tab>('search');
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSearch, setLastSearch] = useState<SearchParams | null>(null);
  const [alertRefresh, setAlertRefresh] = useState(0);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock');

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotification = useCallback(async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  }, []);

  async function handleSearch(params: SearchParams) {
    setLoading(true);
    setLastSearch(params);
    setTab('search');

    try {
      const qs = new URLSearchParams({
        departure: params.departure,
        arrival: params.arrival,
        date: params.date,
        type: params.type,
      });
      const res = await fetch(`/api/schedules?${qs}`);
      const json = await res.json();

      if (res.ok && json.schedules) {
        setSchedules(json.schedules);
        setDataSource('live');
      } else {
        throw new Error(json.error ?? 'api error');
      }
    } catch {
      // API key 미설정 또는 오류 → mock 데이터 사용
      const results = generateSchedules(params.departure, params.arrival, params.date, params.type);
      setSchedules(results);
      setDataSource('mock');
    }

    setLoading(false);
  }

  function handleAlertCreated() {
    setAlertRefresh(n => n + 1);
    if (notifPermission === 'default') requestNotification();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚆</span>
            <h1 className="text-lg font-bold text-gray-900">빠른 기차·버스 조회</h1>
          </div>
          {notifPermission !== 'granted' && (
            <button
              onClick={requestNotification}
              className="text-xs bg-orange-100 text-orange-700 font-medium px-2.5 py-1 rounded-full hover:bg-orange-200 transition-all"
            >
              🔔 알림 허용
            </button>
          )}
          {notifPermission === 'granted' && (
            <span className="text-xs text-green-600 font-medium">🔔 알림 ON</span>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Search Form always visible */}
        <SearchForm onSearch={handleSearch} loading={loading} />

        {/* Tabs */}
        {(schedules !== null || alertRefresh > 0) && (
          <div className="flex gap-0 bg-gray-100 rounded-xl p-1">
            <TabBtn active={tab === 'search'} onClick={() => setTab('search')}>
              조회 결과 {schedules !== null && `(${schedules.length})`}
            </TabBtn>
            <TabBtn active={tab === 'alerts'} onClick={() => setTab('alerts')}>
              알림 목록
            </TabBtn>
          </div>
        )}

        {/* Results */}
        {tab === 'search' && (
          <>
            {loading && (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <svg className="animate-spin w-8 h-8 mb-3 text-blue-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <div className="text-sm">조회 중...</div>
              </div>
            )}
            {!loading && schedules !== null && (
              <>
                {lastSearch && (
                  <div className="text-sm text-gray-500 font-medium flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span>{lastSearch.date}</span>
                      <span>·</span>
                      <span className="text-gray-800 font-semibold">{lastSearch.departure} → {lastSearch.arrival}</span>
                    </div>
                    {dataSource === 'live'
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">실시간</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">샘플 데이터</span>
                    }
                  </div>
                )}
                <ScheduleResults schedules={schedules} onAlertCreated={handleAlertCreated} />
              </>
            )}
            {!loading && schedules === null && (
              <div className="text-center py-14 text-gray-400">
                <div className="text-5xl mb-3">🚉</div>
                <div className="text-sm font-medium">출발지와 도착지를 선택하고</div>
                <div className="text-sm">조회 버튼을 눌러주세요</div>
              </div>
            )}
          </>
        )}

        {tab === 'alerts' && (
          <AlertList refreshKey={alertRefresh} />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-lg mx-auto flex">
          <NavBtn active={tab === 'search'} onClick={() => setTab('search')} icon="🔍" label="조회" />
          <NavBtn active={tab === 'alerts'} onClick={() => setTab('alerts')} icon="🔔" label="알림" />
        </div>
      </nav>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
        active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-all ${
        active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
