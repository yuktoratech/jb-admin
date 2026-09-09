# Just Black Admin

Internal B2B administration frontend for Just Black account, catalogue, inventory, and order operations.

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
- `/forgot-password` and `/reset-password` — email password recovery
- `/dashboard` — live account, catalogue, stock, and order totals and operational queues
- `/wholesalers` — Wholesaler account management
- `/retailers` — read-only Admin view of Wholesaler-owned Retailers
- `/categories`, `/subcategories`, `/colours`, `/size-sets`, `/fits`, `/fabrics` — catalogue masters
- `/products` — product list and filters
- `/products/new` — choose manual entry or XLSX import
- `/inventory` — paginated SKU stock visibility and filters
- `/inventory/import` — XLSX-only Upload → Preview → Verify → atomic Apply workflow
- `/orders` — order review, adjustment, cancellation, and final Admin confirmation

Inventory is changed through validated XLSX batches. The Admin frontend does not provide manual ADD, REMOVE, or TRANSFER controls.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
