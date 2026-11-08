# Chi – Concept

## Vision

Chi is a voice-first AI companion: a very knowledgeable chat partner, and over time a friend, who knows the user well and keeps getting to know them better.

> **North star:** The user picks up the phone in the morning, says *"Hey Chi, how are you?"*, and it feels natural.

> **Mental model:** Chi is the friend you talk to. The child apps are the specialist tools that friend can hand you when you need them.

## The Chi Universe

| App | Area | Status |
|---|---|---|
| **Chi** | Voice-first companion, the front door | Concept / in progress |
| **Done.** | Task management | Exists |
| **Sansa** | Meditation, breathwork, yoga | Exists |
| **Cima** | Sport & performance, running planner, workout builder, collections, physio exercises | Exists |
| **Ciaro** | Finances | Exists |
| **Habitat** | Habits (presence, posture, gratitude, reaching out to friends, screen time) | Planned |
| **Human Design** | Human Design | Planned |
| **Cucia** | Cooking, recipes, nutrition | Planned |

## User Journey

1. **Start with Chi.** The user signs up for Chi. They don't need to know about the child apps.
2. **Just talk.** "My knee hurts after running", "I overspent this month", "Remind me to call mum". Chi has the whole context.
3. **Content goes where it belongs.** Chi saves each item in the right child app (Cima, Ciaro, Done.) without the user noticing. It reads the data back through APIs.
4. **Discovering apps.** Over time Chi suggests a child app when it adds real value. For example: *"I've built you a 4-week knee rehab plan. Want to see it in Cima? It shows videos and your progress."*
5. **Using apps directly.** Users can open a child app directly for its specialised tools (charts, builders, calendars, budgets). Changes flow back to Chi.

**Roles:** Chi is for *talking and understanding*. The child apps are for *looking at and managing* data in detail.

## Architecture Principles

- **One login.** A Chi account works in every app.
- **Hybrid data ownership.** Each child app owns its specialised data (tasks, workouts, transactions, …). Chi keeps its own memory and profile of the user (personality, preferences, life context, conversation history). Chi and the apps exchange data through APIs.
- **Child apps stay focused.** No onboarding or explaining the bigger picture. Each one just needs to be excellent at its area.
- **Chi's shared context is the core asset.** The product's value depends on how good Chi's memory and understanding are across all areas.

## Business Model

### Subscription

- **CHF 20 / month** for Chi, including all child apps.
- **Free trial** before payment starts.
- **Partners pay** the subscription too.

### Professional Partner Programme

Trusted professionals bring their clients to **Chi** (always Chi, never a single child app) and earn recurring income. Physios are the first test group. The model works for any profession that fits a child app:

| Child app | Natural partners |
|---|---|
| Cima | Physios, personal trainers, running coaches, sports clubs |
| Sansa | Yoga and meditation teachers, breathwork coaches, therapists |
| Ciaro | Financial advisers, accountants, budget counsellors |
| Done. | Business and productivity coaches, ADHD coaches |
| Habitat | Life coaches, health coaches |
| Cucia | Nutritionists, dietitians |
| Human Design | Human Design readers and coaches |

**Rewards (2 levels max), per paying user per month:**

| Situation | Direct partner | Original partner | Chi |
|---|---|---|---|
| Direct user (no partner) | – | – | CHF 20 |
| Partner's own client, or a partner they recruited | CHF 5 | – | CHF 15 |
| Client of a recruited partner | CHF 5 | CHF 2.50 | CHF 12.50 |

**Crediting:** one referral link to Chi. The partner who brought the user in gets the credit for the whole subscription, for as long as the user stays.

**Examples (from the original partner's view):**

| Scenario | Partner earns / month | Chi earns / month |
|---|---|---|
| 10 own clients | CHF 50 | CHF 150 |
| 10 own clients + 2 colleagues with 10 clients each | CHF 110 | CHF 430 |
| 25 own clients + 4 colleagues with 15 clients each | CHF 295 | CHF 1,185 |

*Chi's share is total revenue minus all partner payouts, including what the recruited colleagues earn from their own clients.*

### Partner Access

- **Limited to the partner's area:** a physio sees Cima (and possibly Sansa) data only. A financial adviser sees Ciaro only. Partners never see Chi's conversations or memory.
- **Client consent:** the client explicitly agrees to share specific things, through Chi, and can withdraw consent at any time.
- **Partner powers:** assign plans or exercises, see whether the client completed them and their feedback (e.g. pain, effort), and send short messages.
- **Chi passes things on:** *"Rebecca added three new exercises for you today. Shall we do them now?"* Chi is open with the user about what the partner can see.
- **Partner tools:** a partner view in the relevant child app for professional tools, plus one shared place for invites and tracking payouts.

## Market

- **Start:** Switzerland, multilingual from day one (DE / FR / IT / EN).
- **First partner group:** physiotherapists.

## Decisions Made

| Topic | Decision |
|---|---|
| Entry point | Always Chi; users discover the child apps later |
| Data | Hybrid: child apps own their specialised data, Chi owns memory and the user profile |
| Pricing | CHF 20 / month, free trial, everything included |
| Partners pay | Yes |
| Referral depth | 2 levels max |
| Crediting | Whoever brought the user in, for the whole subscription, for as long as they stay |
| Partner access | Limited to their area, with client consent; assign + see progress + messages; no access to Chi conversations |
| Market | Switzerland, DE/FR/IT/EN |

## Open Questions & Risks

**Legal and compliance**
- Swiss UWG Art. 3 lit. r (pyramid / snowball systems): rewards must always come from real paid usage, never from recruiting alone. Get a legal review.
- Professional codes and kickback rules (e.g. Physioswiss, Swiss health law, financial adviser rules): how and when partners tell clients about their fee. Check each profession before opening the programme to it.
- nDSG: health and financial data are sensitive personal data. Consent flows, data residency and the rights of the people whose data is processed.
- Wording: avoid MLM-style terms ("network", "levels"). Use "Partner Programme" and "Referral Bonus" instead.

**Business**
- What happens to partner payouts during the free trial and when users cancel?
- How often and how are partners paid out? Minimum payout amount?
- Do a partner's own subscription and their earnings offset each other?
- What is the trial length and the payment method?

**Product**
- When and how often should Chi suggest child apps (timing, frequency, tone)?
- How good does Chi's memory need to be to deliver on the "knows me" promise? How does the user see and edit what Chi knows?
- Voice: wake word ("Hey Chi") vs. push-to-talk; handling Swiss German.
- What do existing child app users experience when Chi launches (account migration)?
- Who resolves conflicts when the same data is edited in Chi and in a child app at the same time?
