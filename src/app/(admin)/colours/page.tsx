"use client";
import { NamedMasterPage } from "@/features/catalog/NamedMasterPage";
import { colourApi } from "@/features/catalog/catalog.api";
export default function ColoursPage() { return <NamedMasterPage singular="Colour" plural="Colours" dataKey="colours" api={colourApi} />; }
