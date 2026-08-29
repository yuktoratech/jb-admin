"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { ProductForm } from "@/features/products/ProductForm";
import { productApi } from "@/features/products/product.api";
import type { Product } from "@/features/products/product.types";
import { getApiErrorMessage } from "@/lib/api";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await productApi.get(params.id);
        if (active) setProduct(data.product);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, "Unable to load the product."));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadProduct();
    return () => { active = false; };
  }, [params.id, reloadKey]);

  if (isLoading) return <LoadingState label="Loading product" />;
  if (error || !product) return <ErrorState message={error ?? "Product data is unavailable."} onRetry={() => setReloadKey((key) => key + 1)} />;
  return <ProductForm mode="edit" product={product} />;
}
