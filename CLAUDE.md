# CLAUDE.md

Static site (no build step) for the Lambda Chi Alpha Zeta Rho chapter at Florida State University. Deployed via GitHub Pages on push to `main` (CNAME present). Real pages: `index.html` plus `pages/brotherhood.html`, `leadership.html`, `alumni.html`, `newsletters.html`, `contact.html` (and `rush.html.disabled`, toggled via `RUSH_TOGGLE` comments). Shared styles in `css/styles.css`, shared JS in `js/main.js`.

Project-specific notes for applying the guide below:

- Purple (`#4A1E6D`), green (`#1A7D3D`), and gold (`#C9A227`) are Lambda Chi Alpha's genuine brand colors. The "purple ban" applies only to the canonical AI purples (`#7c3aed` family), not brand purple.
- The unlinked easter-egg pages (`pages/evil-ritual.html`, `shiesty.html`, `wanted.html`, `free-declan.html`, `spearmaster.html` and their css/js) are intentionally over-the-top joke pages. They are exempt from the de-slop doctrine. Do not "fix" them.
- This is a heritage/brotherhood site, not a SaaS product. Where the guide assumes marketplace furniture (pricing rows, inventory), translate the spirit: dense real facts (dates, names, zeta numbers, real photos) beat icon-card trios and adjectives.

---

# AI-Tell Elimination Guide

A field guide for de-slopping a vibe-coded website. Drop this file into the repo and point your coding agent at it. It has three parts: the **hard bans** (recognized tells to remove on sight), the **positive doctrine** (what professionals ship instead, with reference values mined from mature production sites), and a **sweep procedure** (greppable patterns so the purge is mechanical, not vibes).

Origin: this doctrine was built for a production marketplace by cross-referencing (1) published research on how people recognize AI-built sites (Reddit-mined datasets, a 1,590-page Show HN audit, agency teardowns), (2) a forensic audit of a real vibe-coded codebase, and (3) CSS/DOM mined from Kayak and Booking.com as the calibration target for "professional product." The principle throughout: **make the choice a working designer would make, not the statistically-average one.**

---

## Part 1 — Hard bans (visual tells)

Remove every instance. No exceptions, no "but it looks nice here."

1. **Glowing buttons.** No colored `box-shadow` glow on CTAs (brand-colored rgba halos), no inset bevel highlights. CTAs are flat fills; hover darkens the fill. This is the single most-recognized tell.
2. **Hover lifts.** No `transform: translateY(-Npx)` on cards, chips, or buttons. Hover responds with border-color, background tint, or a slightly deeper *neutral* shadow — never position.
3. **Glassmorphism.** No `backdrop-filter: blur()`. Surfaces are opaque. Modal backdrops dim with a plain rgba scrim. (A subtle translucent tint *without* blur is acceptable on dark photo heroes.)
4. **Shimmer / sheen / pulse decoration.** No keyframes that sweep gradients across surfaces, pulse badges, or float elements. The only legal pulses encode live semantic state (a countdown entering its urgent phase, a genuinely-new-item dot). The only legal shimmer is a loading skeleton.
5. **Gradient abuse.** No `background-clip: text` gradient text. No gradients on buttons, badges, chips, stat numbers, or any small component. No decorative corner radial glows ("ambient" brand-colored blurs). Gradients are legal in exactly two places: (a) photography overlay washes for text legibility, (b) a large brand-colored hero surface as a *barely perceptible* tonal shift. (One more, optional: a ±15° hue nudge inside a CTA fill itself, felt as richness rather than read as a gradient — Kayak does this; flat is also fine.)
6. **Purple.** `#7c3aed`, `#8b5cf6`, `#a855f7` and friends. Unless purple is genuinely the established brand, it is the canonical AI color. Remove it.
7. **Uppercase letter-spaced "eyebrow" labels** above headings on marketing pages ("THE PLATFORM ADVANTAGE"-style kickers). Sections lead with the heading itself. Uppercase micro-labels survive at exactly one system level: data labels — table headers, `dt` in fact ledgers, footer column titles.
8. **Em-dashes in user-visible copy.** Rewrite with a period, comma, colon, or parentheses. Page titles separate with `|`. (En-dashes inside numeric ranges are fine.)
9. **Auto-scrolling marquees.** Logo strips and testimonial rows are static.
10. **Faux browser chrome** (macOS traffic-light dots) framing product screenshots. Use a plain frame or a slim address strip.
11. **Emoji as UI icons.** No ✨, no 🚀, no emoji standing in for iconography anywhere.
12. **Entrance-animation choreography on every surface** (staggered fade-up-on-scroll everywhere). At most ONE restrained page-load reveal on the whole site, where it earns its keep (typically the landing hero). Product/app pages default to no entrance animation.

## Part 1b — Hard bans (copy tells)

13. **Banned words:** seamless, effortless, supercharge, unlock (except a literal unlock mechanic), elevate, empower, journey (except literal travel), "game-changer", "revolutionize". These are statistical filler.
14. **Adjective claims → literal claims.** "Lightning-fast quotes" becomes "quotes within 24 hours." "Transparent pricing" becomes "2.5% fee, only when it converts." Numbers and mechanics beat adjectives; if a sentence survives with the product name swapped for any competitor, it says nothing.
15. **The tricolon reflex.** AI copy defaults to three-item lists and three icon-cards for everything. Break the rhythm: one detailed section beats three thin ones.
16. **Cutesy metaphor naming.** Pages and features get literal names ("My Quotes", "Matches"), not themed nicknames ("The Bridge", "Command Center", "Mission Control").

## Part 1c — Hard bans (structural tells)

Tells live in the page *bones*, not just the paint. AI templates systematically invert real-site conventions:

17. **Centered everything.** Real product sites left-align section headings, sentence case, aligned with their own content column. Centered-heading + centered-subhead + centered-card-trio, repeated down the page, is a top-5 structural tell. (Terminal periods on literal headlines are fine.)
18. **Closing CTA banner.** The "Ready to get started? 🚀" full-width band before the footer. Real sites end content → FAQ → footer. Delete it.
19. **Logo strip as trust.** A "trusted by" logo row under the hero. Brand-family logos live in the footer legal area. Partner/inventory logos are legal only reframed as inventory ("search across 40+ providers"), left-aligned, static.
20. **Standalone testimonial cards.** Three quote-cards with avatars is template grammar. Trust attaches to *objects* instead: ratings and counts on the product cards themselves ("Verified · 4.9 · 212 orders"), credentials inline where the entity appears, one line in the footer.
21. **Slim footer.** A 3-link centered footer reads as a template. Real product footers are heavyweight: columns grouped by audience, credential/legal strip, the works.
22. **Sign-in as a loud filled button.** Sign-in/register are quiet text links. The only loud button on the page is the single conversion CTA.
23. **Marketing nav vs product nav.** Nav links are things users *do* (product areas, How it works, FAQ, pricing), not persuasion anchors ("Features", "Benefits", "Why us"). B2B/recruitment links go quiet, top-right or footer — never a homepage section.
24. **Icon-card trios vs density.** Three icon+heading+sentence cards is the default AI section. Users of real products expect information-rich surfaces: a `dt/dd` fact ledger, a comparison table, priced specifics. Density is credibility.
25. **Below-fold sections argue instead of offer.** Prefer inventory-shaped content (real product previews with real data, dense fact rows) over persuasion sections. Where a card row overflows, let it cut at the viewport edge — the cut edge signals inventory, not layout failure.

---

## Part 2 — Positive doctrine (what to ship instead)

These reference values were mined from Kayak's shipped CSS (post-2023 rebrand) and cross-checked against Booking/Expedia. Use them as tiebreakers when unsure what "professional" looks like.

- **One accent, spent carefully.** The brand accent appears in exactly ONE semantic: the conversion CTA. Everything else is near-black ink (`#192024`-class) on white/near-white. If the accent appears more than ~2× per viewport, hierarchy is broken and nothing reads as premium.
- **Secondary buttons are solid dark-neutral** (e.g. `#363f45` with white text), not brand-colored, not ghost-brand. Links and selected states use a quiet darkened variant, not the loud brand color.
- **Cards: border first, shadow earned.** Default card = 1px neutral border (`#d9e2e8`-class), NO shadow. Shadow is earned by elevation — dropdowns, modals, drag states. One shadow family only, derived from the ink color at ~4 alpha stops. Never invent new box-shadow values per component.
- **Radius hierarchy, measured:** 8px dominates (controls, cards), 4px second (small elements), 12–16px for modals. Pills (`9999px`) only for genuine status chips and count badges — never pill-shaped buttons or inputs.
- **Type: one family, four weights** (400/500/600/700). Body ~14px/20. Emphasis via weight, not size inflation. `letter-spacing: normal` everywhere EXCEPT numerals: prices/stats get +0.5–0.75px tracking and `font-variant-numeric: tabular-nums` (a dedicated numerals style).
- **Status chips are pale-wash + dark-ink pairs** (`#fff0f0` bg + `#820d17` text), never saturated fills with white text. One state = one encoding — never a rail + a chip + a tick all shouting the same state.
- **Status rails** (3–4px left border on cards) encode semantic state only (urgent/new/won/closed) — never decoration on static content.
- **Motion: hover changes color only.** Transitions 150–300ms on color/border/background. One entrance animation on the whole homepage (~0.8s hero) at most. `backdrop-filter` appears once in ~970KB of Kayak CSS — treat that as the budget.
- **Real product, real photography.** Marketing surfaces show actual product components filled with plausible mock data, and real photography — never fake dashboard illustrations, abstract blobs, or stock-illustration people.
- **Left nav conventions:** hamburger is the FIRST header element (left), drawer opens from the LEFT, grouped IA inside.
- **Every displayed value traces to a real input.** If a comparison view shows "WiFi: Premium," a structured field must exist where that exact value gets entered. Displaying data that can't be entered anywhere is a bug in the input, not the display.

### The litmus test (run on every surface before shipping)

1. Could this section be dropped into any SaaS template unchanged?
2. Does anything glow, float, shimmer, or lift?
3. Is there an uppercase eyebrow above a heading?
4. Is anything centered that a mature product site would left-align, or in a filled button it would make a text link?
5. Would Kayak/Booking/Stripe ship it?

Fix accordingly.

---

## Part 3 — The sweep procedure (for the agent)

Most tells are mechanically findable. Run these against the stylesheet/component source and triage every hit:

```
# hover lifts
grep -rn "translateY(-" --include="*.css" --include="*.scss" --include="*.tsx" --include="*.jsx" src

# glassmorphism
grep -rn "backdrop-filter" src

# gradient text
grep -rn "background-clip: *text\|-webkit-background-clip: *text" src

# gradients on components (triage: legal only on photo washes / large hero surfaces)
grep -rn "linear-gradient\|radial-gradient" src

# colored glow shadows (triage: any box-shadow whose color is a brand rgba, not neutral)
grep -rn "box-shadow" src

# shimmer/pulse/float keyframes
grep -rniE "@keyframes *(shimmer|sheen|pulse|float|glow|sweep)" src

# purple
grep -rniE "#7c3aed|#8b5cf6|#a855f7|#9333ea|#6d28d9" src

# eyebrow labels (triage: uppercase + letter-spacing on non-data-label text)
grep -rn "text-transform: *uppercase" src

# em-dashes in copy (JS/TSX string literals and copy files)
grep -rn "—" src --include="*.js" --include="*.jsx" --include="*.tsx" --include="*.md"

# banned copy words
grep -rniE "seamless|effortless|supercharge|game.chang|revolutioniz|elevate your" src

# emoji in UI
grep -rnE "✨|🚀|🎉|💡|⚡" src

# marquees / auto-carousels
grep -rniE "marquee|autoplay|auto-scroll" src

# entrance choreography (triage: staggered delays = choreography)
grep -rnE "animation-delay|stagger" src
```

Then do the non-greppable passes by eye:

1. **Structure pass:** screenshot each page; check heading alignment (left?), section endings (no closing CTA banner?), footer weight, sign-in treatment, nav content, testimonial/logo-strip presence.
2. **Accent-budget pass:** count accent-colored elements per viewport. More than ~2 → demote all but the conversion action.
3. **Density pass:** find every icon-card trio; ask what dense, specific, real content should replace it (fact table, product preview, priced rows).
4. **Copy pass:** every adjective claim becomes a number or mechanic, or gets cut.
5. **Radius/shadow inventory:** list every distinct `border-radius` and `box-shadow` value in the codebase; collapse to the token set (one shadow family, 3–4 radius steps).

### Order of operations for the fix

1. Establish tokens first (ink, neutrals, ONE accent, shadow family, radius steps, type scale) if the codebase doesn't have them.
2. Run the greps; fix every mechanical hit (these are safe, high-confidence edits).
3. Do the structural pass page by page — bones before paint.
4. Rewrite copy last, once the surfaces are calm enough to read.
5. Re-run the litmus test on every changed surface.

A note on judgment: the goal is not minimalism, it's *intention*. Density, specificity, and restraint are what make a site read as human-made. When in doubt, make the choice a working designer at a mature product company would make — not the average of every website ever scraped.
