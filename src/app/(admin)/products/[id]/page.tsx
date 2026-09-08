"use client";
import { useParams } from "next/navigation";
import { ProductDetailManager } from "@/features/products/ProductDetailManager";
export default function ProductPage() { const { id } = useParams<{ id: string }>(); return <ProductDetailManager productId={id} />; }
