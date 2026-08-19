# ArefinLab Student Portal — Design System

| | |
|---|---|
| **Product** | ArefinLab Student Portal |
| **Document** | Design System — the single source of visual truth |
| **Version** | v0.1 |
| **Purpose** | **Input document for Claude Code.** Every color, spacing, size, and state below is a locked decision, not a suggestion. The agent implements from this document; it does not design. |
| **Companions** | `CLAUDE.md`, BRD/PRD v0.1, App Flow v0.1, Tech Stack v0.3 |
| **Base component library** | shadcn/ui (Radix + Tailwind v4) — this document fills shadcn's existing token slots; it does not replace them |

> **Agent instruction:** Read `CLAUDE.md` first. Then this document before writing any component or page. Where this document gives an exact value (hex, px, ms, font weight), use it exactly. Where it says "derive from §N," compute it from the referenced token rather than inventing a new one. If a screen or component isn't covered here, apply the nearest matching pattern in §9 rather than improvising a new visual treatment — and flag the gap rather than silently deciding.

---

## 0. Design thesis (read this before anything else)

**Friendly Modern EdTech, executed with technical precision.**

This is a deliberate synthesis of two things that usually pull apart: a warm, approachable learning product, and a payment-heavy platform that needs to look credible enough that a first-time bKash user trusts it with money. We get both by putting them in different places:

- **Precision lives in structure:** sharp 4px radius, a disciplined type scale, monospace for anything transactional (transaction IDs, verification codes), flat bordered surfaces instead of soft shadows. This is what makes the product feel engineered, not templated — and it's what makes the payment flow feel safe.
- **Warmth lives in language and space:** plain-spoken, encouraging copy (§10), generous spacing on student-facing screens (§5), a full expressive semantic palette (not just navy-and-cyan starkness), and zero cold dead-ends in error or empty states (inherited from the App Flow's `P-*` patterns, now given exact visual form in §9.5).

Do not soften the radius to "feel friendlier" and do not add decorative motion to "feel warmer." Those levers are deliberately not in use here — see §6 and §8.

**Signature element:** the **sidebar/header chrome is permanently brand-navy, in both light and dark mode.** Only the content canvas switches between light and dark. This does three things at once: it's the one unmistakably-ArefinLab visual anchor in an otherwise restrained interface, it gives users a constant wayfinding reference regardless of their mode preference, and it solves elevation without needing shadows — the dark chrome naturally reads as a distinct layer from the canvas. Every other decision in this document supports that one anchor rather than competing with it.

**Decorative brand motifs (grid backgrounds, corner crop marks) are reserved for exactly two places: the marketing site and the certificate (§9.9).** They do not appear inside the working app. Dense tables, forms, and checkout flows need low visual noise, not ornamentation — that's a direct, load-bearing decision, not an oversight.

---

## 1. Color system

### 1.1 Why the brand colors are used the way they are (read once)

Navy (`#0A1A2F`) and cyan (`#00C2FF`) are your locked brand identity, and they're kept exactly as-is at the hex level. But they are used differently inside the app than on the marketing site, because this product is used for **hours at a stretch**, not glanced at once:

- **Navy is not a canvas color.** Large navy fills are dramatic for a one-time hero impression and tiring across a long reading/study session. Navy is used for the permanent chrome (§0) and for headings/strong text in light mode — never as the background someone stares at for an hour.
- **Cyan is not a text or fill color at full saturation on light backgrounds.** Raw `#00C2FF` text on white sits at roughly 1.8:1 contrast — a clear accessibility failure. Cyan at full saturation is reserved for icons, focus rings, chart lines, badges, and — specifically — **dark-mode primary buttons**, where cyan-on-navy is a strong, on-brand, high-contrast combination (~8.6:1). For light-mode text/links, a deliberately darkened cyan (`cyan-700`, §1.3) is used instead.
- **A full neutral gray scale does the majority of the work** — backgrounds, borders, body text, card surfaces — in both modes. This is what actually determines whether the product is comfortable to read for a long time; the brand colors are seasoning, not the base.
- **Backgrounds are never pure white or pure black.** Off-white (`slate-50`) reduces glare in light mode; a dark navy-tinted near-black (not `#000000`) avoids OLED halation and harsh contrast in dark mode.

### 1.2 Token values — ready to paste into `globals.css`

These map directly onto shadcn/ui's existing CSS variable contract. Base color family: **slate** (cool-toned, hue-compatible with the brand navy). Values are hex; convert to `oklch()` only if the build pipeline requires it — do not change the colors themselves in conversion.

```css
:root {
  /* Canvas */
  --background: #F8FAFC;
  --foreground: #0F172A;
  --card: #FFFFFF;
  --card-foreground: #0F172A;
  --popover: #FFFFFF;
  --popover-foreground: #0F172A;

  /* Actions */
  --primary: #0A1A2F;
  --primary-foreground: #FFFFFF;
  --secondary: #F1F5F9;
  --secondary-foreground: #0F172A;
  --muted: #F1F5F9;
  --muted-foreground: #64748B;
  --accent: #E6F9FF;
  --accent-foreground: #0A1A2F;

  /* Semantic */
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --success: #16A34A;
  --success-foreground: #FFFFFF;
  --warning: #D97706;
  --warning-foreground: #FFFFFF;

  /* Structure */
  --border: #E2E8F0;
  --input: #E2E8F0;
  --ring: #007A9E;
  --radius: 0.25rem; /* 4px — see §4 */

  /* Charts (§9.6) */
  --chart-1: #00C2FF;
  --chart-2: #0A1A2F;
  --chart-3: #16A34A;
  --chart-4: #D97706;
  --chart-5: #64748B;

  /* Sidebar — identical in both modes, see §0 */
  --sidebar: #0A1A2F;
  --sidebar-foreground: #F8FAFC;
  --sidebar-primary: #00C2FF;
  --sidebar-primary-foreground: #0A1A2F;
  --sidebar-accent: #16273D;
  --sidebar-accent-foreground: #FFFFFF;
  --sidebar-border: #1E2E45;
  --sidebar-ring: #00C2FF;
}

.dark {
  /* Canvas */
  --background: #0B1420;
  --foreground: #F1F5F9;
  --card: #131F2E;
  --card-foreground: #F1F5F9;
  --popover: #131F2E;
  --popover-foreground: #F1F5F9;

  /* Actions — cyan becomes the primary fill in dark mode; see §1.1 */
  --primary: #00C2FF;
  --primary-foreground: #0A1A2F;
  --secondary: #1B2838;
  --secondary-foreground: #F1F5F9;
  --muted: #1B2838;
  --muted-foreground: #94A3B8;
  --accent: #16273D;
  --accent-foreground: #F1F5F9;

  /* Semantic — brightened one step for legibility against a dark canvas */
  --destructive: #F87171;
  --destructive-foreground: #0B1420;
  --success: #4ADE80;
  --success-foreground: #0B1420;
  --warning: #FBBF24;
  --warning-foreground: #0B1420;

  /* Structure */
  --border: #1E2E45;
  --input: #1E2E45;
  --ring: #00C2FF;

  /* Charts */
  --chart-1: #00C2FF;
  --chart-2: #94A3B8;
  --chart-3: #4ADE80;
  --chart-4: #FBBF24;
  --chart-5: #64748B;

  /* Sidebar — unchanged from :root, deliberately */
  --sidebar: #0A1A2F;
  --sidebar-foreground: #F8FAFC;
  --sidebar-primary: #00C2FF;
  --sidebar-primary-foreground: #0A1A2F;
  --sidebar-accent: #16273D;
  --sidebar-accent-foreground: #FFFFFF;
  --sidebar-border: #1E2E45;
  --sidebar-ring: #00C2FF;
}
```

### 1.3 Full palette reference (for shades not in the applied tokens above)

| Family | Use for | Scale |
|---|---|---|
| **Neutral** | Backgrounds, borders, body text, dividers | Tailwind's default **slate** scale (50→950) — use as-is, do not redefine |
| **Brand cyan** | Icons, links, focus rings, chart primary series, dark-mode primary actions | 50 `#E6F9FF` · 100 `#CCF2FF` · 200 `#99E6FF` · 300 `#66D9FF` · 400 `#33CCFF` · **500 `#00C2FF` (brand anchor)** · 600 `#009ECC` · **700 `#007A9E` (light-mode accessible text/link color, ~4.6:1 on white)** · 800 `#005673` · 900 `#003B4F` |
| **Brand navy** | Sidebar/chrome, light-mode headings, light-mode primary buttons | 950 `#050D17` · **900 `#0A1A2F` (brand anchor)** · 800 `#16273D` (sidebar hover) · 700 `#1E2E45` (sidebar border) · 600 `#334155` |
| **Destructive (red)** | Errors, destructive actions, overdue-critical | Tailwind red: 600 `#DC2626` (light) / 400 `#F87171` (dark) |
| **Success (green)** | Payment verified, task complete, attendance present — **reserved exclusively for confirmed/positive states, never decorative** (§9.8) | Tailwind green: 600 `#16A34A` (light) / 400 `#4ADE80` (dark) |
| **Warning (amber)** | Overdue (non-critical), pending review, drip-locked countdown | Tailwind amber: 600 `#D97706` (light) / 400 `#FBBF24` (dark) |

### 1.4 Contrast requirement

Every text/background pairing in this document targets **WCAG AA minimum (4.5:1 body text, 3:1 large text/UI components)**, with AAA (7:1) on primary reading surfaces (lesson/article body text) where the pairing allows it. **Verify programmatically at build time** — the hex values above are the design intent; run them through a contrast checker before shipping any new combination not listed here.

---

## 2. Typography

### 2.1 Typeface roles

| Role | Typeface | Source | Weights used |
|---|---|---|---|
| Headings (English only — UI stays English per App Flow) | **Space Grotesk** | Google Fonts, via `next/font/google` | 500 (H3–H4), 600 (H1–H2, Display) |
| Body / UI (English) | **Inter** | Google Fonts, via `next/font/google` | 400 (body), 500 (UI labels, buttons), 600 (emphasis) |
| Body (Bangla/Banglish runs — payment copy, bilingual content) | **Noto Sans Bengali** | Google Fonts, via `next/font/google` | 400, 500, 700 — metrically paired with Inter so mixed EN/BN paragraphs sit at a consistent visual weight |
| Monospace (data) | **JetBrains Mono** | Google Fonts, via `next/font/google` | 400 (transaction IDs, codes), 500 (emphasis) |

**Application rule:** apply `Noto Sans Bengali` automatically to any text node containing Bangla script (e.g., via a `lang="bn"` wrapper or a `.font-bn` utility applied at the CMS/content layer for bilingual strings), not manually per-instance. Never let Bangla text fall back to a system font — this is the exact failure mode flagged as a risk in the Tech Stack document.

### 2.2 Type scale (maps directly to Tailwind's default `text-*` classes)

| Token | Tailwind class | Size / line-height | Weight | Typeface | Use |
|---|---|---|---|---|---|
| Display | `text-4xl` | 36px / 44px | 600 | Space Grotesk | Marketing/hero only — not used inside the app shell |
| H1 | `text-3xl` | 30px / 38px | 600 | Space Grotesk | Page titles (course home, dashboards) |
| H2 | `text-2xl` | 24px / 32px | 600 | Space Grotesk | Section headers |
| H3 | `text-xl` | 20px / 28px | 500 | Space Grotesk | Card/panel titles |
| H4 | `text-lg` | 18px / 26px | 500 | Space Grotesk | Subsection labels |
| Body-lg | `text-base` | 16px / 26px | 400 | Inter | Lesson/article reading body — the long-session reading surface |
| Body | `text-sm` | 14px / 22px | 400 | Inter | Default UI text: tables, forms, cards, nav |
| Caption | `text-xs` | 12px / 18px | 400/500 | Inter | Meta text, timestamps, badge labels |
| Mono/data | `text-sm` (mono) | 14px / 20px | 400 | JetBrains Mono | Transaction IDs, verification codes, certificate IDs |

---

## 3. Spacing & layout

### 3.1 Spacing scale
Use Tailwind's default 4px-base spacing scale as-is (`0, 1(4px), 2(8px), 3(12px), 4(16px), 6(24px), 8(32px), 10(40px), 12(48px), 16(64px)…`). No custom scale — this matches the "don't fight the library" principle already applied in the Tech Stack document.

### 3.2 Breakpoints
Tailwind v4 defaults, unchanged: `sm 640px · md 768px · lg 1024px · xl 1280px · 2xl 1536px`.

### 3.3 Sidebar
- **Expanded: 264px.** Fits longer admin labels ("Verification Queue," "Reconciliation Report") without wrapping.
- **Collapsed (icon rail): 72px.**
- Sidebar surface uses `--sidebar-*` tokens permanently (§0, §1.2) — does not change with light/dark mode.
- Mobile: sidebar becomes a drawer (off-canvas), triggered from the top bar; bottom tab bar is the primary mobile nav per the App Flow.

### 3.4 Top bar
- Height: **64px** desktop, **56px** mobile.

### 3.5 Content max-width
- Reading surfaces (lesson body, article): **720px** max-width for body text — this is the single highest-leverage decision for long-session readability; unconstrained line length is fatiguing.
- Dashboard/table surfaces: full available width within the content area (no artificial max-width).

### 3.6 Density tokens (adaptive, per §F)

| Token | Comfortable (student-facing: STU-*, PUB-*, CLS-*) | Compact (admin/instructor data: ADM-*, INS-*) |
|---|---|---|
| Table row height | 56px | 40px |
| Card padding | 24px (`p-6`) | 16px (`p-4`) |
| Form control height | 44px | 36px |
| Base text size | `text-sm`/`text-base` | `text-sm`/`text-xs` |

Apply density as a CSS custom property or a wrapper class (`.density-comfortable` / `.density-compact`) at the layout-group level (App Router route groups already split these areas — see Tech Stack §10), not per-component.

---

## 4. Border radius

**Locked to sharp/technical, overriding shadcn's default scale.** This is deliberate per §0 — precision signals credibility on a payment-heavy product.

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 2px | Badges, chips, small tags |
| `--radius` (base, `--radius` in §1.2) | **4px** | Buttons, inputs, cards, tables, modals — the default for nearly everything |
| `--radius-lg` | 6px | Large containers only if 4px reads too tight at scale (e.g., full-page panels) |
| `--radius-full` | 9999px (pill) | **Only** avatars, status dots, and pill-shaped status badges — rounding here is functional (universally reads as "tag/status"), not decorative |

---

## 5. Elevation & surfaces

**Mixed model: flat bordered by default, shadow only on floating elements.**

- **Primary surfaces** (cards, panels, table rows, the content canvas): a single 1px `--border` line, no shadow. In dark mode, `--card` is one step lighter than `--background` (§1.2) so surfaces read as "lifted" through lightness, not shadow.
- **Floating elements only** (modals/dialogs, dropdown menus, popovers, toasts, tooltips): a soft shadow — `shadow-lg` equivalent (`0 10px 30px -10px rgb(0 0 0 / 0.25)` in dark mode; lighter opacity `0.12` in light mode). This is the *only* place shadow appears — depth should mean something (this is floating above the canvas), not decorate everything uniformly.

---

## 6. Motion

**Strictly minimal — functional only, per your explicit selection.** No celebratory, decorative, or orchestrated animation anywhere in the product.

| Interaction | Duration | Easing |
|---|---|---|
| Hover/focus state change (button, link, row) | 100ms | `ease-out` |
| Dropdown/accordion/tab panel expand | 150ms | `ease-in-out` |
| Modal/dialog open-close | 150ms | `ease-out` (opacity + 4px translate, nothing more elaborate) |
| Skeleton pulse | 1.5s loop | `ease-in-out`, opacity 0.5 ↔ 1 |
| Toast enter/exit | 150ms | `ease-out` |
| Route/page transitions | **None** — instant. Only the top-loading bar (§9.7) communicates navigation. |

`prefers-reduced-motion: reduce` disables all of the above without exception (skeletons switch to a static state, no pulse).

---

## 7. Iconography

- **Library:** `lucide-react` exclusively (already pinned in Tech Stack). No mixing icon sets.
- **Stroke width: locked at 1.75** (not the library default of 2) — a slightly finer weight that pairs with the sharp-radius, precision-oriented structure (§0, §4).
- **Sizes:** 16px (inline with `text-sm`/`text-xs`), 20px (default UI, buttons, nav), 24px (section headers, empty-state icons).
- Icons never carry meaning alone in a context where color is the only differentiator — pair with text or a label for anything status-related (accessibility).

---

## 8. Content voice (UI writing)

This is as much a locked spec as the colors. Applies to every button label, empty state, error message, and notification in the product.

- **Active voice, named by what the person controls.** "Save changes," not "Submit." A person manages payments, not a ledger record.
- **A control keeps its name through the whole flow.** The button that says "Enroll" produces a confirmation that says "Enrolled" — not "Registration successful."
- **Errors state what happened and what to do next — never apologize, never blame the user.** "This transaction ID is already recorded" + a next step, not "Oops, something went wrong."
- **Empty states are an invitation to act, not a dead end** — every empty state names one primary next action (this is already the App Flow's `P-EMPTY` pattern; this section is its voice rule).
- **Payment/verification copy is plain and reassuring by design** (ties directly to the App Flow's `P-PENDING` pattern): state what's happening, what happens next, and that no action is needed — e.g. *"Payment received. We're verifying it now — you'll get an email within a few hours. No need to call."*
- **Bilingual copy is EN/BN code-switched naturally** where it appears (payment instructions, help articles) — mirroring how the audience actually reads, not a rigid toggle between two fully separate language modes.

---

## 9. Component inventory

Organized Foundations (§1–8, above) → Primitives → Patterns → Page templates. Primitives are shadcn/ui components themed by the tokens above; only deviations and states are specified here — do not re-derive colors/radius per-component, inherit from §1–4.

### 9.1 Primitives (themed shadcn components)

| Component | Sizes | States to implement | Notes |
|---|---|---|---|
| Button | sm (36px h) / default (44px comfortable, 36px compact) / lg (48px) | default, hover, focus-visible (2px `--ring` offset 2px), active, disabled (50% opacity, no pointer), loading (inline spinner replaces label, label kept for screen readers) | Variants: primary, secondary, destructive, ghost, outline — standard shadcn set, themed via §1 tokens |
| Input / Textarea | comfortable 44px / compact 36px | default, focus (`--ring`), error (`--destructive` border + helper text below), disabled | Error helper text always present when state = error, never color-only |
| Select / Dropdown menu | matches Input height | default, open, hover-item, disabled-item | Floating surface uses §5 shadow |
| Badge / Chip | one size, `--radius-sm` | solid, subtle (tinted bg), outline | Semantic color variants map to §1.3 (success/warning/destructive/accent) |
| Checkbox / Radio | 18px control | default, checked, focus-visible, disabled | Checked state uses `--primary` |
| Tabs | underline style, not pill | default, active (2px `--primary` underline), hover, disabled | |
| Avatar | 24 / 32 / 40px | image, initials-fallback (bg `--secondary`, text `--foreground`) | |
| Tooltip | — | default only | 150ms delay before showing |
| Toast | — | success, error, warning, info | Auto-dismiss 5s except error (manual dismiss); uses §5 floating shadow |
| Dialog/Modal | sm/md/lg content widths | open, closing | Overlay: `rgb(0 0 0 / 0.5)`; content uses §5 shadow, `--radius-lg` |
| Accordion | — | collapsed, expanded, hover | 150ms per §6 |
| Breadcrumbs | — | — | Caption size, `--muted-foreground`, current page in `--foreground` |
| Pagination | — | default, active page, disabled (ends) | |
| Progress bar (linear) | 4px height (inline, e.g. video resume) / 8px (standalone, e.g. course completion row) | determinate only | `--primary` fill on `--muted` track |

### 9.2 Skeleton loaders
- Match the exact final layout's shape (card outlines, table row bars, text-line bars at the target line's width) — never a generic centered spinner for page/data loading.
- Animation: pulse per §6, opacity 0.5↔1, `--muted` base color.

### 9.3 Spinner (inline)
- 16–20px, `currentColor` (inherits button/text color), continuous rotation, no easing pause.
- **Only** used inside buttons and small inline async actions (e.g., "Verifying…" inline states) — never for full-page loading (that's the skeleton or top-loading bar).

### 9.4 Top-loading bar
- 3px height, fixed to the very top of the viewport, `--primary` (cyan in dark mode, navy in light mode — i.e., whatever `--primary` resolves to), auto-progresses and completes/fades on route navigation.

### 9.5 Empty / error / pending states (visual form of the App Flow's `P-*` patterns)

| Pattern | Visual spec |
|---|---|
| `P-EMPTY` | 24px icon (`--muted-foreground`), one-line message (`text-sm`, `--muted-foreground`), one primary button below. Centered in available space, generous vertical padding (48px+). |
| `P-ERROR` (recoverable) | Same layout as `P-EMPTY` but icon in `--destructive`, message states what happened, two actions: "Try again" (primary) + "Get help" (ghost, links to §9.8 support fallback). |
| `P-PENDING` (payment verifying) | Card layout, `--warning`-tinted icon (not destructive — this isn't an error), reassuring copy per §8, a status chip ("Verifying"), "Recheck status" button (ghost), support link. Bilingual copy where applicable. |
| `P-LOCKED` (drip content) | Row/card at 60% opacity, lock icon (16px) beside the title, unlock date in Caption size below. |
| `P-READONLY` (deactivated course) | Full-width banner, `--warning` background tint, icon + one-line explanation, sits above content; all interactive elements in the content area get `disabled` state. |

### 9.6 Charts

Built on **shadcn/ui's chart components** (Recharts underneath, pinned as `recharts@3.10.1` in the Tech Stack — see §11 for the addendum). Charts inherit `--chart-1` through `--chart-5` automatically; no per-chart color decisions.

| Metric | Chart type | Where |
|---|---|---|
| Individual course completion % | **Circular/radial progress ring** | Course home (CLS-01), student dashboard |
| Per-lesson video watched progress | Linear progress bar (§9.1), not a chart | Lesson list, resume card |
| Attendance / engagement trend over time | Line or area chart | Admin dashboard (ADM-01) |
| Revenue over time | Bar chart (monthly) | Admin dashboard, reconciliation |
| Per-session attendance rate | Simple horizontal bar or percentage + small bar | Instructor roster (INS-03) |
| Grade distribution (optional) | Bar chart (histogram-style) | Instructor grading queue (INS-04) |

### 9.7 AI-generated content indicator

The only AI-generated content in v1 is short-answer grading feedback (`FR-ASM-3`). Two states:

| State | Icon | Label | Color | Tooltip |
|---|---|---|---|---|
| AI-generated (default) | `Sparkles` (lucide) | "AI feedback" | `--accent` tint background, `--primary` icon/text | "This feedback was generated by AI and can be reviewed by your instructor." |
| Instructor-reviewed (after override, `FR-ASM-4`) | `UserCheck` (lucide) | "Instructor-reviewed" | `--success` tint background, `--success` icon/text | "Reviewed by [Instructor name]." |

Rendered as a small pill badge (`--radius-sm`, Caption text size) positioned directly above the content block it labels — never buried in a footer or requiring a click to discover.

### 9.8 Trust / payment pattern

- **`--success` green is reserved exclusively for confirmed/positive states** (payment verified, task complete, attendance present) — never used decoratively elsewhere in the UI. This is deliberate: when a student sees green, it always means "this succeeded," with no exceptions to second-guess.
- **Checkout stepper:** numbered circles connected by a line (1 → 2 → 3 → 4), mirroring bKash's own payment-confirmation flow so the pattern is already familiar. Current step: `--primary` fill, white/navy number. Completed step: `--success` fill, checkmark replaces the number. Upcoming step: `--muted` outline, `--muted-foreground` number.
- **Verified badge:** small `--success`-tinted pill with a `CheckCircle2` (lucide) icon, used only on confirmed payments/certificates — same "reserved meaning" rule as above.

### 9.9 Certificate (locked visual spec)

Resolves the PRD's open item. Generated via `@react-pdf/renderer` (Tech Stack §3.1).

- **Orientation/size:** Landscape, A4 (297mm × 210mm), 150 DPI.
- **This is the one place decorative brand motifs are used** (§0): a thin navy border frame with cyan corner accent marks (crop-mark style, echoing the marketing site), a subtle graph-paper grid watermark at low opacity in the background.
- **Content, top to bottom:** ArefinLab wordmark/logo (top center) → "Certificate of Completion" (H2, Space Grotesk) → recipient name (Display size, Space Grotesk 600) → course title (H3) → completion date + instructor name/signature line (Body) → verify ID + QR code linking to the public verify URL (bottom, JetBrains Mono for the ID string).
- **Palette:** white background (print-safe), navy text/border, cyan accent line under the recipient name only — restraint even in the one decorated artifact.

### 9.10 Data tables (admin-heavy screens)

- Built on `@tanstack/react-table` v8 (Tech Stack §4.6), styled via shadcn's Table primitive.
- Row height and padding follow the density tokens (§3.6) — compact by default on all `ADM-*`/`INS-03`/`INS-04` screens.
- Sortable column headers: hover shows `--muted-foreground` sort icon; active sort shows `--foreground` icon, no color change (avoid color-only state signaling).
- Row hover: `--accent` tint background.
- Sticky header on scroll for the verification queue and ledger specifically (highest-scroll screens).

### 9.11 Course / resource / pricing cards

- `--radius` (4px), 1px `--border`, `--card` surface, §5 flat elevation (no shadow at rest).
- Structure: thumbnail/banner (16:9) → type badge (Live Cohort / Recorded / Text-based / Mixed, `--secondary` pill) → title (H4) → one-line outcome teaser (Body, `--muted-foreground`) → price + CTA row.
- Bundle cards get a second badge showing included-course count; bundle savings shown as struck-through original price beside the bundle price.

---

## 10. Page templates

| Template | Applies to | Spec |
|---|---|---|
| **Dashboard shell** | STU-*, INS-*, ADM-* | Sidebar (§3.3) + top bar (§3.4) + content area with density per §3.6 |
| **Classroom shell** | CLS-* | Collapsible syllabus rail (320px expanded / drawer on mobile) + content pane, no standard sidebar — replaces it entirely while inside a course |
| **Public/marketing shell** | PUB-*, AUTH-* | Simple top nav + footer, no sidebar; content max-width per §3.5 |
| **Checkout shell** | PAY-* | Centered single-column, max-width 480px, stepper (§9.8) pinned at top |

---

## 11. Tech Stack addendum (action required)

This document requires one addition to the Tech Stack manifest, verified live against the npm registry:

| Package | Exact version | Purpose |
|---|---|---|
| `recharts` | **3.10.1** | Underlies shadcn/ui's chart components (§9.6); peer-verified against React 19 (`react: ^16.0.0 \|\| ^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0`) |

Apply this to `ArefinLab-Student-Portal-Tech-Stack.md` §3.1 (runtime dependencies) and §11 (`package.json`) — flagged here rather than silently added, per the "no undocumented gaps" pattern already established across this document set.

---

## 12. Accessibility baseline (non-negotiable)

- All text/background pairs meet WCAG AA at minimum (§1.4).
- Every interactive element has a visible `focus-visible` state (`--ring`, 2px, 2px offset) — never removed for aesthetics.
- Color is never the only signal for state (§7, §9.10) — always paired with an icon, label, or text change.
- Minimum touch target: 44×44px on any tappable element in comfortable density; 36×36px acceptable in compact density (admin, mouse-first contexts).
- `prefers-reduced-motion` disables all motion in §6 without exception.
- All form errors are announced via associated helper text, not color alone.

---

## 13. Open items

- Final QR-code provider/library for the certificate's verify link (§9.9) — to be selected during P3 build, subject to the same version-pin and library-age policy as the rest of the stack.
- Confirm whether the `Sparkles` / `UserCheck` icon choices (§9.7) read clearly at 16–20px in a quick visual pass once implemented; swap within the lucide set if not, but do not introduce a second icon library.
- The `--radius-lg` (6px) escape hatch in §4 should be used sparingly — audit after P1 whether any screen actually needs it or whether the base 4px covers everything.

---

*End of Design System v0.1.*
