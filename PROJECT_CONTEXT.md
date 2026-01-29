# PROJECT_CONTEXT: Gym-Tracker (Zero Friction)

## Vision
A high-performance Fitness & Nutrition tracker designed for execution. The app eliminates cognitive load by presenting exactly what needs to be done *now*, allowing users to track progress with a single tap.

## UX Philosophy: "Glance & Go"
- **Zero Friction**: Minimize taps to reach any action.
- **Glanceable**: Clear hierarchy, large typography, and high contrast.
- **Immediate Feedback**: Subtle animations (Framer Motion) to reward task completion.
- **Mobile First**: Optimized for one-handed operation.

## Architecture Highlights
- **Backend-Driven**: Flexible schema prepared for WhatsApp automation.
- **Unified Feed**: Meals and Workouts live in the same timeline (`daily_tasks`).
- **Identity-First**: Phone number as the primary anchor for future WhatsApp integration.
- **Secure by Default**: Strict Row Level Security (RLS) on all data.

## WhatsApp Integration (Phase 2 Ready)
The database is structured to support:
- Cron jobs to detect missed tasks.
- Webhooks/Edge Functions to trigger notifications.
- Interactive WhatsApp messages mapping directly to DB states.
