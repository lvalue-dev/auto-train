import { NextRequest, NextResponse } from 'next/server';
import { KOBUS_TERMINAL_CODES } from '../../lib/apiCodes';
import { Schedule, TransportType } from '../../lib/types';

const DATA_KEY = process.env.DATA_GO_KR_API_KEY;

// ─── Station code → KORAIL Korean name ───────────────────
const KORAIL_NAME: Record<string, string> = {
  SEO: '서울', YON: '용산', SUW: '수원', CHN: '천안아산',
  OSN: '오송', DAJ: '대전', DGU: '동대구', GYG: '경주',
  ULS: '울산', POH: '포항', PSN: '부산', GWJ: '광주송정',
  MOK: '목포', IKS: '익산', JEJ2: '전주', GNW: '강릉',
  WOJ: '원주', DTN: '동탄', PTJ: '평택지제', GJG: '김천구미',
  GJN: '공주',
};

// ─── Station code → SRT station code ─────────────────────
const SRT_CODE: Record<string, string> = {
  SUS: '0551', DTN: '0552', PTJ: '0553', CHN: '0502',
  OSN: '0297', DAJ: '0010', GJN: '0514', IKS: '0030',
  GWJ: '0036', MOK: '0041', GJG: '0507', DGU: '0015',
  GYG: '0508', ULS: '0509', PSN: '0020',
};

// SRT 전용 출발역 (KORAIL API 불필요)
const SRT_ONLY_DEPARTURES = new Set(['SUS']);

const KORAIL_SEARCH = 'https://smart.letskorail.com:443/classes/com.korail.mobile.seatMovie.ScheduleView';
const SRT_SEARCH = 'https://app.srail.or.kr:443/ara/selectListAra10007_n.do';

// ─── KORAIL 모바일 API (키 불필요) ────────────────────────
async function fetchKorailMobile(
  depCode: string, arrCode: string, date: string
): Promise<Schedule[]> {
  const depName = KORAIL_NAME[depCode];
  const arrName = KORAIL_NAME[arrCode];
  if (!depName || !arrName) return [];

  const yyyymmdd = date.replace(/-/g, '');
  const params = new URLSearchParams({
    Device: 'AD', Version: '190725001',
    txtGoStart: depName, txtGoEnd: arrName,
    txtGoAbrdDt: yyyymmdd, txtGoHour: '000000',
    selGoTrain: '00',
    txtPsgFlg_1: '1', txtPsgFlg_2: '0', txtPsgFlg_3: '0',
    txtPsgFlg_4: '0', txtPsgFlg_5: '0',
    txtMenuId: '11', radJobId: '1',
  });

  const res = await fetch(`${KORAIL_SEARCH}?${params}`, {
    headers: { 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; Nexus 4 Build/LMY48T)' },
    cache: 'no-store',
  });
  if (!res.ok) return [];

  const json = await res.json();
  const raw = json?.trn_infos?.trn_info;
  if (!raw) return [];
  const list: KorailTrain[] = Array.isArray(raw) ? raw : [raw];

  return list.map((t, idx) => {
    const type = nameToType(t.h_trn_clsf_nm ?? '');
    const depTime = fmtTime(t.h_dpt_tm);
    const arrTime = fmtTime(t.h_arv_tm);
    return {
      id: `korail-${depCode}-${arrCode}-${idx}-${date}`,
      type,
      trainNo: t.h_trnNo ?? '',
      departure: { code: depCode, name: depName, type: 'train' },
      arrival: { code: arrCode, name: arrName, type: 'train' },
      departureTime: depTime,
      arrivalTime: arrTime,
      duration: diffTime(t.h_dpt_tm, t.h_arv_tm),
      price: Number(t.h_rcvd_fare ?? t.h_fare ?? 0),
      seats: {
        special: t.h_spe_rsv_cd === '11' ? 1 : 0,
        general: t.h_gen_rsv_cd === '11' ? 1 : 0,
        standing: 0,
      },
      date,
    } satisfies Schedule;
  });
}

interface KorailTrain {
  h_trnNo: string;
  h_trn_clsf_nm: string;
  h_dpt_tm: string;
  h_arv_tm: string;
  h_gen_rsv_cd: string;
  h_spe_rsv_cd: string;
  h_rcvd_fare?: string;
  h_fare?: string;
}

// ─── SRT 모바일 API (키 불필요) ───────────────────────────
async function fetchSrtMobile(
  depCode: string, arrCode: string, date: string
): Promise<Schedule[]> {
  const dptStn = SRT_CODE[depCode];
  const arvStn = SRT_CODE[arrCode];
  if (!dptStn || !arvStn) return [];

  const yyyymmdd = date.replace(/-/g, '');
  const body = new URLSearchParams({
    chtnDvCd: '1', arriveTime: 'N', seatAttCd: '015',
    psgNum: '1', trnGpCd: '109', stlbTrnClsfCd: '05',
    dptDt: yyyymmdd, dptTm: '000000',
    dptRsStnCd: dptStn, arvRsStnCd: arvStn,
  });

  const res = await fetch(SRT_SEARCH, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 4 Build/LMY48T) SRT-APP-Android V.1.0.6',
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    cache: 'no-store',
  });
  if (!res.ok) return [];

  const json = await res.json();
  const raw = json?.outDataSets?.dsOutput1;
  if (!raw) return [];
  const list: SrtTrain[] = Array.isArray(raw) ? raw : [raw];

  const depName = KORAIL_NAME[depCode] ?? depCode;
  const arrName = KORAIL_NAME[arrCode] ?? arrCode;

  return list.map((t, idx) => {
    const depTime = fmtTime(String(t.dptTm ?? ''));
    const arrTime = fmtTime(String(t.arvTm ?? ''));
    const general = String(t.gnrmRsvPsbStr ?? '').includes('예약가능');
    const special = String(t.sprmRsvPsbStr ?? '').includes('예약가능');
    return {
      id: `srt-${depCode}-${arrCode}-${idx}-${date}`,
      type: 'SRT' as TransportType,
      trainNo: `SRT ${t.trnNo ?? ''}`,
      departure: { code: depCode, name: depName, type: 'train' },
      arrival: { code: arrCode, name: arrName, type: 'train' },
      departureTime: depTime,
      arrivalTime: arrTime,
      duration: diffTime(String(t.dptTm ?? ''), String(t.arvTm ?? '')),
      price: Number(t.dptRsStnConsgnAmt ?? t.dptNrmlAmt ?? 0),
      seats: { special: special ? 1 : 0, general: general ? 1 : 0, standing: 0 },
      date,
    } satisfies Schedule;
  });
}

interface SrtTrain {
  trnNo: string;
  dptTm: string | number;
  arvTm: string | number;
  gnrmRsvPsbStr: string;
  sprmRsvPsbStr: string;
  dptRsStnConsgnAmt?: string;
  dptNrmlAmt?: string;
}

// ─── KOBUS (data.go.kr 키 필요) ───────────────────────────
async function fetchKobus(
  depCode: string, arrCode: string, date: string
): Promise<Schedule[]> {
  if (!DATA_KEY) return [];
  const depId = KOBUS_TERMINAL_CODES[depCode];
  const arrId = KOBUS_TERMINAL_CODES[arrCode];
  if (!depId || !arrId) return [];

  const yyyymmdd = date.replace(/-/g, '');
  const url = new URL('https://apis.data.go.kr/1613000/ExpBusInfoService/getExpBusTimeTable');
  url.searchParams.set('serviceKey', DATA_KEY);
  url.searchParams.set('numOfRows', '100');
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('depTerminalId', depId);
  url.searchParams.set('arrTerminalId', arrId);
  url.searchParams.set('depPlandTime', yyyymmdd);
  url.searchParams.set('_type', 'json');

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  const items = json?.response?.body?.items?.item;
  if (!items) return [];
  const list = Array.isArray(items) ? items : [items];

  return list.map((item: KobusItem, idx: number) => {
    const type: TransportType = item.gradeNm?.includes('우등') ? 'EXPRESS_BUS' : 'INTERCITY_BUS';
    const depTime = `${String(item.depPlandTime).slice(8, 10)}:${String(item.depPlandTime).slice(10, 12)}`;
    const arrTime = `${String(item.arrPlandTime).slice(8, 10)}:${String(item.arrPlandTime).slice(10, 12)}`;
    return {
      id: `kobus-${depCode}-${arrCode}-${idx}-${date}`,
      type, trainNo: item.gradeNm ?? '일반',
      departure: { code: depCode, name: item.depTerminalNm, type: 'bus' },
      arrival: { code: arrCode, name: item.arrTerminalNm, type: 'bus' },
      departureTime: depTime, arrivalTime: arrTime,
      duration: diffKobus(String(item.depPlandTime), String(item.arrPlandTime)),
      price: item.charge ?? 0,
      seats: { special: 0, general: item.remainSeatCnt ?? 0, standing: 0 },
      date,
    } satisfies Schedule;
  });
}

interface KobusItem {
  depPlandTime: string | number; arrPlandTime: string | number;
  gradeNm: string; charge: number; remainSeatCnt: number;
  depTerminalNm: string; arrTerminalNm: string;
}

// ─── 유틸 ─────────────────────────────────────────────────
function fmtTime(t: string): string {
  const s = t.replace(/\D/g, '');
  if (s.length < 4) return '00:00';
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
}

function diffTime(dep: string, arr: string): string {
  const dm = Number(dep.slice(0, 2)) * 60 + Number(dep.slice(2, 4));
  const am = Number(arr.slice(0, 2)) * 60 + Number(arr.slice(2, 4));
  const diff = (am - dm + 1440) % 1440;
  const h = Math.floor(diff / 60), m = diff % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function diffKobus(dep: string, arr: string): string {
  return diffTime(dep.slice(8, 14), arr.slice(8, 14));
}

function nameToType(name: string): TransportType {
  if (name.includes('KTX')) return 'KTX';
  if (name.includes('SRT')) return 'SRT';
  if (name.includes('ITX') || name.includes('새마을')) return 'ITX';
  return 'MUGUNGHWA';
}

// ─── Route handler ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const departure = sp.get('departure') ?? '';
  const arrival   = sp.get('arrival') ?? '';
  const date      = sp.get('date') ?? '';
  const type      = (sp.get('type') ?? 'all') as 'all' | 'train' | 'bus';

  if (!departure || !arrival || !date) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  const results: Schedule[] = [];

  if (type !== 'bus') {
    const isSrtDep = SRT_ONLY_DEPARTURES.has(departure);
    const hasSrtCode = !!SRT_CODE[departure] && !!SRT_CODE[arrival];
    const hasKorailName = !!KORAIL_NAME[departure] && !!KORAIL_NAME[arrival];

    const [srtRes, korailRes] = await Promise.allSettled([
      hasSrtCode ? fetchSrtMobile(departure, arrival, date) : Promise.resolve([]),
      (!isSrtDep && hasKorailName) ? fetchKorailMobile(departure, arrival, date) : Promise.resolve([]),
    ]);

    if (srtRes.status === 'fulfilled') results.push(...srtRes.value);
    if (korailRes.status === 'fulfilled') results.push(...korailRes.value);
  }

  if (type !== 'train') {
    const buses = await fetchKobus(departure, arrival, date).catch(() => []);
    results.push(...buses);
  }

  // API에서 아무것도 못 가져왔으면 mock으로 폴백하라고 알림
  if (results.length === 0) {
    return NextResponse.json({ error: 'NO_RESULTS' }, { status: 404 });
  }

  results.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  return NextResponse.json({ schedules: results, source: 'live' });
}
