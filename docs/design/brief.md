# Visual brief: Operations studio

Process Atlas should feel like a well-made print tool for operators, not enterprise diagramming software. The reference mood is a warm paper desk, precise ink annotations, and one confident accent. Every screen should have clear hierarchy and enough quiet space for dense process content to breathe.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#F4F1E9` | App background |
| `paper-raised` | `#FBF9F4` | Secondary surfaces, hero panels |
| `surface` | `#FFFFFF` | Cards, lanes, dialogs |
| `ink` | `#191813` | Primary text, primary buttons |
| `ink-soft` | `#45433B` | Body copy |
| `muted` | `#777367` | Metadata, helper text |
| `line` | `#DFD9CB` | Default borders |
| `line-strong` | `#C9C2B2` | Emphasized dividers |
| `accent` | `#D14A24` | Brand, selection, Process lane emphasis |
| `accent-strong` | `#B23B1C` | Hover/pressed accent |
| `accent-soft` | `#FBE5DB` | Accent backgrounds |
| `success` | `#3E6B4F` | Passing checks |
| `success-soft` | `#E4EEE6` | Success backgrounds |
| `warning` | `#A97419` | Attention states |
| `warning-soft` | `#F7ECD2` | Attention backgrounds |

Lane tints:

| Lane | Tint | Border | Text accent |
| --- | --- | --- | --- |
| Suppliers | `#EDF1F4` | `#D3DEE6` | `#3E5B73` |
| Inputs | `#EEF2E8` | `#D6E0CA` | `#4B6640` |
| Process | `#FBEAE1` | `#F0D2C3` | `#A64727` |
| Outputs | `#F8F1DE` | `#EADDBB` | `#80621F` |
| Customers | `#F1ECF4` | `#DED3E4` | `#6A4D78` |

Primary buttons use ink with paper text. The accent is reserved for the brand mark, selected states, small highlights, and the Process lane, so it keeps its force. Never place small white text on the accent.

## Typography

- **Display:** Instrument Serif. Page titles 56–72px, editor map title 30–36px, section titles 24–28px. Tight leading, normal weight.
- **UI sans:** Geist. Body 14–15px, labels 12–13px, buttons 13–14px. Use 500–600 for controls, 400 for paragraphs.
- **Mono:** Geist Mono. Eyebrows, counts, lane numbers, keyboard hints. Uppercase with 0.12em tracking for eyebrows.
- Avoid all-caps body text. Keep paragraphs under 70 characters per line where possible.

## Shape and elevation

- Radii: 10px small controls, 14px cards, 20px panels and dialogs, 999px pills.
- Borders are 1px `line`; use tinted borders inside lanes.
- Shadows are soft and directional: `0 1px 2px rgba(25,24,19,.04), 0 16px 40px -24px rgba(25,24,19,.28)`.
- Avoid glassmorphism, heavy gradients, and neon glows. One subtle paper grain or dot texture is enough.

## Layout

- Dashboard content max width 1180px, centered, 24px gutters.
- Header 72px; sticky editor header 64px; secondary toolbar 52px.
- SIPOC lanes: five equal columns, min 220px each, horizontal scroll below 1180px. Lane headers stay at the top of each column; cards are compact but readable.
- Flow canvas: fills the remaining viewport. Floating toolbar top-left, inspector 320px on the right, minimap bottom-right, zoom controls bottom-left.
- Breakpoints: 640 (phone), 900 (tablet), 1280 (desktop). The editor is usable at tablet width; the inspector becomes an overlay below 1100px.

## Components

- **Map card:** status pill, serif title, two-line description, metadata row, miniature five-lane motif. Hover lifts by 2px and reveals the menu.
- **Lane header:** mono number (`01`), sans lane name, count, small help tooltip, tinted left rule.
- **Entry card:** white surface, 1px tinted border, 6px left accent, label 14px medium, detail 12.5px muted, drag handle and delete action appear on hover/focus.
- **Step card:** number badge, title, owner/system chips, small flow icon. Process tint is stronger than the other lanes.
- **Flow nodes:** white cards with a 3px kind stripe; start/end are dark pills; decision gets an amber stripe and a branch icon. Step index and kind label are small mono text.
- **Inspector:** quiet panel with section labels, generous field spacing, and a destructive action separated at the bottom.
- **Readiness:** a compact ring plus label in the header; the dialog uses a large score, grouped checks, and green/amber status icons.
- **Dialogs:** paper-raised surface, serif title, short description, actions right-aligned. Never full-screen except the mobile inspector.

## Motion

- Hover and focus: 120–160ms ease-out.
- Panels and dialogs: 180–220ms ease-out, 8px travel, no bounce.
- Canvas edges and node selection: React Flow defaults, reduced to 120ms where custom.
- Disable all non-essential animation under `prefers-reduced-motion: reduce`.

## Copy

- Short, concrete, calm. Prefer verbs: “Add supplier”, “Tidy flow”, “Review map”.
- Use sentence case everywhere except mono eyebrows.
- Empty states show one realistic example and one action.
- No exclamation marks, no hype adjectives, no emoji.
