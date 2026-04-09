export interface BookmarkNode {
  id: string
  title: string
  titleMn: string
  children: BookmarkNode[]
}

export interface SectionContent {
  title: string
  titleMn: string
  content: string
  segments?: LiturgicalSegment[]
  page?: number
  level: number
  liturgicalRole?: LiturgicalRole
}

/** Segment types for structured liturgical content rendering */
export type SegmentType =
  | 'body'           // 기도문 본문 (기본)
  | 'rubric'         // 사제 지시문 (빨간색)
  | 'response'       // 회중 응답 (- 접두사 라인)
  | 'psalm-ref'      // "Дуулал 141:1-9" 시편 참조
  | 'scripture-ref'  // "Ром 11:25" 성경 참조
  | 'doxology'       // "Эцэг, Хүү, Ариун Сүнсэнд жавхланг..."
  | 'section-marker' // "Уншлага", "Хариу залбирал" 등 구조 마커
  | 'subtitle'       // 시편 소제목/설명
  | 'seasonal-note'  // 전례시기별 안티폰 지시

/** A typed segment within a prayer section */
export interface LiturgicalSegment {
  type: SegmentType
  text: string
}

/** Canonical liturgical element roles */
export type LiturgicalRole =
  | 'invitatory'       // 초대찬미 (Урих дуудлага)
  | 'hymn'             // 찬미가 (Магтуу)
  | 'psalm'            // 시편 (Дуулал)
  | 'canticle'         // 찬가 (Магтаал / Шад магтаал)
  | 'reading'          // 짧은 독서 (Уншлага)
  | 'responsory'       // 짧은 응답송 (Хариу залбирал)
  | 'gospel-canticle'  // 복음 찬가 (Мариагийн/Захариасын/Симеоны магтаал)
  | 'intercessions'    // 청원 기도 (Гуйлтын залбирал)
  | 'concluding'       // 마침 기도 (Төгсгөлийн даатгал залбирал)
  | 'continuation'     // 이전 섹션의 연속

/** A single step in a prayer flow sequence */
export interface PrayerFlowStep {
  order: number
  liturgicalRole: LiturgicalRole | 'opening' | 'our-father' | 'dismissal'
  label: string           // 한국어 표시명
  labelMn: string         // 몽골어 표시명
  source: 'psalter' | 'propers' | 'hymns' | 'fixed'
  sectionId?: string      // 해당 섹션 ID (있으면)
  pageRef?: number        // 실물 책 페이지 (앱에 없는 경우)
  isGap: boolean          // 앱에 콘텐츠 없음
}

/** A complete prayer flow for one hour of one day */
export interface PrayerFlow {
  week: number            // 1-4
  day: string             // 요일 (몽골어)
  dayKo: string           // 요일 (한국어)
  hour: 'morning' | 'evening'
  steps: PrayerFlowStep[]
}

export interface ReaderSettings {
  fontSize: number       // 16-28
  darkMode: boolean
  sidebarOpen: boolean
  lastSectionId: string | null
}

/** content 분할 단위: week1, week2, week3, week4, propers, hymns */
export type ContentGroup = "week1" | "week2" | "week3" | "week4" | "propers" | "hymns"
