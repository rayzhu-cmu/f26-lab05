# reservation-service: Smells and One Fix

Fill in each section. One section per milestone. Keep it short and specific. Point at files
and methods, not adjectives.

---

## Milestone 1: Three smells

Three smells, each in a different part of the module. For each one, fill in all five parts.

### Smell 1

**The smell.** God class. `ReservationManager` has accumulated room registration,
booking and cancellation workflow, conflict detection, pricing, notification dispatch,
caching, and customer-facing text formatting.

**Classic or agent-specific.** Classic. This is the lecture's God class smell: one class
knows about and coordinates several responsibilities that change for different reasons.

**Where in the code.** `src/reservationManager.ts`, across `ReservationManager`; in
particular `createBooking`, `calculatePrice`, `dispatchNotification`, `formatReceipt`, and
`formatDailySummary` belong to several different concerns.

**The principle it violates.** High cohesion / single responsibility. A module should hide
one focused design decision, but this class has several unrelated reasons to change.

**What it makes expensive.** Adding a new receipt format or changing how confirmations are
presented requires editing the same central class that enforces conflicts, cancellation,
and pricing. The first risk is accidentally changing booking behavior while making a
presentation-only change, and the entire manager must be retested.

### Smell 2

**The smell.** Duplication over reuse. The booking path and reporting path independently
implement the same premium surcharge, long-booking discount, and evening discount.

**Classic or agent-specific.** Agent-specific. The likely cause is **missing context**: the
reporting code rebuilt the pricing rules instead of reusing the implementation already in
the booking service. The result is two plausible implementations with no shared owner.

**Where in the code.** `ReservationManager.calculatePrice` and `applyDiscounts` in
`src/reservationManager.ts`, and `ReportGenerator.priceOf` in
`src/reportGenerator.ts`. Their corresponding rate and cutoff constants are duplicated too.

**The principle it violates.** Information hiding and DRY / single source of truth. Pricing
is one business decision, but its rules are exposed through two separate implementations.

**What it makes expensive.** Changing a discount threshold or adding a weekend pricing rule
requires edits in both the booking and reporting modules. If one edit is missed, newly
created bookings and revenue reports calculate different prices; reporting is the first
place the inconsistency becomes visible.

### Smell 3

**The smell.** Speculative over-abstraction. The notification package contains a generic
builder registry and factory even though the closed `ChannelName` type permits only one
implementation, `email`.

**Classic or agent-specific.** Agent-specific. The cause is an **underspecified request**:
without a concrete requirement for multiple or runtime-registered channels, the generated
design guessed that a plugin mechanism might be needed later.

**Where in the code.** `src/notifications/notifierFactory.ts`, especially the global
`builders` map plus `registerChannel`, `registeredChannels`, and
`createNotificationChannel`.

**The principle it violates.** YAGNI and the lecture's warning against over-decoupling.
Abstractions should isolate a real source of variation; this registry adds an extension
mechanism for a variation the current system does not have.

**What it makes expensive.** A reader changing the sole email implementation must first
understand a registry, builder type, configuration object, and import-time registration.
Adding a second fixed channel also requires coordinating the union type, registration, and
configuration instead of making the channel dependency explicit at the composition point.

---

## Milestone 2: One small fix

One fix, behavior preserved, suite green, zero test edits.

**Which smell you attacked.** And why that one.

**What changed.** Files and methods you touched, and what the code does differently now.

**What you deliberately did not touch.** Name the scope line you drew and why you drew it
there. "I ran out of time" is not a scope line.

**How you know behavior is preserved.** Point at the suite, say what it actually covers, and
say what it would not catch.

---

## Milestone 3: Two proposals and one false positive

One proposal for each milestone 1 smell you did not fix.

### Proposal A (not coded)

**The problem.** Name it.

**The decomposition.** What are the pieces, what does each own, and where do the rules live?

**One cost.** Something this actually costs. "No real downside" is not a cost.

### Proposal B (not coded)

**The problem.**

**The decomposition.**

**One cost.**

### The thing that looks smelly but is fine

**What it is.** File and method.

**Why it is fine.** Defend it with properties of the code, not with its line count.

**What would flip your verdict.** Name the change that would turn this into a real problem.
