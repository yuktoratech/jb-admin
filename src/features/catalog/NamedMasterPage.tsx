"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { Table, type TableColumn } from "@/components/ui/Table";
import type { CatalogMaster, CatalogStatus, MasterListParams, MasterPayload, NamedMasterListData } from "./catalog.types";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Pagination as PaginationData } from "@/types/api";

interface NamedMasterApi<T extends CatalogMaster, K extends string> {
  list(params?: MasterListParams): Promise<NamedMasterListData<K, T>>;
  create(payload: MasterPayload): Promise<T>;
  update(id: string, payload: Partial<MasterPayload>): Promise<T>;
  deactivate(id: string): Promise<T>;
}

export function NamedMasterPage<T extends CatalogMaster, K extends string>({ singular, plural, dataKey, api }: { singular: string; plural: string; dataKey: K; api: NamedMasterApi<T, K> }) {
  const [records, setRecords] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CatalogStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editing, setEditing] = useState<T | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<T | null>(null);
  const [deactivationPending, setDeactivationPending] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => { const id = window.setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => window.clearTimeout(id); }, [search]);
  useEffect(() => { let active = true; api.list({ page, limit: 20, search: query || undefined, status }).then((data) => { if (!active) return; setRecords(data[dataKey]); setPagination(data.pagination); setError(null); }).catch((reason) => { if (active) setError(getApiErrorMessage(reason, `Unable to load ${plural.toLowerCase()}.`)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [api, dataKey, page, plural, query, reload, status]);

  const deactivate = async () => { if (!deactivating) return; setDeactivationPending(true); setError(null); try { await api.deactivate(deactivating._id); setFeedback(`${singular} deactivated successfully.`); setDeactivating(null); setReload((value) => value + 1); } catch (reason) { setError(getApiErrorMessage(reason, `Unable to deactivate ${singular.toLowerCase()}.`)); setDeactivating(null); } finally { setDeactivationPending(false); } };
  const activate = async (record: T) => { setError(null); try { await api.update(record._id, { status: "active" }); setFeedback(`${singular} activated successfully.`); setReload((value) => value + 1); } catch (reason) { setError(getApiErrorMessage(reason, `Unable to activate ${singular.toLowerCase()}.`)); } };
  const columns: Array<TableColumn<T>> = [
    { key: "name", header: `${singular} Name`, render: (record) => <span className="font-semibold text-neutral-950">{record.name}</span> },
    { key: "slug", header: "Slug", render: (record) => <code className="text-xs text-neutral-600">{record.slug}</code> },
    { key: "status", header: "Status", render: (record) => <Badge tone={record.status === "active" ? "active" : "inactive"}>{record.status}</Badge> },
    { key: "created", header: "Created", render: (record) => formatDate(record.createdAt) },
    { key: "actions", header: <span className="sr-only">Actions</span>, className: "text-right", render: (record) => <div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => { setEditing(record); setFormOpen(true); }}>Edit</Button>{record.status === "active" ? <Button variant="ghost" size="sm" className="text-[#7A1F2B]" onClick={() => setDeactivating(record)}>Deactivate</Button> : <Button variant="ghost" size="sm" onClick={() => void activate(record)}>Activate</Button>}</div> },
  ];

  return <div className="mx-auto w-full max-w-[1500px]"><PageHeader title={plural} description={`Manage the ${plural.toLowerCase()} available to the finalized product catalogue.`} actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}>+ Add {singular}</Button>} />{feedback ? <div className="mb-4 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{feedback}</div> : null}{error && records.length ? <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</div> : null}<section className="overflow-hidden rounded-lg border border-neutral-200 bg-white"><div className="grid gap-3 border-b border-neutral-200 p-4 sm:grid-cols-[minmax(240px,1fr)_220px]"><Input aria-label={`Search ${plural}`} placeholder={`Search ${plural.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)} /><Select aria-label="Filter by status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as CatalogStatus | ""); }}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></Select></div>{loading ? <LoadingState label={`Loading ${plural.toLowerCase()}`} /> : error && !records.length ? <ErrorState message={error} onRetry={() => setReload((value) => value + 1)} /> : records.length ? <><Table columns={columns} rows={records} rowKey={(record) => record._id} /><Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.limit} onPageChange={setPage} /></> : <EmptyState title={`No ${plural.toLowerCase()} found`} description={query || status ? "Try changing the current filters." : `Add the first ${singular.toLowerCase()} to begin.`} />}</section>{formOpen ? <NamedMasterForm key={editing?._id ?? "new"} singular={singular} record={editing} api={api} onClose={() => { setFormOpen(false); setEditing(null); }} onSaved={(message) => { setFeedback(message); setReload((value) => value + 1); }} /> : null}<ConfirmDialog isOpen={Boolean(deactivating)} title={`Deactivate ${singular.toLowerCase()}`} description={`Deactivate ${deactivating?.name ?? `this ${singular.toLowerCase()}`}? It can be reactivated later.`} confirmLabel="Deactivate" tone="danger" isConfirming={deactivationPending} onClose={() => setDeactivating(null)} onConfirm={() => void deactivate()} /></div>;
}

function NamedMasterForm<T extends CatalogMaster, K extends string>({ singular, record, api, onClose, onSaved }: { singular: string; record: T | null; api: NamedMasterApi<T, K>; onClose: () => void; onSaved: (message: string) => void }) {
  const [name, setName] = useState(record?.name ?? ""); const [slug, setSlug] = useState(record?.slug ?? ""); const [status, setStatus] = useState<CatalogStatus>(record?.status ?? "active"); const [errors, setErrors] = useState<Record<string, string>>({}); const [requestError, setRequestError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); const next: Record<string,string> = {}; if (!name.trim()) next.name = `${singular} name is required.`; if (slug.trim() && !/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(slug.trim())) next.slug = "Use letters, numbers, and single hyphens only."; setErrors(next); if (Object.keys(next).length) return; setSaving(true); setRequestError(null); try { const payload: MasterPayload = { name: name.trim(), ...(slug.trim() ? { slug: slug.trim() } : {}), status }; if (record) await api.update(record._id, payload); else await api.create(payload); onSaved(`${singular} ${record ? "updated" : "created"} successfully.`); onClose(); } catch (reason) { setErrors(getApiFieldErrors(reason)); setRequestError(getApiErrorMessage(reason, `Unable to save ${singular.toLowerCase()}.`)); } finally { setSaving(false); } };
  return <Modal isOpen onClose={onClose} closeOnBackdrop={!saving} title={`${record ? "Edit" : "Add"} ${singular}`} description={`Configure the backend ${singular.toLowerCase()} master.`} footer={<><Button variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" form="named-master-form" isLoading={saving}>Save</Button></>}><form id="named-master-form" className="space-y-4" onSubmit={submit} noValidate>{requestError ? <div className="bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{requestError}</div> : null}<Input label={`${singular} Name`} value={name} onChange={(event) => setName(event.target.value)} error={errors.name} maxLength={100} required /><Input label="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} error={errors.slug} maxLength={120} hint="Optional; the backend generates it from the name when omitted." /><Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as CatalogStatus)} error={errors.status}><option value="active">Active</option><option value="inactive">Inactive</option></Select></form></Modal>;
}
