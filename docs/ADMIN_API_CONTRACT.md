# Just BLACK Admin API Contract

Last verified against `jb-backend`: 7 September 2026.

This document describes the backend contract currently available to the Next.js Admin panel. The finalized business rules in `AGENTS.md` and the other files in `docs/` remain authoritative.

## 1. Connection and authentication

All routes below are relative to:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5055/api/v1
```

Protected requests use:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Do not set `Content-Type` manually for `FormData`; the browser must add the multipart boundary.

### Success envelope

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable success message",
  "data": {}
}
```

### Error envelope

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.name",
      "message": "Name is required"
    }
  ]
}
```

Expected status codes:

| Status | Meaning |
|---|---|
| `200` | Successful read/update/action |
| `201` | Successful creation/upload/preview |
| `400` | Invalid request or prohibited workflow transition |
| `401` | Missing, invalid, or expired access token |
| `403` | Authenticated but role/ownership is forbidden |
| `404` | Resource not found or not visible to the actor |
| `409` | Duplicate key, stale state, insufficient stock, or concurrency conflict |
| `413` | Uploaded file exceeds configured size |
| `429` | Sensitive Auth endpoint rate limit reached |
| `500` | Unexpected server error |

### Pagination

Most collection endpoints accept `page` and `limit`. Defaults are `page=1`, `limit=20`; maximum `limit` is `100`.

```json
{
  "data": {
    "products": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

The collection property changes by endpoint, for example `categories`, `subCategories`, `products`, `inventory`, `orders`, or `transactions`.

## 2. Admin Auth

| Method | Endpoint | Auth | Request |
|---|---|---|---|
| `POST` | `/auth/login` | Public | `{ email, password }` |
| `GET` | `/auth/me` | Any authenticated user | None |
| `POST` | `/auth/change-password` | Any authenticated user | `{ currentPassword, newPassword }` |
| `POST` | `/auth/forgot-password` | Public | `{ email }` |
| `POST` | `/auth/reset-password` | Public | `{ token, newPassword }` |

Login returns:

```json
{
  "user": {
    "_id": "MongoObjectId",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin",
    "status": "active"
  },
  "accessToken": "jwt"
}
```

Password rules: 8–128 characters with at least one lowercase letter, uppercase letter, and number. Forgot-password always gives a neutral response, whether or not the email exists.

The Admin app must reject login locally if `data.user.role !== "admin"`, even though backend authorization remains authoritative.

## 3. Wholesalers

All Wholesaler routes are Admin-only.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/wholesalers` | Paginated list |
| `POST` | `/wholesalers` | Create Wholesaler |
| `GET` | `/wholesalers/:id` | Detail |
| `PATCH` | `/wholesalers/:id` | Edit account |
| `PATCH` | `/wholesalers/:id/status` | Activate/deactivate |

List query:

```ts
{
  page?: number;
  limit?: number;
  search?: string; // max 150
  status?: "active" | "inactive";
}
```

Create body:

```json
{
  "name": "ABC Wholesale",
  "email": "owner@example.com",
  "phone": "+919876543210",
  "discountPercent": 10
}
```

`name`, `email`, and `phone` are mandatory. `discountPercent` is `0..100` and defaults to zero. Creation returns generated account credentials alongside the created account; display them once with copy and manual WhatsApp-open actions. There is no WhatsApp API integration.

Update body accepts one or more of `name`, `email`, `phone`, and `discountPercent`. Status body is:

```json
{ "status": "inactive" }
```

## 4. Retailers visible to Admin

Admin can list and read Retailers, but cannot create, edit, or change their status. Those writes belong to the owning Wholesaler.

| Method | Endpoint | Admin access |
|---|---|---|
| `GET` | `/retailers` | Yes |
| `GET` | `/retailers/:id` | Yes |
| `POST` | `/retailers` | No; Wholesaler-only |
| `PATCH` | `/retailers/:id` | No; owning Wholesaler-only |
| `PATCH` | `/retailers/:id/status` | No; owning Wholesaler-only |

List query supports `page`, `limit`, `search`, `status`, and optional `wholesalerId`.

## 5. Catalog masters

All master writes are Admin-only. `DELETE` means soft deactivation, never physical deletion.

### Category

| Method | Endpoint |
|---|---|
| `GET` | `/categories?page&limit&search&status` |
| `POST` | `/categories` |
| `GET` | `/categories/:id` |
| `PATCH` | `/categories/:id` |
| `DELETE` | `/categories/:id` |

Create/update fields:

```ts
{
  name: string;          // required on create, max 100
  slug?: string;         // lowercase letters/numbers/single hyphens
  description?: string;  // max 1000
  status?: "active" | "inactive";
}
```

### SubCategory

| Method | Endpoint |
|---|---|
| `GET` | `/subcategories?page&limit&search&status&categoryId` |
| `POST` | `/subcategories` |
| `GET` | `/subcategories/:id` |
| `PATCH` | `/subcategories/:id` |
| `DELETE` | `/subcategories/:id` |

Create body:

```json
{
  "categoryId": "MongoObjectId",
  "name": "Denim",
  "slug": "denim",
  "status": "active"
}
```

`categoryId` can be changed only before the SubCategory is referenced by a Product.

### Colour, Fit, and Fabric

Replace `{master}` with `colours`, `fits`, or `fabrics`:

| Method | Endpoint |
|---|---|
| `GET` | `/{master}?page&limit&search&status` |
| `POST` | `/{master}` |
| `GET` | `/{master}/:id` |
| `PATCH` | `/{master}/:id` |
| `DELETE` | `/{master}/:id` |

Create/update fields are `name`, optional `slug`, and optional `status`. Names are at most 100 characters. Inactive masters remain visible when explicitly filtered but cannot be used for new catalog assignments.

### SizeSet

| Method | Endpoint |
|---|---|
| `GET` | `/size-sets?page&limit&search&status` |
| `POST` | `/size-sets` |
| `GET` | `/size-sets/:id` |
| `PATCH` | `/size-sets/:id` |
| `DELETE` | `/size-sets/:id` |

Create body:

```json
{
  "label": "32-40",
  "sizes": ["32", "34", "36", "38", "40"],
  "status": "active"
}
```

Never send `pieceCount`; the backend derives it from `sizes.length`. Sizes must be non-empty and case-insensitively unique. Once any SKU references the SizeSet, `label` and `sizes` cannot change; only status can change.

For all master dropdowns, request `status=active&limit=100` unless the screen needs inactive records.

## 6. Product, ProductColour, and SKU

The authoritative hierarchy is:

```text
Product -> ProductColour -> SKU/ProductVariant -> SizeSet
```

Do not use legacy Product fields such as `title`, Product-level `productCode`, Product-level images, `patternWash`, `sleeves`, `waist`, or free-text Fit/Fabric.

### Product routes

| Method | Endpoint | Role |
|---|---|---|
| `GET` | `/products` | Admin/Wholesaler/Retailer |
| `POST` | `/products` | Admin |
| `GET` | `/products/:id` | Admin/Wholesaler/Retailer |
| `PATCH` | `/products/:id` | Admin |
| `DELETE` | `/products/:id` | Admin, soft deactivate |
| `GET` | `/products/:id/variants?status` | Admin/Wholesaler/Retailer |
| `POST` | `/products/:id/variants` | Admin |

Product list query supports `page`, `limit`, `search`, `categoryId`, `subCategoryId`, and `status`.

Create Product, ProductColours, and SKUs atomically:

```json
{
  "name": "Denim Jeans",
  "description": "Straight fit denim",
  "categoryId": "MongoObjectId",
  "subCategoryId": "MongoObjectId",
  "fitId": "MongoObjectId",
  "fabricId": "MongoObjectId",
  "mrpPerPieceMinor": 100000,
  "status": "active",
  "productColours": [
    {
      "colourId": "MongoObjectId",
      "productCode": "denim_black",
      "status": "active",
      "skus": [
        {
          "sizeSetId": "MongoObjectId",
          "status": "active"
        }
      ]
    }
  ]
}
```

An optional `sku` may be supplied only at SKU creation. If omitted, the backend generates it from Product Code and SizeSet. Product Code and SKU inputs are normalized by the backend.

Update Product accepts one or more of:

```ts
{
  name?: string;
  description?: string;
  categoryId?: ObjectId;
  subCategoryId?: ObjectId;
  fitId?: ObjectId;
  fabricId?: ObjectId;
  mrpPerPieceMinor?: number;
  status?: "active" | "inactive";
}
```

### ProductColour routes

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/product-colours?page&limit&productId&colourId&status` | List |
| `POST` | `/product-colours` | Create `{ productId, colourId, productCode, status? }` |
| `GET` | `/product-colours/:id` | Detail |
| `PATCH` | `/product-colours/:id` | Status only |
| `DELETE` | `/product-colours/:id` | Soft deactivate |

`productCode` is globally unique and immutable. Only one ProductColour may exist for a Product + Colour pair.

### SKU routes

Create an SKU under a Product:

```http
POST /products/:productId/variants
```

```json
{
  "productColourId": "MongoObjectId",
  "sizeSetId": "MongoObjectId",
  "sku": "optional_manual_lowercase_sku",
  "status": "active"
}
```

Existing SKUs support only status changes:

| Method | Endpoint | Body |
|---|---|---|
| `PATCH` | `/variants/:id` | `{ "status": "active" }` |
| `DELETE` | `/variants/:id` | None; soft deactivate |

SKU text, ProductColour, Product, and SizeSet are immutable after creation.

## 7. ProductColour images

All image writes are Admin-only.

| Method | Endpoint | Request |
|---|---|---|
| `POST` | `/product-colours/:id/images` | Multipart field `image`; optional text field `altText` |
| `DELETE` | `/product-colours/:id/images/:imageId` | None |
| `PATCH` | `/product-colours/:id/images/reorder` | `{ imageIds: [...] }` |

Allowed content: JPEG, PNG, or WebP. The backend verifies both MIME and file signature. Default maximum size is 8 MiB, configurable by the backend.

Stored/returned image shape:

```ts
{
  _id: ObjectId;
  objectKey: string;
  originalFilename: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  size: number;
  sortIndex: number;
  altText: string;
  createdAt: string;
  url: string;
}
```

Use the returned `url` for display, but use `_id` for delete/reorder. Reorder must contain every current image ID exactly once, with no missing or duplicate IDs.

## 8. Inventory

Every Inventory route is Admin-only. Quantities are always Sets.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/inventory` | Paginated inventory |
| `GET` | `/inventory/sku/:sku` | Inventory by normalized SKU |
| `GET` | `/inventory/:variantId` | Inventory by SKU entity ID |
| `GET` | `/inventory/:variantId/transactions` | Ledger history |
| `POST` | `/inventory/adjust` | ADD/REMOVE/TRANSFER |

Inventory list query:

```ts
{
  page?: number;
  limit?: number;
  search?: string;
  sku?: string;
  product?: ObjectId;
  category?: ObjectId;
  stockStatus?: "in_stock" | "out_of_stock";
}
```

Ledger query additionally accepts:

```ts
{
  type?: "ADD" | "REMOVE" | "TRANSFER" | "ORDER_DEDUCT" | "MANUAL_ADJUSTMENT";
  source?: "admin" | "import" | "order" | "system";
}
```

Manual adjustment:

```json
{
  "sku": "denim_black_32-40",
  "type": "TRANSFER",
  "quantity": 5,
  "shelf": "A-01",
  "toShelf": "B-01",
  "referenceId": "optional-reference",
  "note": "optional note"
}
```

Rules:

- `quantity` must be a positive integer.
- `shelf` is always required.
- `toShelf` is required only for `TRANSFER` and must differ from `shelf`.
- The backend rejects negative resulting stock.
- One SKU may have multiple shelf balances.
- `availableQuantity` and `totalQuantity` represent physical Sets; there is no pending reservation quantity.

## 9. Inventory Excel preview/apply

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/inventory/imports/preview` | Validate and persist preview batch |
| `POST` | `/inventory/imports/:id/apply` | Revalidate and atomically apply batch |

Preview uses multipart field `file`. Only `.xlsx` is accepted, maximum 5 MiB.

Expected columns:

```text
SKU | TYPE | QUANTITY | SHELF | TO SHELF
```

`TYPE` is `ADD`, `REMOVE`, or `TRANSFER`. Values are adjustments, not absolute balances.

The preview response contains an ImportBatch ID, row counts, normalized rows, resolved catalog details, and row errors. Do not enable Apply unless the batch is valid. Apply can still fail if stock changed after preview, and a batch cannot be applied twice.

## 10. Orders for Admin

### Routes

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/orders` | Role-scoped paginated list |
| `GET` | `/orders/:id` | Detail with snapshots/history |
| `PATCH` | `/orders/:id/admin-adjust` | Change quantities/remove items |
| `POST` | `/orders/:id/admin-cancel` | Cancel pending Admin order |
| `POST` | `/orders/:id/admin-confirm` | Atomically confirm and deduct stock |

List query:

```ts
{
  page?: number;
  limit?: number;
  search?: string;
  status?: "PENDING_WHOLESALER" | "PENDING_ADMIN" | "CONFIRMED" | "CANCELLED";
  sourceRole?: "wholesaler" | "retailer";
  wholesalerId?: ObjectId;
  retailerId?: ObjectId;
}
```

Never display or create a new `REJECTED` status.

### Adjustment

```json
{
  "items": [
    {
      "orderItemId": "MongoObjectId",
      "setQuantity": 2
    },
    {
      "orderItemId": "MongoObjectId",
      "setQuantity": 0
    }
  ]
}
```

`setQuantity: 0` removes the item. Admin may reference only existing Order item IDs and cannot add an SKU. At least one active item must remain.

### Cancellation

```json
{ "reason": "Optional cancellation reason" }
```

### Final confirmation

```http
POST /orders/:id/admin-confirm
```

No body is accepted or required. Confirmation is allowed only for `PENDING_ADMIN`. The backend reloads current stock, allocates shelves, writes inventory ledger records, and marks the Order `CONFIRMED` in one MongoDB transaction.

Do not send prices, totals, discounts, availability, or shelf allocations. Handle insufficient stock, stale status, duplicate confirmation, and competing confirmation responses as business errors. Retrying a successfully confirmed Order must not deduct stock twice.

### Order data that the screen should render

Order items contain immutable and current snapshots including:

```ts
{
  _id: ObjectId;
  productId: ObjectId;
  productColourId: ObjectId;
  skuId: ObjectId;
  sku: string;
  productName: string;
  colour: string;
  sizeSetLabel: string;
  sizes: string[];
  piecesPerSet: number;
  mrpPerPieceMinor: number;
  setMrpMinor: number;
  originalSetQty: number;
  currentSetQty: number;
  originalPieceQty: number;
  currentPieceQty: number;
  originalLineGrossMinor: number;
  currentLineGrossMinor: number;
  isRemoved: boolean;
}
```

Order-level financial snapshots:

```ts
{
  grossAmountMinor: number;
  discountPercent: number;
  discountAmountMinor: number;
  taxableAmountMinor: number;
  gstPercent: 5;
  gstAmountMinor: number;
  finalAmountMinor: number;
}
```

Also render `deliveryAddress`, `history`, `confirmedBy`, `confirmedAt`, `cancelledBy`, and `cancellationReason` when present. All money fields from the backend are authoritative.

## 11. Routes not required by the Admin UI

These exist but should not become Admin screens in the current phase:

- `/addresses/*`: Wholesaler/Retailer-owned saved-address CRUD; Admin is forbidden.
- `/notifications/devices`: client device registration/unregistration; no notification-history UI.
- `POST /orders`: Wholesaler/Retailer checkout only.
- Wholesaler accept/adjust/cancel and Retailer cancel Order routes.
- `/catalog-migrations/*`: legacy XLSX migration endpoints are operational tooling, not normal catalog management.
- The final database reconciliation command is CLI-only and must not be exposed in the Admin app.

## 12. Frontend implementation rules

### Money

The UI accepts/display rupees, while API money uses integer paise:

```ts
export const formatMinorAsINR = (minor: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(minor / 100);
```

For Product MRP input, convert a validated two-decimal rupee string to integer minor units without trusting binary floating-point arithmetic. Do not recalculate Order totals in the UI.

### Status and deletion

- Master, Product, ProductColour, and SKU `DELETE` endpoints soft-deactivate.
- Offer activation/deactivation controls rather than permanent-delete language.
- Existing inactive references remain meaningful in history.

### Set quantities

- Label inventory/order inputs as `Sets`, not pieces.
- Display `piecesPerSet` and derived current pieces for clarity.
- Do not allow negative quantities.

### Recommended Admin screen order

1. Login/session and global API error handling.
2. Wholesaler list/create/detail/edit/status.
3. Category, SubCategory, Colour, Fit, Fabric, and SizeSet masters.
4. Product list/detail/create/edit with nested ProductColours and SKUs.
5. ProductColour image upload, delete, and reorder.
6. Inventory list/detail/manual adjustment and ledger.
7. Inventory XLSX preview/apply.
8. Order list/detail/adjust/cancel/final-confirm.

## 13. Known integration cautions

- IDs are MongoDB ObjectId strings and must be 24 hexadecimal characters.
- Validation objects are strict: unexpected body/query keys cause `400` errors.
- Do not send empty strings for optional ObjectId fields.
- Fetch inactive masters separately when editing historical/inactive records.
- Product creation requires active Category, matching active SubCategory, Fit, Fabric, Colours, and SizeSets.
- A ProductColour response may contain resolved image URLs. Never persist or submit arbitrary client URLs as image metadata.
- Order and Inventory mutations can return concurrency conflicts; refresh the affected resource after a `409`.
- Backend authorization is authoritative. Hiding buttons is UX, not security.
