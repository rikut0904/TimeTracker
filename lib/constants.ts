// グループ選択の特殊値
export const GROUP_VALUES = {
    NONE: "__none__",
    NEW: "__new__",
} as const

// セッションタイプ
export const SESSION_TYPES = {
    INDIVIDUAL: "individual",
    GROUP: "group",
} as const

// セッションステータス
export const SESSION_STATUS = {
    PLANNED: "planned",
    COMPLETED: "completed",
} as const

// フィルター値
export const FILTER_VALUES = {
    ALL: "all",
} as const

// デフォルト目標時間
export const DEFAULT_GOALS = {
    INDIVIDUAL: 90,
    GROUP: 45,
} as const

// セッション時間オプション
export const DURATION_OPTIONS = [30, 60, 90, 120] as const 