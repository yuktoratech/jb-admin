import type { Pagination } from "@/types/api";

export type OrderStatus = "PENDING_WHOLESALER" | "PENDING_ADMIN" | "CONFIRMED" | "CANCELLED";
export type OrderSourceRole = "wholesaler" | "retailer";
export interface OrderParty { _id: string; name: string; role: "admin" | "wholesaler" | "retailer"; }
export interface DeliveryAddressSnapshot { name: string; phone: string; addressLine1: string; addressLine2: string; city: string; state: string; postalCode: string; }
export interface OrderItem { _id: string; productId: string; productColourId: string; skuId: string; sku: string; productName: string; colour: string; sizeSetLabel: string; sizes: string[]; piecesPerSet: number; mrpPerPieceMinor: number; setMrpMinor: number; originalSetQty: number; currentSetQty: number; originalPieceQty: number; currentPieceQty: number; originalLineGrossMinor: number; currentLineGrossMinor: number; isRemoved: boolean; }
export interface OrderPricingSnapshot { pricingVersion: string; grossAmountMinor: number; discountPercent: number; discountAmountMinor: number; taxableAmountMinor: number; gstPercent: 5; gstAmountMinor: number; finalAmountMinor: number; }
export interface OrderItemChange { orderItemId: string; skuId: string; sku: string; beforeSetQty: number; afterSetQty: number; }
export interface OrderHistoryEntry { _id: string; type: "CREATED" | "WHOLESALER_ACCEPTED" | "WHOLESALER_ADJUSTED" | "ADMIN_ADJUSTED" | "RETAILER_CANCELLED" | "WHOLESALER_CANCELLED" | "ADMIN_CANCELLED" | "ADMIN_CONFIRMED"; performedBy: string | OrderParty; performedByRole: OrderParty["role"]; timestamp: string; previousStatus: OrderStatus | null; newStatus: OrderStatus; reason?: string; itemChanges: OrderItemChange[]; }
export interface Order extends OrderPricingSnapshot { _id: string; orderNumber: string; sourceRole: OrderSourceRole; placedBy: string | OrderParty; wholesaler: string | OrderParty; retailer: string | OrderParty | null; status: OrderStatus; items: OrderItem[]; deliveryAddress: DeliveryAddressSnapshot; confirmedBy?: string | OrderParty; confirmedAt?: string; cancelledBy?: OrderParty["role"]; cancellationReason?: string; history: OrderHistoryEntry[]; createdAt: string; updatedAt: string; }
export interface OrderListData { orders: Order[]; pagination: Pagination; }
export interface OrderListParams { page?: number; limit?: number; search?: string; status?: OrderStatus | ""; sourceRole?: OrderSourceRole | ""; wholesalerId?: string; retailerId?: string; }
export interface AdminOrderAdjustmentPayload { items: Array<{ orderItemId: string; setQuantity: number }>; }
export interface CancelOrderPayload { reason?: string; }
