export const SPORT_OPTIONS = [
  { value: "tennis", label: "Tennis", emoji: "🎾" },
  { value: "basketball", label: "Basketball", emoji: "🏀" },
  { value: "badminton", label: "Badminton", emoji: "🏸" },
  { value: "football", label: "Football", emoji: "⚽" },
  { value: "pickleball", label: "Pickleball", emoji: "🏓" },
  { value: "volleyball", label: "Volleyball", emoji: "🏐" },
  { value: "table_tennis", label: "Table Tennis", emoji: "🏓" },
  { value: "running", label: "Running", emoji: "🏃" },
  { value: "swimming", label: "Swimming", emoji: "🏊" },
  { value: "cycling", label: "Cycling", emoji: "🚴" },
  { value: "gym", label: "Gym", emoji: "🏋️" },
  { value: "yoga", label: "Yoga", emoji: "🧘" },
  { value: "golf", label: "Golf", emoji: "⛳" },
  { value: "boxing", label: "Boxing", emoji: "🥊" },
  { value: "martial_arts", label: "Martial Arts", emoji: "🥋" },
  { value: "other", label: "Other", emoji: "🏅" },
] as const;

export type SportOptionValue = (typeof SPORT_OPTIONS)[number]["value"];

export const SPORT_ICON_BY_VALUE = SPORT_OPTIONS.reduce(
  (acc, sport) => ({ ...acc, [sport.value]: sport.emoji }),
  {} as Record<SportOptionValue, string>
);

export const SPORT_LABEL_BY_VALUE = SPORT_OPTIONS.reduce(
  (acc, sport) => ({ ...acc, [sport.value]: sport.label }),
  {} as Record<SportOptionValue, string>
);

export const LOCATION_OPTIONS = [
  "District 1, Ho Chi Minh City",
  "District 3, Ho Chi Minh City",
  "District 4, Ho Chi Minh City",
  "District 5, Ho Chi Minh City",
  "District 7, Ho Chi Minh City",
  "District 10, Ho Chi Minh City",
  "Binh Thanh, Ho Chi Minh City",
  "Phu Nhuan, Ho Chi Minh City",
  "Tan Binh, Ho Chi Minh City",
  "Go Vap, Ho Chi Minh City",
  "Thu Duc, Ho Chi Minh City",
  "Binh Chanh, Ho Chi Minh City",
  "District 2, Ho Chi Minh City",
  "District 6, Ho Chi Minh City",
  "District 8, Ho Chi Minh City",
  "District 11, Ho Chi Minh City",
  "District 12, Ho Chi Minh City",
] as const;

export const SKILL_LEVEL_OPTIONS = [
  {
    value: "casual",
    label: "Casual",
    description: "New or relaxed player, prioritizes fun and light pace.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Plays regularly, knows the rules, can keep a stable rally or game rhythm.",
  },
  {
    value: "competitive",
    label: "Competitive",
    description: "Trains seriously, wants high tempo, scoring pressure, and strong opponents.",
  },
] as const;

export type SkillLevelOptionValue = (typeof SKILL_LEVEL_OPTIONS)[number]["value"];
