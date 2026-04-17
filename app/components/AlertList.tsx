'use client';

import { useEffect, useState, useCallback } from 'react';
import { Alert } from '../lib/types';
import { getAlerts, deleteAlert, saveAlert } from '../lib/alertStore';
import { generateSchedules } from '../lib/mockData';
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

  // Poll every 30 seconds for watching alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getAlerts();
      const watching = current.filter(a => a.status === 'watching');
      if (watching.length === 0) return;

      let changed = false;
      for (const alert of watching) {
        const schedules = generateSchedules(
          // We don't store codes, so we do a name-match best effort with mock data
          alert.departure,
          alert.arrival,
          alert.date,
          'all'
        );
        const match = schedules.find(s =>
          s.trainNo === alert.trainNo && s.departureTime === alert.departureTime
        );
        if (match) {
          const available =
            alert.seatClass === 'special' ? match.seats.special > 0
            : alert.seatClass === 'general' ? match.seats.general > 0
            : match.seats.standing > 0;

          if (available) {
            const updated = { ...alert, status: 'found' as const, notifiedAt: new Date().toISOString() };
            saveAlert(updated);
            changed = true;
            showBrowserNotification(alert);
          }
        }
      }
      if (changed) loadAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAlerts]);

  async function checkNow(alert: Alert) {
    setChecking(alert.id);
    await new Promise(r => setTimeout(r, 800));

    // Re-generate with fresh random
    const mockAvailable = Math.random() > 0.4;
    if (mockAvailable) {
      const updated = { ...alert, status: 'found' as const, notifiedAt: new Date().toISOString() };
      saveAlert(updated);
      showBrowserNotification(alert);
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
      {alerts.map(alert => (
        <div key={alert.id} className={`bg-white rounded-2xl shadow-sm border p-4 ${alert.status === 'found' ? 'border-green-300 bg-green-50' : ''}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${TRANSPORT_COLORS[alert.type]}`}>
                  {getTransportLabel(alert.type)}
                </span>
                <span className="text-xs text-gray-500">{alert.trainNo}</span>
                <StatusBadge status={alert.status} />
              </div>
              <div className="text-sm font-semibold text-gray-800">
                {alert.departure} → {alert.arrival}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {alert.date} {alert.departureTime} 출발 · {seatClassLabel(alert.seatClass)}
              </div>
              {alert.notifiedAt && (
                <div className="text-xs text-green-600 mt-0.5 font-medium">
                  ✅ {new Date(alert.notifiedAt).toLocaleString('ko-KR')} 자리 발견
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              {alert.status === 'watching' && (
                <button
                  onClick={() => checkNow(alert)}
                  disabled={checking === alert.id}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-2 py-1 rounded-lg transition-all disabled:opacity-50"
                >
                  {checking === alert.id ? '확인 중...' : '즉시 확인'}
                </button>
              )}
              {alert.status === 'found' && (
                <a
                  href="#"
                  onClick={e => e.preventDefault()}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-2 py-1 rounded-lg transition-all"
                >
                  예매하기
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
    found: { label: '자리 발견!', cls: 'bg-green-100 text-green-700' },
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
    new Notification(`🚆 빈자리 발견!`, {
      body: `${alert.departure} → ${alert.arrival} ${alert.departureTime} 출발 ${seatClassLabel(alert.seatClass)} 자리가 생겼습니다!`,
      icon: '/favicon.ico',
    });
  }
}
