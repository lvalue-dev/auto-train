// 공공데이터포털 KORAIL 역 코드 (data.go.kr 기준)
export const KORAIL_STATION_CODES: Record<string, string> = {
  SEO:  '0001', // 서울
  YON:  '0003', // 용산
  SUS:  '0000', // 수서 (SRT 전용, KORAIL API 미지원)
  SUW:  '0015', // 수원 - 실제론 0015가 동대구. 수원은 별도 확인 필요
  CHN:  '0090', // 천안아산
  OSN:  '0095', // 오송
  DAJ:  '0010', // 대전
  DGU:  '0015', // 동대구
  GYG:  '0072', // 경주
  ULS:  '0093', // 울산(통도사)
  POH:  '0073', // 포항
  PSN:  '0020', // 부산
  GWJ:  '0036', // 광주송정
  MOK:  '0042', // 목포
  IKS:  '0046', // 익산
  JEJ2: '0047', // 전주
  GNW:  '0056', // 강릉
  WOJ:  '0109', // 원주
  DTN:  '0116', // 동탄
  PTJ:  '0113', // 평택지제
  GJG:  '0078', // 김천구미
  GJN:  '0103', // 공주
};

// KORAIL 열차 등급 코드
export const KORAIL_TRAIN_GRADES: Record<string, string> = {
  KTX: '100',
  ITX: '101',
  MUGUNGHWA: '104',
};

// 공공데이터포털 KOBUS 터미널 코드
export const KOBUS_TERMINAL_CODES: Record<string, string> = {
  SEO_B: '001', // 서울경부
  SEO_S: '003', // 서울남부
  SEO_D: '002', // 동서울
  INH:   '006', // 인천
  SUW_B: '009', // 수원
  DAJ_B: '017', // 대전복합
  DGU_B: '022', // 대구북부
  PSN_B: '013', // 부산
  GWJ_B: '021', // 광주
  JEJ_B: '025', // 전주
  CHN_B: '046', // 천안
  GNW_B: '031', // 강릉
  SKC:   '039', // 속초
};
