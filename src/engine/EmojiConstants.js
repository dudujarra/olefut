/**
 * EmojiConstants.js — Centralized semantic emoji/icon constants
 *
 * Mandamento Brutal #3: Zero emoji em código novo.
 * All UI-facing emojis MUST come from this module.
 * 
 * Usage:
 *   import { ICONS } from '../engine/EmojiConstants.js';
 *   const msg = `${ICONS.GOAL} Gol de ${scorer}!`;
 *
 * Categories follow engine domain model:
 * - MATCH: in-game match events
 * - FINANCE: money, transfers, contracts
 * - STAFF: staff roles and medical
 * - TACTICS: formations, training, tactics
 * - CARDS: discipline (yellow/red)
 * - MOOD: morale, emotions, board
 * - CAREER: career milestones, achievements
 * - NARRATIVE: story events, press, atmosphere
 * - SCOUT: scouting regions and discovery
 * - UI: general UI indicators
 */

// ============================================================
// MATCH EVENTS
// ============================================================
export const MATCH = {
  GOAL:        '\u26BD',  // ⚽
  OWN_GOAL:    '\u26BD',  // ⚽ (contextualized by text)
  PENALTY:     '\u26BD',  // ⚽
  SAVE:        '\u{1F9E4}', // 🧤
  INJURY:      '\u{1F915}', // 🤕
  SUBSTITUTION:'\u{1F504}', // 🔄
  WHISTLE:     '\u{1F4E2}', // 📢
  VAR:         '\u{1F4FA}', // 📺
  DERBY:       '\u26A1',  // ⚡
  CONDITION_RAIN: '\u{1F327}\uFE0F', // 🌧️
  CONDITION_HEAT: '\u{1F525}', // 🔥
  CONDITION_PACKED: '\u{1F3DF}\uFE0F', // 🏟️
  CONDITION_NIGHT: '\u{1F319}', // 🌙
  CONDITION_TV: '\u{1F4FA}', // 📺
  CONDITION_NORMAL: '\u2600\uFE0F', // ☀️
};

// ============================================================
// DISCIPLINE
// ============================================================
export const CARDS = {
  YELLOW:     '\u{1F7E8}', // 🟨
  RED:        '\u{1F7E5}', // 🟥
  SUSPENSION: '\u{1F6AB}', // 🚫
};

// ============================================================
// FINANCE & TRANSFERS
// ============================================================
export const FINANCE = {
  MONEY:       '\u{1F4B0}', // 💰
  CHART_UP:    '\u{1F4C8}', // 📈
  CHART_DOWN:  '\u{1F4C9}', // 📉
  CONTRACT:    '\u{1F4DD}', // 📝
  SALARY:      '\u{1F4B8}', // 💸
  TROPHY:      '\u{1F3C6}', // 🏆
  PRIZE:       '\u{1F3C6}', // 🏆
  TAX:         '\u{1F3DB}\uFE0F', // 🏛️
  WARNING:     '\u26A0\uFE0F', // ⚠️
  DISASTER:    '\u26A0\uFE0F', // ⚠️
};

// ============================================================
// STAFF & MEDICAL
// ============================================================
export const STAFF = {
  PHYSIO:      '\u{1F3E5}', // 🏥
  SCOUT:       '\u{1F50D}', // 🔍
  FITNESS:     '\u{1F4AA}', // 💪
  FINANCE_DIR: '\u{1F4B0}', // 💰
  YOUTH_COACH: '\u{1F393}', // 🎓
};

// ============================================================
// TRAINING & TACTICS
// ============================================================
export const TRAINING = {
  RECOVERY:    '\u{1F3C3}', // 🏃
  TENSION:     '\u{1F4AA}', // 💪
  DURATION:    '\u{1FAC1}', // 🫁
  SPEED:       '\u26A1',   // ⚡
  ACTIVATION:  '\u{1F9E0}', // 🧠
  REST:        '\u{1F634}', // 😴
  BOOST:       '\u{1F4C8}', // 📈
};

// ============================================================
// MORALE & EMOTIONS
// ============================================================
export const MOOD = {
  HAPPY:       '\u{1F60A}', // 😊
  ANGRY:       '\u{1F624}', // 😤
  HEARTBREAK:  '\u{1F494}', // 💔
  CELEBRATE:   '\u{1F389}', // 🎉
  CROWN:       '\u{1F451}', // 👑
  FIRE:        '\u{1F525}', // 🔥
  STAR:        '\u2B50',    // ⭐
  ROCKET:      '\u{1F680}', // 🚀
  TARGET:      '\u{1F3AF}', // 🎯
  HANDSHAKE:   '\u{1F91D}', // 🤝
};

// ============================================================
// CAREER & ACHIEVEMENTS
// ============================================================
export const CAREER = {
  GOLD:        '\u{1F947}', // 🥇
  SILVER:      '\u{1F948}', // 🥈
  BRONZE:      '\u{1F949}', // 🥉
  TROPHY:      '\u{1F3C6}', // 🏆
  MEDAL:       '\u{1F3C5}', // 🏅
  MILESTONE:   '\u{1F3AF}', // 🎯
  LEGEND:      '\u{1F451}', // 👑
  RETIREMENT:  '\u{1F44B}', // 👋
};

// ============================================================
// NARRATIVE & PRESS
// ============================================================
export const NARRATIVE = {
  NEWS:        '\u{1F4F0}', // 📰
  CLIPBOARD:   '\u{1F4CB}', // 📋
  MEGAPHONE:   '\u{1F4E2}', // 📢
  SHIELD:      '\u{1F6E1}\uFE0F', // 🛡️
  CROSSED_SWORDS: '\u2694\uFE0F', // ⚔️
  PEOPLE:      '\u{1F465}', // 👥
  STATS:       '\u{1F4CA}', // 📊
  BRAIN:       '\u{1F9E0}', // 🧠
};

// ============================================================
// TEAM TALKS
// ============================================================
export const TALKS = {
  MOTIVATIONAL: '\u{1F4AA}', // 💪
  CALM:        '\u{1F9D8}', // 🧘
  AGGRESSIVE:  '\u{1F525}', // 🔥
  THREATENING: '\u26A0\uFE0F', // ⚠️
  TACTICAL:    '\u{1F4CB}', // 📋
  RELAXED:     '\u{1F60E}', // 😎
};

// ============================================================
// SCOUTING REGIONS
// ============================================================
export const SCOUT_REGIONS = {
  BRAZIL:     '\u{1F1E7}\u{1F1F7}', // 🇧🇷
  ARGENTINA:  '\u{1F1E6}\u{1F1F7}', // 🇦🇷
  EUROPE:     '\u{1F1EA}\u{1F1FA}', // 🇪🇺
  AFRICA:     '\u{1F30D}', // 🌍
  ASIA:       '\u{1F30F}', // 🌏
};

// ============================================================
// UI INDICATORS
// ============================================================
export const UI = {
  CHECK:       '\u2705',    // ✅
  CROSS:       '\u274C',    // ❌
  ARROW_UP:    '\u2B06\uFE0F', // ⬆️
  ARROW_DOWN:  '\u2B07\uFE0F', // ⬇️
  INFO:        '\u2139\uFE0F', // ℹ️
  CLOCK:       '\u{1F552}', // 🕒
  LOCK:        '\u{1F512}', // 🔒
  REFRESH:     '\u{1F504}', // 🔄
};

// ============================================================
// COSMETIC SHOP
// ============================================================
export const COSMETIC = {
  SHIRT:       '\u{1F455}', // 👕
  RAINBOW:     '\u{1F308}', // 🌈
  FLEUR:       '\u269C\uFE0F', // ⚜️
  SKULL:       '\u{1F480}', // 💀
  CROWN:       '\u{1F451}', // 👑
  SUIT:        '\u{1F935}', // 🤵
  ZEN:         '\u{1F9D8}', // 🧘
  ROCK:        '\u{1F918}', // 🤘
  GRASS:       '\u{1F7E2}', // 🟢
  SPIRAL:      '\u{1F300}', // 🌀
  FLAG:        '\u{1F6A9}', // 🚩
  FIREWORKS:   '\u{1F386}', // 🎆
};

/**
 * Flat convenience alias — import { ICONS } from './EmojiConstants.js'
 * Merges all categories into a single namespace.
 */
export const ICONS = {
  ...MATCH,
  ...CARDS,
  ...FINANCE,
  ...STAFF,
  ...TRAINING,
  ...MOOD,
  ...CAREER,
  ...NARRATIVE,
  ...TALKS,
  ...UI,
  ...COSMETIC,
};
