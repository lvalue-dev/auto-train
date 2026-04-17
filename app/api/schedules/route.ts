import { NextRequest, NextResponse } from 'next/server';
import { KORAIL_STATION_CODES, KOBUS_TERMINAL_CODES } from '../../lib/apiCodes';
import { Schedule, TransportType } from '../../lib/types';

const API_KEY = process.env.DATA_GO_KR_API_KEY;

// ─── KORAIL ───────────────────────────────────────────────

async function fetchKorailSchedules(
  depCode: string,
  arrCode: string,
  date: string // YYYY-MM-DD
): Promise<Schedule[]> {
  const depId = KORAIL_STATION_CODES[depCode];
  const arrId = KORAIL_STATION_CODES[arrCode];
  if (!depId || !arrId || depId === '0000') return [];

  const yyyymmdd = date.replace(/-/g, '');
  const url = new URL('https://apis.data.go.kr/1613000/TrainInfoService/getStrtpntArivpntTrainInfo');
  url.searchParams.set('serviceKey', API_KEY!);
  url.searchParams.set('numOfRows', '100');
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('depPlaceId', depId);
  url.searchParams.set('arrPlaceId', arrId);
  url.searchParams.set('depPlandTime', yyyymmdd);
  url.searchParams.set('trainGradeCode', '00'); // 00 = 전체
  url.searchParams.set('_type', 'json');

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`KORAIL API error: ${res.status}`);

  const json = await res.json();
  const items = json?.response?.body?.items?.item;
  if (!items) return [];
  const list = Array.isArray(items) ? items : [items];

  return list.map((item: KorailItem, idx: number) => {
    const type = gradeToType(item.traingradename);
    const depTime = parseKorailTime(item.depplandtime);
    const arrTime = parseKorailTime(item.arrvplandtime);
    return {
      id: `korail-${depCode}-${arrCode}-${idx}-${date}`,
      type,
      trainNo: item.trainno,
      departure: { code: depCode, name: item.depplacename, type: 'train' },
      arrival: { code: arrCode, name: item.arrplacename, type: 'train' },
      departureTime: depTime,
      arrivalTime: arrTime,
      duration: calcDuration(item.depplandtime, item.arrvplandtime),
      price: item.adultcharge ?? 0,
      seats: {
        special: item.specSeatCnt ?? 0,
        general: item.gnrmSeatCnt ?? 0,
        standing: 0,
      },
      date,
    } satisfies Schedule;
  });
}

interface KorailItem {
  trainno: string;
  traingradename: string;
  depplandtime: string;
  arrvplandtime: string;
  adultcharge: number;
  specSeatCnt: number;
  gnrmSeatCnt: number;
  depplacename: string;
  arrplacename: string;
}

function parseKorailTime(t: string): string {
  // t = "20260417063000"
  return `${t.slice(8, 10)}:${t.slice(10, 12)}`;
}

function calcDuration(dep: string, arr: string): string {
  const depMin = Number(dep.slice(8, 10)) * 60 + Number(dep.slice(10, 12));
  const arrMin = Number(arr.slice(8, 10)) * 60 + Number(arr.slice(10, 12));
  const diff = arrMin - depMin;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function gradeToType(grade: string): TransportType {
  if (grade.includes('KTX')) return 'KTX';
  if (grade.includes('SRT')) return 'SRT';
  if (grade.includes('ITX') || grade.includes('새마을')) return 'ITX';
  if (grade.includes('무궁화') || grade.includes('누리로')) return 'MUGUNGHWA';
  return 'MUGUNGHWA';
}

// ─── KOBUS ────────────────────────────────────────────────

async function fetchKobusSchedules(
  depCode: string,
  arrCode: string,
  date: string
): Promise<Schedule[]> {
  const depId = KOBUS_TERMINAL_CODES[depCode];
  const arrId = KOBUS_TERMINAL_CODES[arrCode];
  if (!depId || !arrId) return [];

  const yyyymmdd = date.replace(/-/g, '');
  const url = new URL('https://apis.data.go.kr/1613000/ExpBusInfoService/getExpBusTimeTable');
  url.searchParams.set('serviceKey', API_KEY!);
  url.searchParams.set('numOfRows', '100');
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('depTerminalId', depId);
  url.searchParams.set('arrTerminalId', arrId);
  url.searchParams.set('depPlandTime', yyyymmdd);
  url.searchParams.set('_type', 'json');

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`KOBUS API error: ${res.status}`);

  const json = await res.json();
  const items = json?.response?.body?.items?.item;
  if (!items) return [];
  const list = Array.isArray(items) ? items : [items];

  return list.map((item: KobusItem, idx: number) => {
    const type: TransportType = item.gradeNm?.includes('우등') || item.gradeNm?.includes('프리미엄')
      ? 'EXPRESS_BUS' : 'INTERCITY_BUS';
    const depTime = `${String(item.depPlandTime).slice(8, 10)}:${String(item.depPlandTime).slice(10, 12)}`;
    const arrTime = `${String(item.arrPlandTime).slice(8, 10)}:${String(item.arrPlandTime).slice(10, 12)}`;
    return {
      id: `kobus-${depCode}-${arrCode}-${idx}-${date}`,
      type,
      trainNo: item.gradeNm ?? '일반',
      departure: { code: depCode, name: item.depTerminalNm, type: 'bus' },
      arrival: { code: arrCode, name: item.arrTerminalNm, type: 'bus' },
      departureTime: depTime,
      arrivalTime: arrTime,
      duration: calcDuration(String(item.depPlandTime), String(item.arrPlandTime)),
      price: item.charge ?? 0,
      seats: {
        special: 0,
        general: item.remainSeatCnt ?? 0,
        standing: 0,
      },
      date,
    } satisfies Schedule;
  });
}

interface KobusItem {
  depPlandTime: string | number;
  arrPlandTime: string | number;
  gradeNm: string;
  charge: number;
  remainSeatCnt: number;
  depTerminalNm: string;
  arrTerminalNm: string;
}

// ─── Route Handler ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const departure = searchParams.get('departure') ?? '';
  const arrival = searchParams.get('arrival') ?? '';
  const date = searchParams.get('date') ?? '';
  const type = (searchParams.get('type') ?? 'all') as 'all' | 'train' | 'bus';

  if (!departure || !arrival || !date) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'NO_API_KEY' }, { status: 503 });
  }

  try {
    const results: Schedule[] = [];

    if (type !== 'bus') {
      const trains = await fetchKorailSchedules(departure, arrival, date);
      results.push(...trains);
    }
    if (type !== 'train') {
      const buses = await fetchKobusSchedules(departure, arrival, date);
      results.push(...buses);
    }

    results.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    return NextResponse.json({ schedules: results, source: 'live' });
  } catch (err) {
    console.error('API fetch error:', err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
