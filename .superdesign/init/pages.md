# Pages — component dependency trees

Every page is wrapped by `src/app/layout.tsx` -> `src/components/app-shell.tsx` (see "Shared shell" tree). Trees below list UI files (`src/components`, `src/app`, `.tsx` providers) recursively; repeated nodes are marked "(already listed)". Pure logic modules under `src/lib` (non-UI `.ts`) are collapsed into a flat "Logic" line per page since they don't affect visuals. Always-relevant styling context: `src/app/globals.css`, `src/lib/utils.ts`.

## Shared shell (root layout)
Entry: `src/app/layout.tsx`
Dependencies:
```
- src/components/app-shell.tsx
  - src/lib/supabase/auth-context.tsx
  - src/components/auth/login-panel.tsx
    - src/lib/supabase/auth-context.tsx (already listed)
    - src/components/auth/auth-forms.tsx
      - src/lib/supabase/auth-context.tsx (already listed)
  - src/components/auth/password-recovery-prompt.tsx
    - src/lib/supabase/auth-context.tsx (already listed)
    - src/components/auth/auth-forms.tsx (already listed)
  - src/components/auth/username-prompt.tsx
    - src/lib/supabase/auth-context.tsx (already listed)
  - src/lib/preferences.tsx
- src/components/plan-context.tsx
- src/lib/supabase/auth-context.tsx (already listed)
- src/lib/preferences.tsx (already listed)
- src/lib/gamification/provider.tsx
  - src/lib/supabase/auth-context.tsx (already listed)
- src/components/gamification/celebration-layer.tsx
```
Logic (src/lib): adapt-plan-setting.ts, content/questions-provider.ts, format.ts, gamification/config.ts, gamification/engine.ts, gamification/leaderboard.ts, hp-scores.ts, plan-generator.ts, practice-pace.ts, practice-trends.ts, practice-types.ts, practice.ts, progress-history.ts, question-mastery.ts, quiz.ts, random.ts, section-kinds.ts, sound.ts, storage.ts, study-plan.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, use-hydrated.ts, utils.ts, week-progress.ts


## /
Entry: `src/app/page.tsx`
Dependencies:
```
- src/components/dashboard-home.tsx
  - src/components/daily-srs-review.tsx
  - src/components/plan-context.tsx
  - src/components/progress-panel.tsx
    - src/components/disclosure.tsx
    - src/components/progress-chart.tsx
    - src/components/plan-context.tsx (already listed)
  - src/components/gamification/xp-bar.tsx
    - src/lib/gamification/provider.tsx
      - src/lib/supabase/auth-context.tsx
  - src/components/gamification/streak-card.tsx
    - src/lib/gamification/provider.tsx (already listed)
  - src/components/gamification/daily-quests.tsx
    - src/lib/gamification/provider.tsx (already listed)
  - src/components/gamification/achievements-panel.tsx
    - src/components/disclosure.tsx (already listed)
    - src/lib/gamification/provider.tsx (already listed)
```
Logic (src/lib): adapt-plan-setting.ts, content/questions-provider.ts, error-srs.ts, format.ts, gamification/config.ts, gamification/engine.ts, gamification/leaderboard.ts, hp-scores.ts, plan-generator.ts, practice-pace.ts, practice-trends.ts, practice-types.ts, practice.ts, progress-history.ts, question-mastery.ts, quiz.ts, random.ts, section-kinds.ts, storage.ts, study-plan.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, use-hydrated.ts, utils.ts, week-progress.ts


## /plan
Entry: `src/app/plan/page.tsx`
Dependencies:
```
- src/components/plan-view.tsx
  - src/components/disclosure.tsx
  - src/components/plan-badges.tsx
    - src/components/ui/badge.tsx
  - src/components/plan-context.tsx
  - src/components/study-time-notice.tsx
    - src/components/plan-context.tsx (already listed)
  - src/components/week-tracker.tsx
    - src/components/practice-session.tsx
      - src/components/question-review.tsx
        - src/lib/content/explain-figures.tsx
        - src/components/question-figure.tsx
        - src/components/forum/discuss-button.tsx
        - src/components/flag-question-button.tsx
          - src/lib/supabase/auth-context.tsx
      - src/components/pace-notice.tsx
      - src/components/quiz/quiz-options.tsx
      - src/components/quiz/quiz-progress.tsx
      - src/components/question-figure.tsx (already listed)
    - src/components/week-task-row.tsx
    - src/components/plan-context.tsx (already listed)
    - src/components/ui/progress.tsx
```
Logic (src/lib): adapt-plan-setting.ts, content/questions-provider.ts, content/use-questions.ts, error-srs.ts, format.ts, gamification/config.ts, gamification/engine.ts, hp-scores.ts, plan-generator.ts, practice-pace.ts, practice-timer.ts, practice-trends.ts, practice-types.ts, practice.ts, progress-history.ts, question-flags.ts, question-mastery.ts, quiz-outcome.ts, quiz.ts, random.ts, section-kinds.ts, storage.ts, study-plan.ts, study-time-recommendation.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, use-hydrated.ts, use-pausable-practice-timer.ts, use-quiz.ts, utils.ts, week-progress.ts


## /ova
Entry: `src/app/ova/page.tsx`
Dependencies:
```
- src/components/practice-hub.tsx
```
Logic (src/lib): content/questions-provider.ts, practice-types.ts, practice.ts, question-mastery.ts, quiz.ts, random.ts, storage.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts


## /ova/[subtest]
Entry: `src/app/ova/[subtest]/page.tsx`
Dependencies:
```
- src/components/practice-subtest-selector.tsx
  - src/components/practice-hub.tsx
  - src/components/free-practice-session.tsx
    - src/components/question-review.tsx
      - src/lib/content/explain-figures.tsx
      - src/components/question-figure.tsx
      - src/components/forum/discuss-button.tsx
      - src/components/flag-question-button.tsx
        - src/lib/supabase/auth-context.tsx
    - src/lib/content/explain-figures.tsx (already listed)
    - src/components/quiz/quiz-options.tsx
    - src/components/quiz/quiz-progress.tsx
    - src/components/question-figure.tsx (already listed)
```
Logic (src/lib): content/questions-provider.ts, content/use-questions.ts, countdown.ts, error-srs.ts, format.ts, gamification/config.ts, gamification/engine.ts, hp-scores.ts, practice-modes.ts, practice-timer.ts, practice-types.ts, practice.ts, progress-history.ts, question-flags.ts, question-mastery.ts, quiz-outcome.ts, quiz.ts, random.ts, storage.ts, study-plan.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, use-hydrated.ts, use-quiz-countdown.ts, use-quiz.ts, utils.ts


## /nivatest
Entry: `src/app/nivatest/page.tsx`
Dependencies:
```
- src/components/mini-level-test.tsx
  - src/components/plan-context.tsx
  - src/components/plan-badges.tsx
    - src/components/ui/badge.tsx
  - src/components/question-review.tsx
    - src/lib/content/explain-figures.tsx
    - src/components/question-figure.tsx
    - src/components/forum/discuss-button.tsx
    - src/components/flag-question-button.tsx
      - src/lib/supabase/auth-context.tsx
  - src/components/quiz/quiz-options.tsx
  - src/components/quiz/quiz-progress.tsx
  - src/components/question-figure.tsx (already listed)
```
Logic (src/lib): adapt-plan-setting.ts, content/questions-provider.ts, content/use-questions.ts, countdown.ts, error-srs.ts, format.ts, gamification/config.ts, gamification/engine.ts, hp-scores.ts, mini-level-test.ts, nivatest-timer.ts, plan-generator.ts, practice-pace.ts, practice-trends.ts, practice-types.ts, practice.ts, progress-history.ts, question-flags.ts, question-mastery.ts, quiz-outcome.ts, quiz.ts, random.ts, section-kinds.ts, storage.ts, study-plan.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, use-hydrated.ts, use-quiz-countdown.ts, use-quiz.ts, utils.ts, week-progress.ts


## /resultat
Entry: `src/app/resultat/page.tsx`
Dependencies:
```
- src/components/results-view.tsx
  - src/components/disclosure.tsx
  - src/components/plan-badges.tsx
    - src/components/ui/badge.tsx
  - src/components/plan-context.tsx
  - src/components/progress-panel.tsx
    - src/components/disclosure.tsx (already listed)
    - src/components/progress-chart.tsx
    - src/components/plan-context.tsx (already listed)
  - src/components/score-form.tsx
    - src/components/plan-context.tsx (already listed)
  - src/components/study-time-notice.tsx
    - src/components/plan-context.tsx (already listed)
```
Logic (src/lib): adapt-plan-setting.ts, content/questions-provider.ts, format.ts, hp-scores.ts, plan-generator.ts, practice-pace.ts, practice-trends.ts, practice-types.ts, practice.ts, progress-history.ts, question-mastery.ts, quiz.ts, random.ts, section-kinds.ts, storage.ts, study-plan.ts, study-time-recommendation.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, use-hydrated.ts, utils.ts, week-progress.ts


## /prov
Entry: `src/app/prov/page.tsx`
Dependencies:
```
- src/components/exams-view.tsx
  - src/components/official-exams-browser.tsx
    - src/components/disclosure.tsx
    - src/components/timed-mock-exam.tsx
      - src/components/question-review.tsx
        - src/lib/content/explain-figures.tsx
        - src/components/question-figure.tsx
        - src/components/forum/discuss-button.tsx
        - src/components/flag-question-button.tsx
          - src/lib/supabase/auth-context.tsx
      - src/components/pace-notice.tsx
      - src/components/quiz/quiz-options.tsx
      - src/components/quiz/quiz-progress.tsx
      - src/components/question-figure.tsx (already listed)
    - src/components/provpass-session.tsx
      - src/components/question-review.tsx (already listed)
      - src/components/pace-notice.tsx (already listed)
      - src/components/quiz/quiz-options.tsx (already listed)
      - src/components/quiz/quiz-progress.tsx (already listed)
      - src/components/question-figure.tsx (already listed)
```
Logic (src/lib): content/questions-provider.ts, content/use-questions.ts, countdown.ts, error-srs.ts, format.ts, gamification/config.ts, gamification/engine.ts, hp-scores.ts, official-exams.ts, practice-modes.ts, practice-pace.ts, practice-timer.ts, practice-types.ts, practice.ts, progress-history.ts, question-flags.ts, question-mastery.ts, quiz-outcome.ts, quiz.ts, random.ts, section-kinds.ts, storage.ts, study-plan.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, use-hydrated.ts, use-quiz-countdown.ts, use-quiz.ts, utils.ts


## /duell
Entry: `src/app/duell/page.tsx`
Dependencies:
```
- src/components/duel/duel-hub.tsx
  - src/lib/supabase/auth-context.tsx
  - src/components/auth/login-panel.tsx
    - src/lib/supabase/auth-context.tsx (already listed)
    - src/components/auth/auth-forms.tsx
      - src/lib/supabase/auth-context.tsx (already listed)
  - src/components/duel/matchmaking-screen.tsx
    - src/components/duel/duel-utils.ts
  - src/components/duel/private-lobby.tsx
  - src/components/duel/duel-utils.ts (already listed)
```
Logic (src/lib): duel/matchmaking.ts, duel/profile.ts, duel/types.ts, supabase/client.ts, sync/storage-sync.ts, utils.ts


## /forum
Entry: `src/app/forum/page.tsx`
Dependencies:
```
- src/components/forum/forum-hub.tsx
  - src/lib/supabase/auth-context.tsx
```
Logic (src/lib): content/questions-provider.ts, format.ts, forum.ts, practice-types.ts, practice.ts, question-mastery.ts, quiz.ts, random.ts, storage.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, utils.ts


## /profil
Entry: `src/app/profil/page.tsx`
Dependencies:
```
- src/app/profil/profile-screen.tsx
  - src/lib/supabase/auth-context.tsx
  - src/components/auth/login-panel.tsx
    - src/lib/supabase/auth-context.tsx (already listed)
    - src/components/auth/auth-forms.tsx
      - src/lib/supabase/auth-context.tsx (already listed)
  - src/app/profil/actions.ts
```
Logic (src/lib): content/questions-provider.ts, duel/profile.ts, duel/types.ts, error-srs.ts, feedback/feature-request.ts, practice-types.ts, practice.ts, question-mastery.ts, quiz.ts, random.ts, storage.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, supabase/server.ts, sync/storage-sync.ts, utils.ts


## /tips
Entry: `src/app/tips/page.tsx`
Dependencies:
```
- src/components/tips-view.tsx
  - src/components/disclosure.tsx
```
Logic (src/lib): content/questions-provider.ts, practice-types.ts, practice.ts, question-mastery.ts, quiz.ts, random.ts, section-tips.ts, storage.ts, study-plan.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, utils.ts


## /ova/flashcards
Entry: `src/app/ova/flashcards/page.tsx`
Dependencies:
```
- src/components/flashcards.tsx
```
Logic (src/lib): content/questions-provider.ts, content/use-questions.ts, flashcards.ts, gamification/config.ts, gamification/engine.ts, practice-types.ts, practice.ts, question-mastery.ts, quiz.ts, random.ts, reading-library.ts, storage.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, use-hydrated.ts, use-persistent-state.ts


## /bibliotek
Entry: `src/app/bibliotek/page.tsx`
Dependencies:
```
- src/components/disclosure.tsx
- src/components/reading-library.tsx
  - src/components/disclosure.tsx (already listed)
```
Logic (src/lib): gamification/config.ts, gamification/engine.ts, reading-library.ts, storage.ts, supabase/client.ts, sync/storage-sync.ts, use-hydrated.ts, use-persistent-state.ts, utils.ts


## /duell/[matchId]
Entry: `src/app/duell/[matchId]/page.tsx`
Dependencies:
```
- src/components/duel/duel-match.tsx
  - src/components/duel/duel-utils.ts
  - src/components/duel/review-form.tsx
    - src/components/duel/duel-utils.ts (already listed)
  - src/components/question-figure.tsx
```
Logic (src/lib): content/questions-provider.ts, duel/bot.ts, duel/matchmaking.ts, duel/profile.ts, duel/questions.ts, duel/reviews.ts, duel/types.ts, gamification/config.ts, gamification/engine.ts, practice-types.ts, practice.ts, question-mastery.ts, quiz.ts, random.ts, storage.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, utils.ts


## /forum/fraga/[questionId]
Entry: `src/app/forum/fraga/[questionId]/page.tsx`
Dependencies:
```
- src/components/forum/forum-thread.tsx
  - src/components/quiz/quiz-options.tsx
  - src/components/question-figure.tsx
  - src/lib/supabase/auth-context.tsx
  - src/components/auth/login-panel.tsx
    - src/lib/supabase/auth-context.tsx (already listed)
    - src/components/auth/auth-forms.tsx
      - src/lib/supabase/auth-context.tsx (already listed)
```
Logic (src/lib): content/questions-provider.ts, format.ts, forum.ts, practice-types.ts, practice.ts, question-mastery.ts, quiz.ts, random.ts, storage.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, sync/storage-sync.ts, utils.ts


## /feedback
Entry: `src/app/feedback/page.tsx`
Dependencies:
```
- src/components/feedback/feedback-form.tsx
```
Logic (src/lib): feedback/feature-request.ts, feedback/submit.ts, supabase/client.ts, utils.ts


## /review
Entry: `src/app/review/page.tsx`
Dependencies:
```
- src/app/review/review-screen.tsx
  - src/lib/supabase/auth-context.tsx
  - src/components/auth/login-panel.tsx
    - src/lib/supabase/auth-context.tsx (already listed)
    - src/components/auth/auth-forms.tsx
      - src/lib/supabase/auth-context.tsx (already listed)
  - src/lib/content/explain-figures.tsx
  - src/app/review/actions.ts
    - src/app/review/types.ts
  - src/app/review/types.ts (already listed)
```
Logic (src/lib): content/questions-provider.ts, practice-types.ts, practice.ts, question-mastery.ts, quiz.ts, random.ts, storage.ts, subtests.ts, supabase/client.ts, supabase/paginate.ts, supabase/server.ts, sync/storage-sync.ts, utils.ts


