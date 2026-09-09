"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { Textarea } from "@/components/ui/Textarea";
import { orderApi } from "@/features/orders/order.api";
import type { Order, OrderHistoryEntry, OrderItem, OrderParty } from "@/features/orders/order.types";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime, formatMinorCurrency } from "@/lib/utils";

type Dialog = "adjust" | "confirm" | "cancel" | null;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cancelReason, setCancelReason] = useState("");

  const loadOrder = useCallback(async () => {
    setLoading(true); setError(null);
    try { setOrder(await orderApi.get(id)); } catch (requestError) { setError(getApiErrorMessage(requestError, "Unable to load this order.")); } finally { setLoading(false); }
  }, [id]);
  useEffect(() => {
    // The initial route fetch owns the page loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrder();
  }, [loadOrder]);

  const openAdjust = () => { if (!order) return; setQuantities(Object.fromEntries(order.items.map((item) => [item._id, item.currentSetQty]))); setActionError(null); setDialog("adjust"); };
  const changedItems = useMemo(() => order?.items.filter((item) => Number.isSafeInteger(quantities[item._id]) && quantities[item._id] >= 0 && quantities[item._id] !== item.currentSetQty).map((item) => ({ orderItemId: item._id, setQuantity: quantities[item._id] })) ?? [], [order, quantities]);
  const remainingItems = order?.items.filter((item) => (quantities[item._id] ?? item.currentSetQty) > 0).length ?? 0;
  const canAct = order?.status === "PENDING_ADMIN";

  async function runAction(action: () => Promise<Order>) {
    if (submitting) return;
    setSubmitting(true); setActionError(null);
    try { const updated = await action(); setOrder(updated); setDialog(null); setCancelReason(""); } catch (requestError) { setActionError(getApiErrorMessage(requestError, "Unable to complete the order action.")); } finally { setSubmitting(false); }
  }

  if (loading) return <LoadingState label="Loading order" />;
  if (error || !order) return <ErrorState message={error ?? "Order is unavailable."} onRetry={() => void loadOrder()} />;

  return <div className="mx-auto w-full max-w-[1500px]">
    <PageHeader title={order.orderNumber} description={`Placed ${formatDateTime(order.createdAt)} · ${order.sourceRole === "retailer" ? "Retailer order" : "Direct Wholesaler order"}`} actions={<><Button variant="secondary" onClick={() => router.push("/orders")}>Back to Orders</Button>{canAct ? <><Button variant="secondary" onClick={openAdjust}>Adjust Order</Button><Button variant="danger" onClick={() => { setActionError(null); setDialog("cancel"); }}>Cancel Order</Button><Button onClick={() => { setActionError(null); setDialog("confirm"); }}>Confirm Order</Button></> : null}</>} />
    {actionError && !dialog ? <Alert message={actionError} /> : null}
    <section className="grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
      <Summary label="Status" value={<StatusBadge status={order.status} />} />
      <Summary label="Placed By" value={partyName(order.placedBy)} />
      <Summary label="Wholesaler" value={partyName(order.wholesaler)} />
      <Summary label="Retailer" value={partyName(order.retailer)} />
    </section>

    <Section title="Order Items" description="Original values are preserved alongside the current Admin-review snapshot.">
      <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-y border-neutral-200 bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-500"><tr>{["Product / SKU", "Colour / Size Set", "MRP / Piece", "Pieces / Set", "Original Sets", "Current Sets", "Current Pieces", "Line Gross"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-neutral-200">{order.items.map((item) => <ItemRow key={item._id} item={item} />)}</tbody></table></div>
    </Section>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
      <Section title="Delivery Address"><address className="not-italic text-sm leading-7 text-neutral-700"><strong className="text-neutral-950">{order.deliveryAddress.name}</strong><br />{order.deliveryAddress.phone}<br />{order.deliveryAddress.addressLine1}{order.deliveryAddress.addressLine2 ? <><br />{order.deliveryAddress.addressLine2}</> : null}<br />{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</address></Section>
      <Section title="Pricing Snapshot"><dl className="space-y-3"><Price label="Gross" value={order.grossAmountMinor} /><Price label={`Discount (${order.discountPercent}%)`} value={order.discountAmountMinor} negative /><Price label="Taxable" value={order.taxableAmountMinor} /><Price label={`GST (${order.gstPercent}%)`} value={order.gstAmountMinor} /><Price label="Final Amount" value={order.finalAmountMinor} total /></dl><p className="mt-4 text-xs text-neutral-500">Backend pricing snapshot · {order.pricingVersion}</p></Section>
    </div>

    {(order.confirmedAt || order.cancellationReason) ? <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5 text-sm sm:p-6">{order.confirmedAt ? <p><strong>Confirmed:</strong> {formatDateTime(order.confirmedAt)} by {partyName(order.confirmedBy)}</p> : null}{order.cancellationReason ? <p><strong>Cancellation reason:</strong> {order.cancellationReason}</p> : null}</section> : null}

    <Section title="Order History" description="Append-only backend activity and item adjustment audit trail." className="mt-6"><ol className="divide-y divide-neutral-200">{order.history.map((entry) => <HistoryEntry key={entry._id} entry={entry} />)}</ol></Section>

    <Modal isOpen={dialog === "adjust"} onClose={() => !submitting && setDialog(null)} title="Adjust Order" description="Change quantities in Sets or set a quantity to 0 to remove an existing item. Products cannot be added." size="xl" closeOnBackdrop={!submitting} footer={<><Button variant="secondary" disabled={submitting} onClick={() => setDialog(null)}>Close</Button><Button disabled={!changedItems.length || remainingItems === 0} isLoading={submitting} loadingLabel="Saving" onClick={() => void runAction(() => orderApi.adjust(order._id, { items: changedItems }))}>Save Adjustments</Button></>}>
      {actionError ? <Alert message={actionError} /> : null}<div className="space-y-3">{order.items.map((item) => <div key={item._id} className="grid items-center gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-[1fr_150px]"><div><p className="font-medium text-neutral-950">{item.productName} · {item.colour} · {item.sizeSetLabel}</p><p className="mt-1 font-mono text-xs text-neutral-500">{item.sku} · Original {item.originalSetQty} Sets</p></div><Input label="Current Sets" type="number" min={0} step={1} value={quantities[item._id] ?? item.currentSetQty} onChange={(event) => setQuantities((current) => ({ ...current, [item._id]: Number(event.target.value) }))} /></div>)}</div>{remainingItems === 0 ? <p className="mt-3 text-sm text-red-700">At least one item must remain in the order.</p> : null}
    </Modal>

    <ConfirmDialog isOpen={dialog === "confirm"} onClose={() => !submitting && setDialog(null)} title="Confirm Order and Deduct Stock?" description="The backend will revalidate live stock, deduct deterministic shelf balances, write inventory ledger entries, and confirm the order atomically. This final action cannot be undone." confirmLabel="Confirm & Deduct Stock" isConfirming={submitting} error={actionError} onConfirm={() => void runAction(() => orderApi.confirm(order._id))} />
    <Modal isOpen={dialog === "cancel"} onClose={() => !submitting && setDialog(null)} title="Cancel Order?" description="Cancellation is final and does not mutate stock." size="sm" closeOnBackdrop={!submitting} footer={<><Button variant="secondary" disabled={submitting} onClick={() => setDialog(null)}>Keep Order</Button><Button variant="danger" isLoading={submitting} loadingLabel="Cancelling" onClick={() => void runAction(() => orderApi.cancel(order._id, cancelReason.trim() ? { reason: cancelReason.trim() } : {}))}>Cancel Order</Button></>}><>{actionError ? <Alert message={actionError} /> : null}<Textarea label="Reason (optional)" value={cancelReason} maxLength={1000} onChange={(event) => setCancelReason(event.target.value)} /></></Modal>
  </div>;
}

function Section({ title, description, children, className = "mt-6" }: { title: string; description?: string; children: React.ReactNode; className?: string }) { return <section className={`${className} overflow-hidden rounded-lg border border-neutral-200 bg-white`}><header className="border-b border-neutral-200 px-5 py-4 sm:px-6"><h2 className="text-sm font-semibold text-neutral-950">{title}</h2>{description ? <p className="mt-1 text-xs text-neutral-500">{description}</p> : null}</header><div className="p-5 sm:p-6">{children}</div></section>; }
function Summary({ label, value }: { label: string; value: React.ReactNode }) { return <div className="bg-white p-5"><p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p><div className="mt-2 text-sm font-semibold text-neutral-950">{value}</div></div>; }
function Price({ label, value, negative = false, total = false }: { label: string; value: number; negative?: boolean; total?: boolean }) { return <div className={`flex justify-between gap-4 ${total ? "border-t border-neutral-200 pt-3 text-base font-bold" : "text-sm"}`}><dt className="text-neutral-600">{label}</dt><dd className="font-semibold text-neutral-950">{negative ? "−" : ""}{formatMinorCurrency(value)}</dd></div>; }
function ItemRow({ item }: { item: OrderItem }) { return <tr className={item.isRemoved ? "bg-neutral-50 text-neutral-400" : "text-neutral-700"}><td className="px-4 py-4"><p className="font-medium text-neutral-950">{item.productName} {item.isRemoved ? <Badge tone="inactive" className="ml-2">Removed</Badge> : null}</p><p className="mt-1 font-mono text-xs">{item.sku}</p></td><td className="px-4 py-4">{item.colour}<br /><span className="text-xs">{item.sizeSetLabel} ({item.sizes.join(", ")})</span></td><td className="px-4 py-4">{formatMinorCurrency(item.mrpPerPieceMinor)}</td><td className="px-4 py-4">{item.piecesPerSet}</td><td className="px-4 py-4">{item.originalSetQty}</td><td className="px-4 py-4 font-semibold">{item.currentSetQty}</td><td className="px-4 py-4">{item.currentPieceQty}</td><td className="px-4 py-4 font-semibold">{formatMinorCurrency(item.currentLineGrossMinor)}</td></tr>; }
function HistoryEntry({ entry }: { entry: OrderHistoryEntry }) { return <li className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-neutral-950">{label(entry.type)}</p><p className="mt-1 text-xs text-neutral-500">{partyName(entry.performedBy)} · {label(entry.performedByRole)} · {entry.previousStatus ? `${label(entry.previousStatus)} → ` : ""}{label(entry.newStatus)}</p></div><time className="text-xs text-neutral-500">{formatDateTime(entry.timestamp)}</time></div>{entry.reason ? <p className="mt-2 text-sm text-neutral-700">Reason: {entry.reason}</p> : null}{entry.itemChanges.length ? <ul className="mt-2 space-y-1 text-xs text-neutral-600">{entry.itemChanges.map((change) => <li key={`${entry._id}-${change.orderItemId}`}>{change.sku}: {change.beforeSetQty} → {change.afterSetQty} Sets</li>)}</ul> : null}</li>; }
function partyName(party?: string | OrderParty | null): string { if (!party) return "—"; return typeof party === "string" ? party : party.name; }
function label(value: string): string { return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function Alert({ message }: { message: string }) { return <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</div>; }
function StatusBadge({ status }: { status: Order["status"] }) { const tone = status === "CONFIRMED" ? "active" : status === "CANCELLED" ? "inactive" : status === "PENDING_ADMIN" ? "maroon" : "warning"; return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>; }
