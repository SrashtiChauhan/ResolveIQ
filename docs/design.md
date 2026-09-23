# design.md — SupportFlow AI

**Reads:** Architecture.md, PRD.md
**Status:** Draft v1.0

---

## 1. Design principles

1. **Look like a support tool a real company runs, not an "AI product" demo.** No hero sections, no marketing language, no "powered by AI" badges glowing anywhere.
2. **Evidence over animation.** The differentiator is that the system shows real investigation data — the UI's job is to present that data clearly, not to decorate it.
3. **Density with hierarchy.** Support dashboards are read constantly; favor compact, scannable rows over big airy cards, but keep a clear visual hierarchy (status > customer > summary > timestamp).
4. **Two distinct surfaces, one visual language.** Customer chat and agent dashboard share the same design tokens but have different information densities — chat is conversational and spacious, dashboard is dense and tabular.

## 2. Visual direction (explicitly avoiding generic AI-SaaS look)

Rejected: purple/indigo/pink gradient palette (`#6366F1`/`#8B5CF6`/`#EC4899`), glassmorphism, glowing cards, neon accents, decorative sparkle/magic-wand icons, 3D illustrations.

Chosen direction: a **neutral paper-and-ink support console** — the aesthetic of tools like Linear or a well-built internal ops dashboard, adapted for support work.

## 3. Color system

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#FAFAF8` | App background (warm off-white, not stark white) |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--border` | `#E4E2DD` | Subtle borders/dividers |
| `--text-primary` | `#1F1D1A` | Dark charcoal (not pure black) — headings, body |
| `--text-secondary` | `#6B675F` | Metadata, timestamps, secondary labels |
| `--accent` (primary) | `#0F6E5C` | Deep teal-green — primary actions, links, active states. Chosen because it reads as "trustworthy/operational" rather than "AI/tech," and is distinct from typical SaaS blue/purple. |
| `--warning` | `#B5720B` | Amber/ochre — medium priority, pending states |
| `--destructive` | `#B3261E` | Errors, high-priority escalations, destructive actions |
| `--success` | `#2E7D4F` | Resolved states, confirmations (kept distinct from primary accent to avoid ambiguity) |
| `--focus-ring` | `#0F6E5C` at 40% opacity | Keyboard focus outline |

Dark mode (secondary, time-permitting): invert to `--bg: #17181A`, `--surface: #1E2023`, `--text-primary: #EDEBE6`, keep accent/warning/destructive hues but bump lightness ~10% for contrast.

## 4. Typography

- **Font:** Inter (system-ui fallback stack: `Inter, -apple-system, "Segoe UI", sans-serif`). No display/decorative font — this is a utility product.
- **Scale:** `12px` (meta/labels) / `14px` (body, table cells) / `16px` (customer chat body — slightly larger for readability) / `18px` (section headers) / `22px` (page titles). No oversized marketing-style headlines anywhere in the product.
- **Weight:** 400 body, 500 for emphasis/labels, 600 for headings. Avoid 700+ except status badges.

## 5. Layout

- 12-column responsive grid, `max-width: 1440px` for dashboard views, centered.
- Consistent `16px` base spacing unit (`4/8/12/16/24/32` scale).
- Corner radius: **moderate**, `6px` on buttons/inputs, `8px` on cards. Explicitly not the "everything is a pill" look.
- Borders (`1px solid var(--border)`) preferred over shadows for separating content; shadows reserved for actual overlays (modals, dropdowns) at low opacity.

## 6. Navigation

- **Customer chat:** minimal top bar (product name + "Contact Support" context), no sidebar — this is a focused single-task surface.
- **Agent dashboard:** left sidebar with sections — Tickets, Escalated, Resolved, Knowledge Base (read-only view), Analytics (if time permits). Persistent, collapsible on narrow viewports.

## 7. Customer support interface (chat)

- Single-column conversation, max-width `680px`, centered.
- Customer messages: right-aligned, `--surface` bubble with `--border` outline.
- Agent (AI) messages: left-aligned, no bubble — flat text on `--bg`, prefixed with a small neutral label ("Support") rather than a bot avatar/icon, reinforcing "this is support," not "this is a bot gimmick."
- When the agent is investigating, show a single-line inline status ("Checking your order and payment details…") that updates as tool calls happen — this is the one place motion is used, and it's informational, not decorative (simple text swap, no spinner animation with glow).
- Resolution message ends with a clear outcome line (e.g. "Refund of ₹1,299 initiated — expect it in 3–5 business days.") and, if escalated, a reference number and expected follow-up window.

## 8. AI investigation interface (shared component, used in both chat status line and dashboard detail view)

A vertical **investigation timeline**, not a chat log:
```
● Identified customer                          done
● Retrieved order #ORD-4821                    done — cancelled 2 days ago
● Retrieved payment PMT-9931                    done — ₹1,299 captured
● Checked previous tickets                      done — 1 prior ticket, unresolved
● Retrieved refund policy                       done — 3 relevant clauses
● Reasoning                                     "Cancellation + capture + no refund
                                                  issued within policy window →
                                                  eligible for refund"
● Decision: resolve_with_action (confidence 0.91)
● Action: create_refund_request → REF-2201
```
Each line uses a small status dot (`--success` filled = done, `--border` outline = pending/skipped) — no progress bars, no percentage counters, no "AI thinking" shimmer effects.

## 9. Human agent dashboard

- **Ticket list (table, not cards):** columns — Priority (colored dot, not a badge pill), Customer, Subject/intent, Status, AI confidence (if resolved by AI) or Escalation reason (if escalated), Last updated. Dense rows, `40px` height, zebra-free (rely on borders, not alternating background, to avoid visual noise).
- **Ticket detail view:** two-column layout — left: conversation transcript; right: the investigation timeline component (§8) plus a "Take action" panel (resolve, reassign priority, add note).
- **Escalation banner:** when a ticket was escalated, a single-line `--warning` or `--destructive` (based on urgency) banner at the top states the escalation reason in plain language, e.g. "Escalated — customer has contacted support 3 times about this issue without resolution."

## 10. Status indicators

- Status is always communicated via a small filled dot + text label, never color alone (accessibility) and never a glowing badge.
- Priority: Low (`--text-secondary` dot) / Medium (`--warning` dot) / High (`--destructive` dot).
- Ticket status: Open / Escalated / Resolved — text label with matching dot color, consistent across list and detail views.

## 11. Cards

Used sparingly — for summary stats only (e.g. "Open tickets: 12", "Avg. resolution time: 6m"). Flat `--surface` background, `1px` border, `8px` radius, no shadow, no icon-in-a-gradient-circle motif.

## 12. Tables

Primary content pattern for the dashboard. `14px` text, `1px` bottom border per row, sticky header, sortable columns for Priority/Status/Updated. Row hover: subtle `--bg` background shift, no scale/shadow animation.

## 13. Buttons

- Primary: solid `--accent` background, white text, `6px` radius.
- Secondary: `1px` border, transparent background, `--text-primary` text.
- Destructive: solid `--destructive`, used only for irreversible actions (e.g. force-close ticket).
- No gradient buttons, no icon-only buttons without a tooltip/label for primary actions.

## 14. Forms

- Standard labeled inputs, `1px` border, `6px` radius, `--accent` focus ring.
- Inline validation messages in `--destructive`, placed directly under the field — no toast-only errors for form validation.

## 15. Empty states

- Ticket list empty: simple line + subtext ("No escalated tickets right now. New escalations will appear here."), no illustration.
- Knowledge base view empty (edge case): "No documents indexed yet."

## 16. Loading states

- Skeleton rows (flat gray blocks, `--border`-colored, no shimmer animation) for the ticket list.
- Investigation timeline: lines appear progressively as each tool call resolves (matches the real async flow — this is functional, not decorative, motion).

## 17. Error states

- Tool/API failure surfaced inline in the investigation timeline as a distinct dot state ("Order lookup failed — retried once, still unavailable") rather than a generic toast — ties directly to FTL.md error-handling logic.
- Network error banner at top of dashboard, dismissible, `--destructive` left border with plain-language message and a retry action.

## 18. Responsive behavior

- Customer chat: fully usable at `360px` width (single column, already the default layout).
- Dashboard: sidebar collapses to icon-only under `1024px`; ticket table becomes a stacked card list under `768px` (priority/status shown as a compact header row per ticket instead of table columns).

---

## Consistency check against Architecture.md / PRD.md

- Reflects the exact `Investigation` object fields from Architecture.md §5 in the investigation timeline component (§8 here).
- Escalation reasons map 1:1 to PRD.md §12 escalation conditions.
- Confidence score display matches PRD.md acceptance criteria (visible per resolved-by-AI ticket).
- No contradictions found. **Proceeding to Agent 04 → FAD.md.**

*End of design.md*
