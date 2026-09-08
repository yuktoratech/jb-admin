"use client";
import { NamedMasterPage } from "@/features/catalog/NamedMasterPage";
import { fitApi } from "@/features/catalog/catalog.api";
export default function FitsPage() { return <NamedMasterPage singular="Fit" plural="Fits" dataKey="fits" api={fitApi} />; }
