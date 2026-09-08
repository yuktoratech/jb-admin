"use client";
import { NamedMasterPage } from "@/features/catalog/NamedMasterPage";
import { fabricApi } from "@/features/catalog/catalog.api";
export default function FabricsPage() { return <NamedMasterPage singular="Fabric" plural="Fabrics" dataKey="fabrics" api={fabricApi} />; }
