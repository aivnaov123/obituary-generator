# Некролог онлайн — MVP

A web app that lets families (or funeral agencies) make a print-ready Bulgarian necrolog in about 2 minutes.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ — deploy to Vercel / Netlify / Cloudflare Pages
```

## What's in the MVP

- **5 types:** Тъжна вест, 40 дни, 6 месеца, 1 година, Възпоменание (N години)
- **12 design templates:** Класически, Православен, Траурна лента, Модерен, Минимален, Цветя, Мрамор, Тъмен, Свещ, Маслинова клонка, Арка, Вестник (live thumbnails, original SVG ornaments)
- **Full design editor ("2. Дизайн" tab):** click any element in the preview to style it
  - *Page:* accent color, background, text color, page frame (none / thin / thick / double / rounded / arch / corners)
  - *Photo:* shape (rectangle / rounded / oval / circle / arch), frame (thin / thick / double / mat / shadow), size, hide
  - *Every text field* (symbol, heading, subtitle, name, years, text, помен, closing, signature): font (10 Cyrillic fonts), size, color, bold / italic / UPPERCASE, alignment, letter spacing, hide, reset
  - *Symbol:* ✝ ☦ ✟ candle, or none
- **Ready Bulgarian texts** that adapt to gender and relation (съпруг, баща и дядо…), several variants per type, fully editable
- **Suggested помен dates** (40th day counts the day of death as day 1; 6 months; 1 year; yearly)
- **Photo editor** (opens on upload):
  - crop: drag and zoom in the exact frame shape of the template; rotate; undo; back to the original
  - **✨ Само портрет:** AI finds the face and crops head and shoulders (MediaPipe, runs in the browser)
  - **Background:** keep it, or replace it with white, light grey, studio, dark or blurred (AI person segmentation, in the browser)
  - **🪄 AI подобряване:** restores old, blurry or low-quality faces (GFPGAN on Replicate, server-side)
  - light: auto-fix, sharpen, brightness, contrast; hold to compare with the original
  - black-and-white option
- **Print / Save as PDF** at exact A4 size
- **Calendar reminders (.ics)** for 40 дни / 6 месеца / 1 година, with an alert 3 days before. This is the hook for repeat customers.

Everything runs in the browser except **AI подобряване**, which sends only the cropped photo to Replicate.

## AI setup

**Само портрет / background** work out of the box. The models load from Google's CDN the first time they're used.

**AI подобряване** needs a Replicate account:
1. Create a token at replicate.com → Account → API tokens.
2. In Vercel: Project → Settings → Environment Variables, add `REPLICATE_API_TOKEN`, then redeploy.
3. Cost is a fraction of a cent per photo. It uses `tencentarc/gfpgan` (Apache-2.0, fine for commercial use).
   To use another version, set `REPLICATE_GFPGAN_VERSION`.

Local testing of `/api/enhance` needs `npx vercel dev` instead of `npm run dev`.

## Files

| File | What it does |
|---|---|
| `src/App.jsx` | Editor form, preview, printing, reminders |
| `src/Sheet.jsx` | The necrolog itself (one A4 sheet) |
| `src/DesignPanel.jsx` | The design editor (page / photo / text field controls) |
| `src/Decor.jsx` | SVG ornaments: corners, flower branch, olive wreath, candle |
| `src/design.js` | Templates (defaults for every design option), fonts, shapes, frames, colors |
| `src/templates.js` | Necrolog types, closings and the Bulgarian text generator. **Add new texts here.** |
| `src/layouts.css` | Base sheet, shapes, frames, and per-template typography |
| `src/photo/` | Photo editor: `PhotoEditor.jsx` (UI), `process.js` (crop, background, light), `ai.js` (MediaPipe + server call) |
| `api/enhance.js` | Vercel serverless function for AI face restoration |
| `src/dates.js` | Bulgarian date formatting, помен dates, .ics export |

### Adding a new template
1. Add an entry to `LAYOUTS` in `design.js` with its defaults (frame, photo shape, colors, fonts, symbol, optional `decor`)
2. Optionally add `.layout-myname …` typography rules in `layouts.css`

Templates are mostly *data*, so you can make many variations (e.g. the same template in 5 colors) without new CSS.

## Next steps (in order)
1. **Save designs:** store the chosen template and overrides in localStorage or an account, so the 40-day помен reuses the same look.
2. **Payments:** free preview with a watermark, then pay €3–5 for a clean PDF (Stripe Checkout or Lemon Squeezy).
3. **Accounts plus email/SMS reminders** before each помен, with the next necrolog pre-filled. This is the recurring revenue.
4. **AI text:** a small server endpoint that writes a personal text from 3–4 facts the family gives (profession, hobbies, character).
5. **Print & delivery:** partner with a local print shop and charge a markup.
6. **QR code to an online memorial page** with photos, funeral info and condolences.
7. **Agency mode:** the agency's logo on the sheet plus a monthly subscription.
