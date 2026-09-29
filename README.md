# Krishi Bazar – Frontend

Storefront for Krishi Bazar, an online shop for rice, spices, pickles, tea and handicrafts from local farmers and artisans in Sylhet.

Built with React 17, Vite, Tailwind CSS v4, Redux and lucide icons.

## Features

- Shop by category, search and budget filter
- Product pages with photo gallery, reviews and price history chart
- Cart, shipping, payment (PayPal) and order tracking
- Customer profile with order history
- AI shopping assistant chat (backed by the Django API)
- Admin pages for products, users, orders and categories

## Requirements

- Node.js 20+
- The Django backend running on `http://127.0.0.1:8000`. The dev server forwards `/api` and `/images` requests to it.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Build for production into `build/` |
| `npm run preview` | Preview the production build |

## Project structure

```
src/
  components/        Shared UI (header, footer, product card, chat assistant, ui.js kit)
  screens/           Pages (home, product, cart, checkout, profile, admin)
  admin_components/  Admin layout and sidebar
  actions/ reducers/ constants/  Redux state
```

Theme colors are defined once in `src/index.css` under `@theme` (`--color-brand-*`).
