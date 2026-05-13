# Stitch Screens — OléFUT (live)

**Project**: `1129586751616590793`
**Design System**: `assets/88a8720bc4f7464e9923da6c676f6074`
**Last updated**: 2026-05-13

---

## ✅ Generated (8/20 = 40%)

| # | Screen | Stitch ID |
|---|--------|----|
| 1 | DashboardView | `6d195eea6d364f319d104f16ff031481` |
| 2 | SquadView | `40202c0b989c4260a3279874334daf34` |
| 3 | MatchView | `6a725d226cb94f19869a9ce60c7cea52` |
| 4 | TrophyCeremony | `2823e5a00e8b4599a27935871d5a00bb` |
| 5 | StartView | `56afdb02497d45f58ff4617ced09b460` |
| 6 | AchievementsView | `f1e0cb1b29514f73bbfd9a854fdea3cb` |
| 7 | LineageView | `e7104e925a764657b567a647b0ddceb8` |
| 8 | SaveSlotsView | `9820fa97687c48588d86a64f46964ed4` |

## ⏳ Pending (12/20)

MarketView · StandingsView · PreMatchScreen · PressView · CosmeticShopView · TutorialView · RivalriesView · ChronicleView · MonitorView · PostMatch · PlayerDashboardView · AutoPlayView

## Rate Limit Pattern

Stitch generation ~30-50% success rate after 8 calls. Recommendation: wait 10min between batches.

## Retry Command Pattern

```
mcp__stitch__generate_screen_from_text
  projectId: 1129586751616590793
  designSystem: assets/88a8720bc4f7464e9923da6c676f6074
  modelId: GEMINI_3_FLASH
  deviceType: DESKTOP
  prompt: "[<200 char prompt]"
```

