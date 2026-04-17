import { NextRequest, NextResponse } from 'next/server';
import { TransportType } from '../../lib/types';

// ─── Station name → KORAIL API name ───────────────────────
const KORAIL_NAME: Record<string, string> = {
  '서울': '서울',
  '용산': '용산',
  '수원': '수원',
  '천안아산': '천안아산',
  '오송': '오송',
  '대전': '대전',
  '동대구': '동대구',
  '신경주': '신경주',
  '경주': '경주',
  '울산': '울산',
  '포항': '포항',
  '부산': '부산',
  '광주송정': '광주송정',
  '목포': '목포',
  '익산': '익산',
  '전주': '전주',
  '강릉': '강릉',
  '원주': '원주',
  '동탄': '동탄',
  '평택지제': '평택지제',
  '김천구미': '김천구미',
  '공주': '공주',
};

// ─── Station name → SRT station code ──────────────────────
const SRT_CODE: Record<string, string> = {
  '수서(SRT)': '0551',
  '수서': '0551',
  '동탄': '0552',
  '평택지제': '0553',
  '지제': '0553',
  '천안아산': '0502',
  '오송': '0297',
  '대전': '0010',
  '공주': '0514',
  '익산': '0030',
  '정읍': '0033',
  '광주송정': '0036',
  '나주': '0037',
  '목포': '0041',
  '김천구미': '0507',
  '서대구': '0506',
  '동대구': '0015',
  '신경주': '0508',
  '울산(통도사)': '0509',
  '울산': '0509',
  '부산': '0020',
};

const KORAIL_SEARCH = 'https://smart.letskorail.com:443/classes/com.korail.mobile.seatMovie.ScheduleView';
const SRT_SEARCH = 'https://app.srail.or.kr:443/ara/selectListAra10007_n.do';

interface SeatResult {
  general: boolean;
  special: boolean;
  available: boolean;
  source: 'korail' | 'srt';
}

// ─── KORAIL 잔여석 조회 ────────────────────────────────────
async function checkKorail(
  departure: string,
  arrival: string,
  date: string,
  departureTime: string // "HH:MM"
): Promise<SeatResult | null> {
  const depName = KORAIL_NAME[departure] ?? departure;
  const arrName = KORAIL_NAME[arrival] ?? arrival;
  const yyyymmdd = date.replace(/-/g, '');
  const hhmm = departureTime.replace(':', '');

  const params = new URLSearchParams({
    Device: 'AD',
    Version: '190725001',
    txtGoStart: depName,
    txtGoEnd: arrName,
    txtGoAbrdDt: yyyymmdd,
    txtGoHour: `${hhmm}00`,
    selGoTrain: '00',
    txtPsgFlg_1: '1',
    txtPsgFlg_2: '0',
    txtPsgFlg_3: '0',
    txtPsgFlg_4: '0',
    txtPsgFlg_5: '0',
    txtMenuId: '11',
    radJobId: '1',
  });

  const res = await fetch(`${KORAIL_SEARCH}?${params}`, {
    headers: {
      'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; Nexus 4 Build/LMY48T)',
    },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const json = await res.json();

  const raw = json?.trn_infos?.trn_info;
  if (!raw) return null;
  const trains: KorailTrain[] = Array.isArray(raw) ? raw : [raw];

  // 출발 시간으로 매칭 (HHmm 비교)
  const target = hhmm;
  const match = trains.find(t => t.h_dpt_tm?.slice(0, 4) === target);
  if (!match) return null;

  return {
    general: match.h_gen_rsv_cd === '11',
    special: match.h_spe_rsv_cd === '11',
    available: match.h_gen_rsv_cd === '11' || match.h_spe_rsv_cd === '11',
    source: 'korail',
  };
}

interface KorailTrain {
  h_trnNo: string;
  h_dpt_tm: string;      // "HHmmss"
  h_gen_rsv_cd: string;  // "11"=예약가능, "13"=매진
  h_spe_rsv_cd: string;
}

// ─── SRT 잔여석 조회 ──────────────────────────────────────
async function checkSrt(
  departure: string,
  arrival: string,
  date: string,
  departureTime: string
): Promise<SeatResult | null> {
  const dptCode = SRT_CODE[departure];
  const arvCode = SRT_CODE[arrival];
  if (!dptCode || !arvCode) return null;

  const yyyymmdd = date.replace(/-/g, '');
  const hhmm = departureTime.replace(':', '');

  const body = new URLSearchParams({
    chtnDvCd: '1',
    arriveTime: 'N',
    seatAttCd: '015',
    psgNum: '1',
    trnGpCd: '109',
    stlbTrnClsfCd: '05',
    dptDt: yyyymmdd,
    dptTm: `${hhmm}00`,
    arvRsStnCd: arvCode,
    dptRsStnCd: dptCode,
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

  if (!res.ok) return null;
  const json = await res.json();

  const raw = json?.outDataSets?.dsOutput1;
  if (!raw) return null;
  const trains: SrtTrain[] = Array.isArray(raw) ? raw : [raw];

  // 출발 시간으로 매칭
  const match = trains.find(t => {
    const tm = String(t.dptTm ?? '');
    return tm.slice(0, 4) === hhmm;
  });
  if (!match) return null;

  const general = String(match.gnrmRsvPsbStr ?? '').includes('예약가능');
  const special = String(match.sprmRsvPsbStr ?? '').includes('예약가능');

  return { general, special, available: general || special, source: 'srt' };
}

interface SrtTrain {
  dptTm: string;
  gnrmRsvPsbStr: string;
  sprmRsvPsbStr: string;
}

// ─── Route handler ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') as TransportType;
  const departure = sp.get('departure') ?? '';
  const arrival = sp.get('arrival') ?? '';
  const date = sp.get('date') ?? '';
  const departureTime = sp.get('departureTime') ?? '';

  if (!departure || !arrival || !date || !departureTime) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  try {
    let result: SeatResult | null = null;

    if (type === 'SRT') {
      result = await checkSrt(departure, arrival, date, departureTime);
    } else {
      // KTX, ITX, 무궁화 → KORAIL API
      result = await checkKorail(departure, arrival, date, departureTime);
    }

    if (!result) {
      return NextResponse.json({ error: 'train not found or API unavailable' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('check-seats error:', err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
