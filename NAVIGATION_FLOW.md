# NAVIGATION_FLOW: Gym-Tracker

## User Journey: Glance & Go

```mermaid
graph TD
    A[Welcome / Login] -->|OTP / Magic Link| B{Authenticated?}
    B -->|Yes| C[Daily Feed]
    B -->|No| A
    
    C -->|Glance| D[View Today's Tasks]
    C -->|One-Tap| E[Mark Task as Completed]
    C -->|Swipe/Tab| F[View Previous/Next Days]
    
    E -->|Success Animation| G[Daily Progress Bar Updates]
    
    C -->|Settings| H[Profile & Preferences]
    H -->|Input| I[Contact Info / WhatsApp Sync]
    
    subgraph "WhatsApp Integration (Phase 2)"
        J[Edge Function / Cron] -->|Notification| K[WhatsApp Message]
        K -->|Reply / Action| L[Update DB via Webhook]
        L --> C
    end
```

## Screen Flow Details

1. **Authentication**: Mobile-first OTP interface. User enters phone/email, receives code, and is instantly redirected to the feed.
2. **Daily Feed (Main Screen)**:
    - Sticky Header with Date and Progress.
    - Scrollable list of Meals and Workouts.
    - Large "Action Area" for each item.
3. **Execution**: Tapping a task triggers a Framer Motion checkmark animation and updates the DB via optimistic Server Actions.
4. **Navigation**: Minimalistic bottom bar or top tabs for "Today", "History", and "Profile".
