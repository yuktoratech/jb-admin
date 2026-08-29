# Just Black Admin

Internal B2B administration frontend for the Just Black catalogue and inventory APIs.

## Local setup

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5055/api/v1
```

Then run:

```bash
npm install
npm run dev
```

The configured backend must be running and have an active administrator account.

## Available routes

- `/login` — administrator sign-in
- `/dashboard` — live catalogue and inventory totals
- `/categories` — category CRUD and activation state
- `/products` — product list and filters
- `/products/new` — product, color, size-set, and SKU-preview builder
- `/products/[id]` — product and variant management
- `/products/[id]/edit` — product information editing
- `/inventory` — inventory list, filters, adjustments, and XLSX import
- `/inventory/[variantId]` — shelf stock and transaction history

All business data comes from the configured backend. Orders, wholesalers, and retailers are intentionally omitted until their APIs are ready.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```
