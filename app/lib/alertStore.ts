'use client';

import { Alert } from './types';

const STORAGE_KEY = 'transport_alerts';

export function getAlerts(): Alert[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveAlert(alert: Alert): void {
  const alerts = getAlerts();
  const existing = alerts.findIndex(a => a.id === alert.id);
  if (existing >= 0) {
    alerts[existing] = alert;
  } else {
    alerts.push(alert);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function deleteAlert(id: string): void {
  const alerts = getAlerts().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function createAlert(params: Omit<Alert, 'id' | 'createdAt' | 'status'>): Alert {
  const alert: Alert = {
    ...params,
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    status: 'watching',
    createdAt: new Date().toISOString(),
  };
  saveAlert(alert);
  return alert;
}
