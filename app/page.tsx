'use client';

import { useState, useEffect, useCallback } from 'react';
import SearchForm from './components/SearchForm';
import ScheduleResults from './components/ScheduleResults';
import AlertList from './components/AlertList';
import { Schedule, SearchParams } from './lib/types';

type Tab = 'search' | 'alerts';
type SearchState = 'idle' | 'loading' | 'ok' | 'empty' | 'error';

export default function Home() {
  const [tab, setTab] = useState<Tab>('search');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSearch, setLastSearch] = useState<SearchParams | null>(null);
  const [alertRefresh, setAlertRefresh] = useState(0);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission);
  }, []);

  const requestNotification = useCallback(async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  }, []);

  async function handleSearch(params: SearchParams) {
    setSearchState('loading');
    setLastSearch(params);
    setTab('search');

    const qs = new URLSearchParams({
      departure: params.departure,
      arrival: params.arrival,
      date: params.date,
      type: params.type,
    });

    try {
      const res = await fetch(`/api/schedules?${qs}`);
      const json = await res.json();

      if (res.ok && Array.isArray(json.schedules) && json.schedules.length > 0) {
        setSchedules(json.schedules);
        setSearchState('ok');
      } else if (res.status === 404 || json.schedules?.length === 0) {
        setSchedules([]);
        setSearchState('empty');
      } else {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
    } catch (e) {
      setSchedules([]);
      setErrorMsg(e instanceof Error ? e.message : '알 수 없는 오류');
      setSearchState('error');
    }
  }

  function handleAlertCreated() {
    setAlertRefresh(n => n + 1);
    if (notifPermission === 'default') requestNotification();
  }

  const hasResults = searchState === 'ok' || searchState === 'empty' || searchState === 'error';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚆</span>
            <h1 className="text-lg font-bold text-gray-900">기차·버스 실시간 조회</h1>
          </div>
          {notifPermission !== 'granted'
            ? <button onClick={requestNotification} className="text-xs bg-orange-100 text-orange-700 font-medium px-2.5 py-1 rounded-full hover:bg-orange-200 transition-all">🔔 알림 허용</button>
            : <span className="text-xs text-green-600 font-medium">🔔 알림 ON</span>
          }
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
        <SearchForm onSearch={handleSearch} loading={searchState === 'loading'} />

        {(hasResults || alertRefresh > 0) && (
          <div className="flex gap-0 bg-gray-100 rounded-xl p-1">
            <TabBtn active={tab === 'search'} onClick={() => setTab('search')}>
              조회 결과 {searchState === 'ok' && `(${schedules.length})`}
            </TabBtn>
            <TabBtn active={tab === 'alerts'} onClick={() => setTab('alerts')}>
              알림 목록
            </TabBtn>
          </div>
        )}

        {tab === 'search' && (
          <>
            {searchState === 'loading' && (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <svg className="animate-spin w-8 h-8 mb-3 text-blue-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <div className="text-sm">실시간 조회 중...</div>
              </div>
            )}

            {searchState === 'ok' && lastSearch && (
              <>
                <div className="text-sm text-gray-500 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span>{lastSearch.date}</span>
                    <span>·</span>
                    <span className="text-gray-800 font-semibold">{lastSearch.departure} → {lastSearch.arrival}</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">실시간</span>
                </div>
                <ScheduleResults schedules={schedules} onAlertCreated={handleAlertCreated} />
              </>
            )}

            {searchState === 'empty' && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-sm font-medium text-gray-600">해당 구간의 열차·버스가 없습니다</div>
                <div className="text-xs mt-1">날짜나 출발지/도착지를 다시 확인해주세요</div>
              </div>
            )}

            {searchState === 'error' && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">⚠️</div>
                <div className="text-sm font-medium text-gray-700">실시간 조회에 실패했습니다</div>
                <div className="text-xs text-gray-400 mt-1 max-w-xs mx-auto break-all">{errorMsg}</div>
                <div className="text-xs text-gray-400 mt-2">KORAIL 또는 SRT 서버가 일시적으로 응답하지 않을 수 있습니다</div>
                <button
                  onClick={() => lastSearch && handleSearch(lastSearch)}
                  className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all"
                >
                  다시 시도
                </button>
              </div>
            )}

            {searchState === 'idle' && (
              <div className="text-center py-14 text-gray-400">
                <div className="text-5xl mb-3">🚉</div>
                <div className="text-sm font-medium">출발지와 도착지를 선택하고</div>
                <div className="text-sm">조회 버튼을 눌러주세요</div>
              </div>
            )}
          </>
        )}

        {tab === 'alerts' && <AlertList refreshKey={alertRefresh} />}
      </main>

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
    <button onClick={onClick} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
      {children}
    </button>
  );
}

function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-all ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
