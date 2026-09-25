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

**The principle it violates.** Phantom complexity.
Abstractions should isolate a real source of variation; this registry adds an extension
mechanism for a variation the current system does not have.

**What it makes expensive.** A reader changing the sole email implementation must first
understand a registry, builder type, configuration object, and import-time registration.
Adding a second fixed channel also requires coordinating the union type, registration, and
configuration instead of making the channel dependency explicit at the composition point.

---

## Milestone 2: One small fix

One fix, behavior preserved, suite green, zero test edits.

**Which smell you attacked.** Duplication over reuse in the pricing rules. I chose it
because the two copies already describe the same business decision, so giving that decision
one owner removes a concrete consistency risk without redesigning the rest of the service.

**What changed.** I added `src/pricing.ts` with the pure
`calculateReservationPrice` function and the single set of pricing constants.
`ReservationManager.calculatePrice` and `ReportGenerator.priceOf` now delegate to that
function. The sequence of base-price, premium, long-booking, and evening rounding is
unchanged; only the owner of that logic changed.

**What you deliberately did not touch.** My scope line was the duplicated pricing
calculation. I kept `ReservationManager.calculatePrice` as a public compatibility wrapper,
and did not split the rest of the God class, simplify the notification factory, change
validation or storage, or edit tests. Those are separate design decisions and including
them would make it harder to tell whether this pricing refactor preserved behavior.

**How you know behavior is preserved.** All 39 tests in the unchanged suite pass. Its
booking tests cover the ordinary hourly rate, the three-hour discount, the premium
surcharge, and the evening discount; its reporting tests compare revenue with stored
booking prices and check totals, averages, cancellation filtering, and per-room
aggregation. `npm run typecheck` also passes. The suite would not catch every combination
or rounding interaction among multiple
modifiers or a pricing change at an untested cutoff. Because a reporting assertion uses
stored booking prices as its expected total, it could also miss a bug that made both paths
return the same wrong price. The identical operation order in the extracted function is
therefore also part of the behavior-preservation argument.

---

## Milestone 3: Two proposals and one false positive

One proposal for each milestone 1 smell you did not fix.

### Proposal A (not coded)

**The problem.** The God class in `ReservationManager`. Booking lifecycle, room lookup,
notification, caching, and presentation have different reasons to change but share one
class.

**The decomposition.** Keep a small `ReservationService` as the controller for the
`createBooking` and `cancelBooking` use cases. A `RoomCatalog` would own room registration
and lookup. The extracted pricing module would remain the single owner of pricing rules. A
`ReservationFormatter` would own receipts and daily summaries, while the existing
`NotificationChannel` would own delivery. The controller would coordinate these pieces
through their interfaces rather than containing their rules.

**One cost.** Callers currently get all operations from one object. This split adds
constructor wiring and several dependencies, and either requires migrating callers to the
new objects or maintaining a facade. Tests would also need focused fixtures for the new
boundaries.

### Proposal B (not coded)

**The problem.** Speculative over-abstraction in `notifierFactory.ts`: a global builder
registry and plugin-style factory exist for the sole permitted channel, email.

**The decomposition.** Retain `NotificationChannel` as the small delivery contract, but
remove the registry, `ChannelName`, and registration functions. The application composition
point would construct `EmailChannel` with its from address and inject it into
`ReservationManager`. Selection belongs at that composition point; email formatting stays
inside `EmailChannel`, and the manager only calls the channel interface.

**One cost.** Constructor injection adds a dependency for callers to supply or accept as a
default. If the system later needs channels loaded dynamically from configuration, removing
the registry means that selection mechanism would have to be designed and added then.

### The thing that looks smelly but is fine

**What it is.** The apparently long method `validateReservationRequest` in
`src/validation.ts`.

**Why it is fine.** Every branch contributes to one cohesive responsibility: validating one
request against one room and returning the first useful rejection. It has no I/O, global
state, or side effects; the checks are ordered, local, and independently visible in the
validation tests. Extracting each short predicate would spread one policy across many
helpers without hiding a separate decision.

**What would flip your verdict.** If different buildings or customers acquired different
hours, duration, capacity, or premium-room policies, the method would start accumulating
mode checks and unrelated reasons to change. At that point, explicit validation policy
objects or rule sets would make the variation local and turn the current method into a real
long-method or conditional-complexity problem.
