# Pause and Page — Android app

A CBT-informed self-help app for UG students, PG students and medical professionals aged 18+.
Everything runs offline and stays on the phone. There is no account, no server and no tracking.

## Get the APK

**Option A — no install needed (GitHub):**
1. Create a new GitHub repository and upload the contents of this folder (keep the `.github` folder).
2. Open the **Actions** tab. The "Build APK" workflow runs automatically (or press *Run workflow*).
3. When it finishes (about 3–5 minutes), open the run and download **PauseAndPage-debug-apk**.
4. Copy the `.apk` to an Android phone (Android 8.0 or newer) and open it. Allow "Install unknown apps" when asked.

**Option B — Android Studio:**
1. Install Android Studio (Koala or newer), choose *Open* and select this folder.
2. Let Gradle sync (it downloads Gradle 8.7 and the Android SDK 34 automatically).
3. *Build → Build App Bundle(s) / APK(s) → Build APK(s)*. The file appears in `app/build/outputs/apk/debug/`.

For the Play Store you'll need a signed release build (*Build → Generate Signed App Bundle*) and a privacy policy.

## What's in this version

- **Get urgent help** in the header of every screen — including the welcome and onboarding screens — with no login, payment or questions required. Also available by long-pressing the app icon.
  Shows the required safety message, then *Call 112*, *Call Tele-MANAS* (14416 / 1800-891-4416), *Contact my trusted person* and *View campus support*. Call buttons open the dialler only (`ACTION_DIAL`); the app has no permission to place calls, read location or contact anyone.
- **My support plan** (questions 86–89) with the notice "This app is not an emergency service. Entries are not continuously monitored."
- **Onboarding** (questions 1–10), with under-18 users routed to a separate screen.
- **Today**: affirmation (Save / Another / Edit), equal-weight mood check-in (11–16), suggested CBT practice, journal, small-action card, and evening reflection after 5 pm.
- **CBT**: eight self-paced lessons with explanations, pathway-specific examples, one-question-at-a-time worksheets (Back, Skip, Save, Pause), optional supportive statements and later reviews; practice library. Covers questions 17–52 plus original worksheets for problem solving, personal rules and maintenance.
- **Journal**: guided CBT journal, five-minute journal, evening reflection (53–60), gratitude, free writing and pathway prompts (74–80). Medical professionals see the patient-confidentiality notice.
- **Progress**: mood over 14 days (missed days left blank, no penalties), activity shown separately from wellbeing, what helped, goals and actions, weekly review (66–73). No single "mental health score".
- **Sharing** (81–85): the user picks what to share, always sees a preview, and sends it themselves through the Android share sheet. Nothing is sent automatically; sharing can be stopped.
- **Reminders**: morning and evening (default 7:30 am / 8:30 pm, adjustable, shift-friendly), with lock-screen privacy (private mode shows only "A moment for you is ready"), sound or silent.
- **Privacy**: data export, delete everything, optional "hide app content" (blocks screenshots and recent-apps preview), Android backup disabled.
- Quieter appearance and reduced-motion options.

## Not included yet (needs a backend or further work)

- Secure accounts and syncing between the website and the app. This version is local-only, so uninstalling the app erases its data unless the user exports it.
- The ₹199 offer / payments (would use Google Play Billing). Urgent help must stay outside any paywall.
- Verified campus counselling directory. For now users add their institution's contact themselves, with a note of where it came from.
- Professional view/exports, audio exercises, other languages, AI assistance.

## Before launch

- Have a qualified CBT practitioner review all lesson content, worksheets and support pathways, then pilot with BPH and MPH students.
- Re-check helpline numbers on a schedule (they are in `web/shell.html`; last reviewed October 2026) and update the "last reviewed" note.
- To add another country, add a region block to the urgent-help section in `web/shell.html` and select it by region.
- Test on real devices that each call button opens the dialler with the right number.

## Editing the interface

The interface lives in `web/` (`shell.html`, `styles.css`, `app.js`). After editing, run `python3 build_web.py` to rebuild `app/src/main/assets/index.html`, then rebuild the APK. You can also open `app/src/main/assets/index.html` in a browser to preview it.
