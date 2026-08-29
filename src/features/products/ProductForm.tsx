"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { categoryApi } from "@/features/categories/category.api";
import type { Category } from "@/features/categories/category.types";
import {
  ColorSizeSetBuilder,
  createEmptyColorGroup,
  type ColorGroupDraft,
} from "@/features/products/ColorSizeSetBuilder";
import { productApi } from "@/features/products/product.api";
import type { CatalogStatus, Product, ProductPayload, ProductUpdatePayload } from "@/features/products/product.types";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { normalizeSkuPart } from "@/lib/utils";

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
}

type FormErrors = Partial<Record<
  "productName" | "productCode" | "title" | "categoryId" | "description" | "mrp" | "fit" | "patternWash" | "fabric" | "sleeves" | "waist" | "images" | "status" | "colors",
  string
>>;

const optionalValue = (value: string) => value.trim() || undefined;

export function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [productName, setProductName] = useState(product?.productName ?? "");
  const [productCode, setProductCode] = useState(product?.productCode ?? "");
  const [title, setTitle] = useState(product?.title ?? "");
  const [categoryId, setCategoryId] = useState(product?.category?._id ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [mrp, setMrp] = useState(product ? String(product.mrp) : "");
  const [fit, setFit] = useState(product?.fit ?? "");
  const [patternWash, setPatternWash] = useState(product?.patternWash ?? "");
  const [fabric, setFabric] = useState(product?.fabric ?? "");
  const [sleeves, setSleeves] = useState(product?.sleeves ?? "");
  const [waist, setWaist] = useState(product?.waist ?? "");
  const [images, setImages] = useState<string[]>(product?.images?.length ? product.images : [""]);
  const [status, setStatus] = useState<CatalogStatus>(product?.status ?? "active");
  const [colors, setColors] = useState<ColorGroupDraft[]>([createEmptyColorGroup()]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    categoryApi.list({ page: 1, limit: 100, status: "active" })
      .then((data) => { if (active) setCategories(data.categories); })
      .catch((error) => { if (active) setCategoriesError(getApiErrorMessage(error, "Unable to load active categories.")); });
    return () => { active = false; };
  }, []);

  const categoryOptions = useMemo(() => {
    if (!product?.category || categories.some((category) => category._id === product.category._id)) return categories;
    return [product.category, ...categories];
  }, [categories, product]);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const normalizedName = normalizeSkuPart(productName);
    if (!productName.trim()) nextErrors.productName = "Product name is required.";
    else if (!normalizedName) nextErrors.productName = "Product name must contain letters or numbers.";
    else if (productName.trim().length > 150) nextErrors.productName = "Product name cannot exceed 150 characters.";
    if (productCode.trim() && !/^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/.test(productCode.trim())) nextErrors.productCode = "Use letters, numbers, single hyphens, or underscores only.";
    if (!title.trim()) nextErrors.title = "Product title is required.";
    else if (title.trim().length > 300) nextErrors.title = "Product title cannot exceed 300 characters.";
    if (!categoryId) nextErrors.categoryId = "Category is required.";
    const numericMrp = Number(mrp);
    if (mrp.trim() === "") nextErrors.mrp = "MRP is required.";
    else if (!Number.isFinite(numericMrp) || numericMrp < 0) nextErrors.mrp = "MRP must be zero or greater.";
    if (description.trim().length > 5000) nextErrors.description = "Description cannot exceed 5000 characters.";
    if (images.some((image) => image.trim().length > 2048)) nextErrors.images = "Image values cannot exceed 2048 characters.";

    if (mode === "create") {
      if (colors.length === 0) nextErrors.colors = "At least one color is required.";
      const seenColors = new Set<string>();
      for (const group of colors) {
        const color = normalizeSkuPart(group.color);
        if (!color) { nextErrors.colors = "Every color must contain letters or numbers."; break; }
        if (seenColors.has(color)) { nextErrors.colors = "Duplicate colors are not allowed."; break; }
        seenColors.add(color);
        if (group.sizeSets.length === 0) { nextErrors.colors = "Every color needs at least one size set."; break; }
        const seenSizes = new Set<string>();
        for (const size of group.sizeSets) {
          const sizeSet = normalizeSkuPart(size.value);
          if (!sizeSet) { nextErrors.colors = "Every size set must contain letters or numbers."; break; }
          if (seenSizes.has(sizeSet)) { nextErrors.colors = "Duplicate size sets are not allowed within a color."; break; }
          seenSizes.add(sizeSet);
        }
        if (nextErrors.colors) break;
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setRequestError(null);
    if (Object.keys(nextErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);
    try {
      if (mode === "create") {
        const payload: ProductPayload = {
          productName: productName.trim(),
          productCode: optionalValue(productCode)?.toUpperCase(),
          title: title.trim(),
          categoryId,
          description: optionalValue(description),
          mrp: Number(mrp),
          fit: optionalValue(fit),
          patternWash: optionalValue(patternWash),
          fabric: optionalValue(fabric),
          sleeves: optionalValue(sleeves),
          waist: optionalValue(waist),
          images: images.map((image) => image.trim()).filter(Boolean),
          status,
          colors: colors.map((group) => ({
            color: group.color.trim(),
            sizeSets: group.sizeSets.map((size) => size.value.trim()),
          })),
        };
        const created = await productApi.create(payload);
        router.replace(`/products/${created.product._id}`);
      } else if (product) {
        const payload: ProductUpdatePayload = {
          productName: productName.trim(),
          productCode: productCode.trim() ? productCode.trim().toUpperCase() : null,
          title: title.trim(),
          ...(categoryId !== product.category?._id ? { categoryId } : {}),
          description: description.trim(),
          mrp: Number(mrp),
          fit: fit.trim(),
          patternWash: patternWash.trim(),
          fabric: fabric.trim(),
          sleeves: sleeves.trim(),
          waist: waist.trim(),
          images: images.map((image) => image.trim()).filter(Boolean),
          status,
        };
        await productApi.update(product._id, payload);
        router.replace(`/products/${product._id}`);
      }
      router.refresh();
    } catch (error) {
      const backendErrors = getApiFieldErrors(error);
      setErrors((current) => ({
        ...current,
        productName: backendErrors.productName,
        productCode: backendErrors.productCode,
        title: backendErrors.title,
        categoryId: backendErrors.categoryId,
        mrp: backendErrors.mrp,
        colors: backendErrors.colors || Object.entries(backendErrors).find(([field]) => field.startsWith("colors."))?.[1],
      }));
      setRequestError(getApiErrorMessage(error, "Unable to save the product."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  const formTitle = mode === "create" ? "Add Product" : "Edit Product";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={formTitle}
        description={mode === "create" ? "Create one product with all of its color and size-set variants." : "Update product information. Manage variants separately from the product detail page."}
        actions={<Button variant="secondary" onClick={() => router.push(product ? `/products/${product._id}` : "/products")}>Cancel</Button>}
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {requestError ? <div className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{requestError}</div> : null}

        <FormSection title="Basic Information" description="Core catalog identity and category assignment.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Product Name" name="productName" value={productName} onChange={(event) => setProductName(event.target.value)} error={errors.productName} maxLength={150} required />
            <Input label="Product Code" name="productCode" value={productCode} onChange={(event) => setProductCode(event.target.value)} error={errors.productCode} maxLength={100} hint="Optional. Must be unique when provided." />
            <div className="sm:col-span-2"><Input label="Product Title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} error={errors.title} maxLength={300} required /></div>
            <Select label="Category" name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} error={errors.categoryId || categoriesError || undefined} required disabled={Boolean(categoriesError)}>
              <option value="">Select category</option>
              {categoryOptions.map((category) => <option key={category._id} value={category._id}>{category.name}{category.status === "inactive" ? " (Inactive)" : ""}</option>)}
            </Select>
            <Select label="Status" name="status" value={status} onChange={(event) => setStatus(event.target.value as CatalogStatus)} error={errors.status}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </Select>
            <div className="sm:col-span-2"><Textarea label="Description" name="description" value={description} onChange={(event) => setDescription(event.target.value)} error={errors.description} maxLength={5000} /></div>
          </div>
        </FormSection>

        <FormSection title="Pricing" description="Retail price stored by the current product API.">
          <div className="max-w-sm"><Input label="MRP" name="mrp" type="number" min="0" step="0.01" value={mrp} onChange={(event) => setMrp(event.target.value)} error={errors.mrp} required /></div>
        </FormSection>

        <FormSection title="Product Details" description="Optional descriptive attributes used by the catalog.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Fit" value={fit} onChange={(event) => setFit(event.target.value)} maxLength={200} error={errors.fit} />
            <Input label="Pattern / Wash" value={patternWash} onChange={(event) => setPatternWash(event.target.value)} maxLength={200} error={errors.patternWash} />
            <Input label="Fabric" value={fabric} onChange={(event) => setFabric(event.target.value)} maxLength={200} error={errors.fabric} />
            <Input label="Sleeves" value={sleeves} onChange={(event) => setSleeves(event.target.value)} maxLength={200} error={errors.sleeves} />
            <Input label="Waist" value={waist} onChange={(event) => setWaist(event.target.value)} maxLength={100} error={errors.waist} />
          </div>
        </FormSection>

        {mode === "create" ? (
          <FormSection title="Variants" description="Add dynamic colors and size sets. The backend creates and validates each SKU.">
            <ColorSizeSetBuilder productName={productName} value={colors} onChange={setColors} error={errors.colors} />
          </FormSection>
        ) : (
          <FormSection title="Variants" description="Product updates cannot modify colors or size sets through the backend product endpoint.">
            <p className="text-sm text-neutral-600">Save product changes, then use the Variants section on the product detail page to add or edit SKUs.</p>
          </FormSection>
        )}

        <FormSection title="Images" description="The backend currently accepts image URL/reference strings only; file upload is not available.">
          <div className="space-y-3">
            {images.map((image, index) => (
              <div key={index} className="flex items-start gap-2">
                <Input aria-label={`Image reference ${index + 1}`} value={image} onChange={(event) => setImages((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="https://… or backend-supported image reference" error={index === 0 ? errors.images : undefined} maxLength={2048} />
                {images.length > 1 ? <Button variant="ghost" size="sm" className="mt-1 text-neutral-500" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button> : null}
              </div>
            ))}
            {images.length < 50 ? <Button variant="secondary" size="sm" onClick={() => setImages((current) => [...current, ""])}>+ Add Image Reference</Button> : null}
          </div>
        </FormSection>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-5">
          <Button variant="secondary" onClick={() => router.push(product ? `/products/${product._id}` : "/products")}>Cancel</Button>
          <Button type="submit" isLoading={isSaving} loadingLabel="Saving product">{mode === "create" ? "Create Product" : "Save Changes"}</Button>
        </div>
      </form>
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <header className="border-b border-neutral-200 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
