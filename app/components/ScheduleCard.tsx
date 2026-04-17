'use client';

import { Schedule } from '../lib/types';
import { getTransportLabel, TRANSPORT_COLORS, TRANSPORT_TEXT_COLORS } from '../lib/mockData';
import { createAlert } from '../lib/alertStore';

interface Props {
  schedule: Schedule;
  onAlertCreated: () => void;
}

export default function ScheduleCard({ schedule, onAlertCreated }: Props) {
  const totalSeats = schedule.seats.special + schedule.seats.general + schedule.seats.standing;
  const soldOut = totalSeats === 0;

  function handleSetAlert(seatClass: 'special' | 'general' | 'standing') {
    createAlert({
      scheduleId: schedule.id,
      trainNo: schedule.trainNo,
      type: schedule.type,
      departure: schedule.departure.name,
      arrival: schedule.arrival.name,
      date: schedule.date,
      departureTime: schedule.departureTime,
      seatClass,
    });
    onAlertCreated();
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md ${soldOut ? 'opacity-70' : ''}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${TRANSPORT_COLORS[schedule.type]}`}>
            {getTransportLabel(schedule.type)}
          </span>
          <span className="text-xs text-gray-400">{schedule.trainNo}</span>
        </div>

        {/* Time row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{schedule.departureTime}</div>
            <div className="text-xs text-gray-500">{schedule.departure.name}</div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="text-xs text-gray-400 mb-0.5">{schedule.duration}</div>
            <div className="w-full flex items-center gap-1">
              <div className="flex-1 h-px bg-gray-200"/>
              <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{schedule.arrivalTime}</div>
            <div className="text-xs text-gray-500">{schedule.arrival.name}</div>
          </div>
          <div className="text-right ml-2">
            <div className={`text-lg font-bold ${TRANSPORT_TEXT_COLORS[schedule.type]}`}>
              {schedule.price.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* Seat info */}
        {soldOut ? (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <SeatBadge label="특실" count={0} />
              <SeatBadge label="일반실" count={0} />
            </div>
            <button
              onClick={() => handleSetAlert('general')}
              className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
            >
              <span>🔔</span> 빈자리 알림
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {schedule.seats.special > 0 && <SeatBadge label="특실" count={schedule.seats.special} available />}
              {schedule.seats.general > 0 && <SeatBadge label="일반실" count={schedule.seats.general} available />}
              {schedule.seats.standing > 0 && <SeatBadge label="입석" count={schedule.seats.standing} available />}
              {schedule.seats.special === 0 && <SeatBadge label="특실" count={0} />}
              {schedule.seats.general === 0 && <SeatBadge label="일반실" count={0} />}
            </div>
            <div className="flex gap-2">
              {schedule.seats.general === 0 && (
                <button
                  onClick={() => handleSetAlert('general')}
                  className="flex-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  <span>🔔</span> 일반실 알림
                </button>
              )}
              {schedule.seats.special === 0 && (
                <button
                  onClick={() => handleSetAlert('special')}
                  className="flex-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  <span>🔔</span> 특실 알림
                </button>
              )}
              {totalSeats > 0 && (
                <a
                  href="#"
                  onClick={e => e.preventDefault()}
                  className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  예매하기
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SeatBadge({ label, count, available }: { label: string; count: number; available?: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      available && count > 0
        ? count < 10
          ? 'bg-red-50 text-red-600 border border-red-200'
          : 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-gray-50 text-gray-400 border border-gray-200'
    }`}>
      {label} {available && count > 0 ? `${count}석` : '매진'}
    </span>
  );
}
