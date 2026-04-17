'use client';

import { useEffect, useState, useCallback } from 'react';
import { Alert } from '../lib/types';
import { getAlerts, deleteAlert, saveAlert } from '../lib/alertStore';
import { getTransportLabel, TRANSPORT_COLORS } from '../lib/mockData';

interface Props {
  refreshKey: number;
}

export default function AlertList({ refreshKey }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checking, setChecking] = useState<string | null>(null);

  const loadAlerts = useCallback(() => {
    setAlerts(getAlerts());
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts, refreshKey]);

  // 실제 API로 잔여석 확인
  async function checkSeats(alert: Alert): Promise<boolean | null> {
    const params = new URLSearchParams({
      type: alert.type,
      departure: alert.departure,
      arrival: alert.arrival,
      date: alert.date,
      departureTime: alert.departureTime,
    });

    try {
      const res = await fetch(`/api/check-seats?${params}`);
      if (!res.ok) return null;
      const data = await res.json();

      if (alert.seatClass === 'special') return data.special === true;
      if (alert.seatClass === 'general') return data.general === true;
      return data.available === true;
    } catch {
      return null;
    }
  }

  // 30초마다 watching 알림 자동 체크
  useEffect(() => {
    const interval = setInterval(async () => {
      const current = getAlerts().filter(a => a.status === 'watching');
      if (current.length === 0) return;

      let changed = false;
      for (const alert of current) {
        const available = await checkSeats(alert);
        if (available === true) {
          saveAlert({ ...alert, status: 'found', notifiedAt: new Date().toISOString() });
          changed = true;
          showBrowserNotification(alert);
        }
      }
      if (changed) loadAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAlerts]);

  async function handleCheckNow(alert: Alert) {
    setChecking(alert.id);
    const available = await checkSeats(alert);
    if (available === true) {
      saveAlert({ ...alert, status: 'found', notifiedAt: new Date().toISOString() });
      showBrowserNotification(alert);
    } else if (available === null) {
      // API 오류 - 상태 유지
    }
    loadAlerts();
    setChecking(null);
  }

  function handleDelete(id: string) {
    deleteAlert(id);
    loadAlerts();
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <div className="text-4xl mb-2">🔕</div>
        <div className="text-sm">등록된 알림이 없습니다</div>
        <div className="text-xs mt-1">매진된 편을 조회하면 알림을 설정할 수 있어요</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400 text-center">30초마다 실시간 자동 확인 중</div>
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`bg-white rounded-2xl shadow-sm border p-4 ${alert.status === 'found' ? 'border-green-300 bg-green-50' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${TRANSPORT_COLORS[alert.type]}`}>
                  {getTransportLabel(alert.type)}
                </span>
                <StatusBadge status={alert.status} />
              </div>
              <div className="text-sm font-semibold text-gray-800">
                {alert.departure} → {alert.arrival}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {alert.date} {alert.departureTime} 출발 · {seatClassLabel(alert.seatClass)}
              </div>
              {alert.status === 'watching' && (
                <div className="text-xs text-yellow-600 mt-0.5 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"/>
                  실시간 모니터링 중
                </div>
              )}
              {alert.notifiedAt && (
                <div className="text-xs text-green-600 mt-0.5 font-medium">
                  ✅ {new Date(alert.notifiedAt).toLocaleString('ko-KR')} 자리 발견
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              {alert.status === 'watching' && (
                <button
                  onClick={() => handleCheckNow(alert)}
                  disabled={checking === alert.id}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {checking === alert.id ? '확인 중...' : '지금 확인'}
                </button>
              )}
              {alert.status === 'found' && (
                <a
                  href={alert.type === 'SRT' ? 'https://etk.srail.kr' : 'https://www.korail.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-2.5 py-1 rounded-lg transition-all whitespace-nowrap"
                >
                  예매하러 가기 →
                </a>
              )}
              <button
                onClick={() => handleDelete(alert.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Alert['status'] }) {
  const map = {
    watching: { label: '모니터링 중', cls: 'bg-yellow-100 text-yellow-700' },
    found: { label: '🎉 자리 발견!', cls: 'bg-green-100 text-green-700' },
    booked: { label: '예매 완료', cls: 'bg-blue-100 text-blue-700' },
    expired: { label: '만료', cls: 'bg-gray-100 text-gray-500' },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function seatClassLabel(cls: Alert['seatClass']): string {
  return { special: '특실', general: '일반실', standing: '입석' }[cls];
}

function showBrowserNotification(alert: Alert) {
  if (typeof window === 'undefined') return;
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🚆 빈자리 발견!', {
      body: `${alert.departure} → ${alert.arrival} ${alert.departureTime} 출발 ${seatClassLabel(alert.seatClass)} 예약 가능합니다!`,
      icon: '/favicon.ico',
    });
  }
}
