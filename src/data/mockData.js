// 지금은 프론트 목업 데이터. 추후 백엔드 6개 에이전트 API로 교체 예정.
// 데이터 구조를 API 응답 형태에 최대한 가깝게 미리 맞춰둠.

export const documents = [
  {
    id: "doc-1",
    title: "2026학년도 SW인재 장학금",
    type: "신청형 문서",
    dday: -5,
    status: "in_progress", // in_progress | needs_review | done
  },
  {
    id: "doc-2",
    title: "9월 관리비 고지서",
    type: "납부형 문서",
    dday: -7,
    status: "needs_review",
  },
  {
    id: "doc-3",
    title: "기숙사 재계약 안내",
    type: "계약·갱신형 문서",
    dday: -18,
    status: "in_progress",
  },
];

// 원문 근거 검증 결과를 포함한 분석 상세 (제안서 3페이지 예시 기반)
export const analysisDetail = {
  id: "doc-1",
  docType: "장학금 신청 공지",
  applicantCriteria: [
    { text: "2026학년도 재학생", confidence: 95 },
    { text: "직전 학기 평균 평점 3.5 이상", confidence: 91 },
  ],
  todos: [
    { id: "t1", text: "성적증명서 발급", confidence: 93 },
    { id: "t2", text: "신청서 작성", confidence: 96 },
    { id: "t3", text: "학생포털에서 서류 제출", confidence: 72 },
  ],
  deadline: { text: "2026년 9월 25일 17:00", confidence: 98 },
  requiredDocs: ["신청서", "성적증명서", "통장 사본"],
  evidence: {
    location: "공지문 2페이지 3~6번째 문장",
    sourceExcerpt:
      "본교 재학생을 대상으로 2026학년도 SW인재 장학금 신청을 아래와 같이 안내합니다. 신청 대상은 2026학년도 재학생이며 직전 학기 평균 평점 3.5 이상인 자에 한합니다. 신청서, 성적증명서, 통장 사본을 구비하여 학생포털을 통해 제출하시기 바랍니다. 접수 마감은 2026년 9월 25일 17시까지입니다.",
    fields: [
      { label: "신청 대상", value: "2026학년도 재학생 / 평점 3.5 이상", confidence: 91 },
      { label: "마감일", value: "2026년 9월 25일 17:00", confidence: 98 },
      { label: "제출 방법", value: "학생포털 업로드", confidence: 72 },
    ],
  },
};

export const actionPlan = {
  id: "doc-1",
  title: "2026학년도 SW인재 장학금",
  steps: [
    { id: "s1", date: "9월 20일", label: "성적증명서 발급", done: true },
    { id: "s2", date: "9월 22일", label: "신청서 작성", done: true },
    { id: "s3", date: "9월 24일", label: "최종 확인 및 제출", done: false },
    { id: "s4", date: "9월 25일 17:00", label: "신청 마감", done: false, isDeadline: true },
  ],
};

export const managementItems = [
  {
    id: "doc-1",
    title: "2026학년도 SW인재 장학금",
    progress: 0.5,
    steps: [
      { id: "s1", label: "성적증명서 발급", done: true },
      { id: "s2", label: "신청서 작성", done: true },
      { id: "s3", label: "최종 확인", done: false },
      { id: "s4", label: "제출 완료", done: false },
    ],
    reminders: ["9월 24일 (수) 최종 확인 알림", "9월 25일 (목) 17:00 마감 임박 알림"],
  },
];

export const homeUpcoming = [
  { id: "doc-1", title: "SW인재 장학금", dday: -5 },
  { id: "doc-2", title: "관리비 고지서", dday: -7 },
  { id: "doc-3", title: "기숙사 재계약", dday: -18 },
];
