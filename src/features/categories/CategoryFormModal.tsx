"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { categoryApi } from "@/features/categories/category.api";
import type { Category, CategoryStatus } from "@/features/categories/category.types";
import type { SizeFamily } from "@/features/catalog/catalog.types";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";

interface CategoryFormModalProps {
  isOpen: boolean;
  category?: Category | null;
  onClose: () => void;
  onSaved: (category: Category) => void;
}

type FormErrors = Partial<Record<"name" | "description" | "status" | "sizeFamily", string>>;

export function CategoryFormModal({ isOpen, category, onClose, onSaved }: CategoryFormModalProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [status, setStatus] = useState<CategoryStatus>(category?.status ?? "active");
  const [sizeFamily, setSizeFamily] = useState<SizeFamily | "">(category?.sizeFamily ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = "Category name is required.";
    if (name.trim().length > 100) nextErrors.name = "Category name cannot exceed 100 characters.";
    if (description.trim().length > 1000) nextErrors.description = "Description cannot exceed 1000 characters.";
    if (!sizeFamily) nextErrors.sizeFamily = "Size family is required.";
    setErrors(nextErrors);
    setRequestError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: category ? description.trim() : (description.trim() || undefined),
        status,
        sizeFamily: sizeFamily as SizeFamily,
      };
      const savedCategory = category
        ? await categoryApi.update(category._id, payload)
        : await categoryApi.create(payload);
      onSaved(savedCategory);
      onClose();
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      setErrors({
        name: fieldErrors.name,
        description: fieldErrors.description,
        status: fieldErrors.status,
        sizeFamily: fieldErrors.sizeFamily,
      });
      setRequestError(getApiErrorMessage(error, "Unable to save the category."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Edit category" : "Add category"}
      description="Configure the category details."
      closeOnBackdrop={!isSaving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button type="submit" form="category-form" isLoading={isSaving} loadingLabel="Saving">{category ? "Save changes" : "Add category"}</Button>
        </>
      }
    >
      <form id="category-form" className="space-y-5" onSubmit={handleSubmit} noValidate>
        {requestError ? <div className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{requestError}</div> : null}
        <Input label="Category name" name="name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} maxLength={100} required autoFocus />
        <Textarea label="Description" name="description" value={description} onChange={(event) => setDescription(event.target.value)} error={errors.description} maxLength={1000} placeholder="Optional category description" />
        <Select label="Size family" name="sizeFamily" value={sizeFamily} onChange={(event) => setSizeFamily(event.target.value as SizeFamily)} error={errors.sizeFamily} required>
          <option value="">Requires configuration</option><option value="ALPHA">ALPHA</option><option value="NUMERIC">NUMERIC</option>
        </Select>
        <Select label="Status" name="status" value={status} onChange={(event) => setStatus(event.target.value as CategoryStatus)} error={errors.status}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </form>
    </Modal>
  );
}
