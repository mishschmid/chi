# Chi – Concept

## Vision

Chi is a voice-first AI companion: a very knowledgeable chat partner, and over time a friend, who knows the user well and keeps getting to know them better.

> **North star:** The user picks up the phone in the morning, says _"Hey Chi, how are you?"_, and it feels natural.

> **Mental model:** Chi is the friend you talk to. The child apps are the specialist tools that friend can hand you when you need them.

## The Chi Universe

| App              | Area                                                                                 | Status                |
| ---------------- | ------------------------------------------------------------------------------------ | --------------------- |
| **Chi**          | Voice-first companion, the front door                                                | Concept / in progress |
| **Done.**        | Task management                                                                      | Exists                |
| **Sansa**        | Meditation, breathwork, yoga                                                         | Exists                |
| **Cima**         | Sport & performance, running planner, workout builder, collections, physio exercises | Exists                |
| **Ciaro**        | Finances                                                                             | Exists                |
| **Habitat**      | Habits (presence, posture, gratitude, reaching out to friends, screen time)          | Planned               |
| **Human Design** | Human Design                                                                         | Planned               |
| **Cucia**        | Cooking, recipes, nutrition                                                          | Planned               |

## User Journey

1. **Start with Chi.** The user signs up for Chi. They don't need to know about the child apps.
2. **Just talk.** "My knee hurts after running", "I overspent this month", "Remind me to call mum". Chi has the whole context.
3. **Content goes where it belongs.** Chi saves each item in the right child app (Cima, Ciaro, Done.) without the user noticing. It reads the data back through APIs.
4. **Discovering apps.** Over time Chi suggests a child app when it adds real value. For example: _"I've built you a 4-week knee rehab plan. Want to see it in Cima? It shows videos and your progress."_
5. **Using apps directly.** Users can open a child app directly for its specialised tools (charts, builders, calendars, budgets). Changes flow back to Chi.

**Roles:** Chi is for _talking and understanding_. The child apps are for _looking at and managing_ data in detail.

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

Trusted professionals bring their clients to **Chi** (always Chi, never a single child app) and earn recurring income.

**First partner group: holistic health professionals.** These are people who look at health span as a whole: movement and mechanics, nutrition, exercise, sleep, stress and recovery. Examples: integrative physios, longevity and health coaches, functional medicine practitioners, nutritionists, sports doctors, premium gyms and clinics. Chi becomes part of _their_ coaching offer.

Holistic health covers several child apps:

| Health span area             | Child app |
| ---------------------------- | --------- |
| Movement, training, rehab    | Cima      |
| Stress, recovery, breathwork | Sansa     |
| Nutrition                    | Cucia     |
| Sleep, habits, posture       | Habitat   |

Later, the model can extend to other professions that fit a child app:

| Child app    | Natural partners                                             |
| ------------ | ------------------------------------------------------------ |
| Cima         | Physios, personal trainers, running coaches, sports clubs    |
| Sansa        | Yoga and meditation teachers, breathwork coaches, therapists |
| Ciaro        | Financial advisers, accountants, budget counsellors          |
| Done.        | Business and productivity coaches, ADHD coaches              |
| Habitat      | Life coaches, health coaches                                 |
| Cucia        | Nutritionists, dietitians                                    |
| Human Design | Human Design readers and coaches                             |

**Rewards (2 levels max), per paying user per month:**

| Situation                                         | Direct partner | Original partner | Chi       |
| ------------------------------------------------- | -------------- | ---------------- | --------- |
| Direct user (no partner)                          | –              | –                | CHF 20    |
| Partner's own client, or a partner they recruited | CHF 5          | –                | CHF 15    |
| Client of a recruited partner                     | CHF 5          | CHF 2.50         | CHF 12.50 |

**Crediting:** one referral link to Chi. The partner who brought the user in gets the credit for the whole subscription, for as long as the user stays.

**Examples (from the original partner's view):**

| Scenario                                           | Partner earns / month | Chi earns / month |
| -------------------------------------------------- | --------------------- | ----------------- |
| 10 own clients                                     | CHF 50                | CHF 150           |
| 10 own clients + 2 colleagues with 10 clients each | CHF 110               | CHF 430           |
| 25 own clients + 4 colleagues with 15 clients each | CHF 295               | CHF 1,185         |

_Chi's share is total revenue minus all partner payouts, including what the recruited colleagues earn from their own clients._

### Partner Access

- **Limited to the partner's area:** a holistic health professional sees the health span areas (Cima, Sansa, Cucia, Habitat, wearable data) as **one client overview**. A financial adviser sees Ciaro only. Partners never see Chi's conversations or memory.
- **Client consent:** the client explicitly agrees to share specific things, through Chi, and can withdraw consent at any time.
- **Partner powers:** assign plans or exercises, see whether the client completed them and their feedback (e.g. pain, effort), and send short messages.
- **Chi passes things on:** _"Rebecca added three new exercises for you today. Shall we do them now?"_ Chi is open with the user about what the partner can see.
- **Partner tools:** a partner view in the relevant child app for professional tools, plus one shared place for invites and tracking payouts.

## Market

- **Start:** Switzerland, multilingual from day one (DE / FR / IT / EN).
- **First partner group:** holistic health and longevity professionals.
- **Why Switzerland suits this:** an established longevity and wellness culture (clinics, premium gyms) and users who can afford it.

## Decisions Made

| Topic               | Decision                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| Entry point         | Always Chi; users discover the child apps later                                                              |
| Data                | Hybrid: child apps own their specialised data, Chi owns memory and the user profile                          |
| Pricing             | CHF 20 / month, free trial, everything included                                                              |
| Partners pay        | Yes                                                                                                          |
| Referral depth      | 2 levels max                                                                                                 |
| Crediting           | Whoever brought the user in, for the whole subscription, for as long as they stay                            |
| Partner access      | Limited to their area, with client consent; assign + see progress + messages; no access to Chi conversations |
| Market              | Switzerland, DE/FR/IT/EN                                                                                     |
| First partner group | Holistic health / longevity professionals                                                                    |

## Strategic Risks & Focus

### Strengths

- **Strong north star:** it measures the relationship, not features.
- **The child apps already exist:** they give Chi structured life data, not just chat history.
- **Health span is connected, and so is Chi.** Bad sleep leads to a poor workout, then stress, then poor food choices. Single-purpose apps each see one piece. Chi sees the whole picture and talks about it (_"You slept badly three nights in a row, let's make today's training easier."_). This makes the app universe a deliberate offer rather than a lack of focus.
- **Distribution through trusted professionals:** high conversion and retention, and it addresses the hardest problem in consumer apps.
- **Longevity is a growing market** with users who are willing to pay.
- **Switzerland as the starting market:** high trust, high income, a strong wellness culture, and small enough to win.

### Key Risks

1. **Competition from big tech and health tech.** OpenAI, Google and Apple are building voice AI companions with memory. Whoop, Oura, Function Health, Zoe, Levels and longevity clinics compete in health span. Chi's edge is the **combination**: conversation + all health areas + a professional in the loop. Most competitors have only one or two of these.
2. **Too much to build.** The holistic offer needs Cucia and Habitat, which are only planned, plus wearable integrations. Building and running all of this is expensive for a small team. The parts that don't serve health span (Ciaro, Done., Human Design) should wait.
3. **Voice-first is a high bar.** A daily "Hey Chi" habit has to be earned over months. Swiss German speech recognition is still unreliable. Early users will come for a specific goal, not for friendship.
4. **The partner programme undermines the "friend".** Money for referrals plus a 2-level structure can look like MLM. What convinces professionals is **saving time and better client outcomes**. Health professionals are a regulated group.
5. **The line between wellness and medicine.** If Chi interprets biomarkers or gives advice that sounds like a diagnosis, it may count as a medical device (Swissmedic / EU MDR). Chi must clearly stay on the coaching and wellness side and leave medical decisions to professionals.
6. **Credibility.** The longevity field is full of hype. Chi needs to be grounded in evidence to be trusted by serious professionals.
7. **Very sensitive data.** Health, sleep, nutrition and personal life in one place. One breach or trust scandal could end the product, so security needs serious early investment.

### Recommended Focus

1. **Lead with health span:** Cima + Sansa first, then Cucia and Habitat. Hold off on Ciaro, Done. and Human Design as products to push (they can keep running).
2. **Positioning:** **"Your health span coach's assistant, every day."** Chi checks in daily, links sleep, training, nutrition and stress, adjusts plans, and reports to the coach. The friendship grows from there.
3. **Wearable integrations are essential:** Apple Health, Oura, Garmin, Whoop (sleep, HRV, activity). Without them, the holistic view relies on what users tell Chi.
4. **A holistic client overview for partners:** one view of movement, nutrition, sleep and stress per client (with consent), not separate data from each app.
5. **Partner offer about their practice, not the money:** time-saving tools, client progress reports, possibly a free partner account, and a simple 1-level revenue share. Revisit level 2 later. Avoid MLM-style wording.
6. **Pricing:** CHF 20 base, plus a **premium coach-supported tier** (e.g. CHF 30–50) that matches what longevity clients are willing to pay and gives partners more value.
7. **Test before building more:** 5–10 holistic coaches or practitioners, each with 5+ active clients for 3 months. Measure whether clients stick with the programme and whether coaches save time.

### Assessment

| Aspect                                                                       | Rating                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| Vision and timing                                                            | Strong                                                  |
| Defensibility as a "general companion"                                       | Weak (big tech)                                         |
| Defensibility as "holistic health span companion + professional in the loop" | Strong                                                  |
| Focus                                                                        | Good, if limited to health span first                   |
| Partner programme                                                            | Good idea, wrong emphasis                               |
| Feasibility for a small team                                                 | Only if focused (wearables + Cucia + Habitat are a lot) |

> Some of these recommendations differ from the decisions above (partners pay, 2 levels max, CHF 20 for everything). Review them before building the partner programme.

## Open Questions & Risks

**Legal and compliance**

- Swiss UWG Art. 3 lit. r (pyramid / snowball systems): rewards must always come from real paid usage, never from recruiting alone. Get a legal review.
- Professional codes and kickback rules (e.g. Physioswiss, Swiss health law, financial adviser rules): how and when partners tell clients about their fee. Check each profession before opening the programme to it.
- nDSG: health and financial data are sensitive personal data. Consent flows, data residency and the rights of the people whose data is processed.
- Medical device rules (Swissmedic / EU MDR): where exactly the line between wellness coaching and medical advice falls for Chi's health features.
- Wording: avoid MLM-style terms ("network", "levels"). Use "Partner Programme" and "Referral Bonus" instead.

**Business**

- What happens to partner payouts during the free trial and when users cancel?
- How often and how are partners paid out? Minimum payout amount?
- Do a partner's own subscription and their earnings offset each other?
- What is the trial length and the payment method?
- Premium coach-supported tier: price, what's included, and how the revenue is split with the coach?

**Product**

- When and how often should Chi suggest child apps (timing, frequency, tone)?
- How good does Chi's memory need to be to deliver on the "knows me" promise? How does the user see and edit what Chi knows?
- Voice: wake word ("Hey Chi") vs. push-to-talk; handling Swiss German.
- What do existing child app users experience when Chi launches (account migration)?
- Who resolves conflicts when the same data is edited in Chi and in a child app at the same time?
- Which wearables come first, and is that data stored by Chi or by Habitat/Cima?
- How quickly can Cucia and Habitat reach a usable first version?
