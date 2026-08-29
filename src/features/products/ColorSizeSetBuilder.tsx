"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { normalizeSkuPart } from "@/lib/utils";

export interface SizeSetDraft {
  id: string;
  value: string;
}

export interface ColorGroupDraft {
  id: string;
  color: string;
  sizeSets: SizeSetDraft[];
}

let draftSequence = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${draftSequence++}`;

export function createEmptyColorGroup(): ColorGroupDraft {
  return {
    id: nextId("color"),
    color: "",
    sizeSets: [{ id: nextId("size"), value: "" }],
  };
}

export function ColorSizeSetBuilder({
  productName,
  value,
  onChange,
  error,
}: {
  productName: string;
  value: ColorGroupDraft[];
  onChange: (value: ColorGroupDraft[]) => void;
  error?: string;
}) {
  const normalizedColors = value.map((group) => normalizeSkuPart(group.color));

  const updateColor = (groupId: string, color: string) => {
    onChange(value.map((group) => (group.id === groupId ? { ...group, color } : group)));
  };

  const updateSize = (groupId: string, sizeId: string, nextValue: string) => {
    onChange(value.map((group) => group.id === groupId ? {
      ...group,
      sizeSets: group.sizeSets.map((size) => size.id === sizeId ? { ...size, value: nextValue } : size),
    } : group));
  };

  const addSize = (groupId: string) => {
    onChange(value.map((group) => group.id === groupId ? {
      ...group,
      sizeSets: [...group.sizeSets, { id: nextId("size"), value: "" }],
    } : group));
  };

  const removeSize = (groupId: string, sizeId: string) => {
    onChange(value.map((group) => group.id === groupId ? {
      ...group,
      sizeSets: group.sizeSets.filter((size) => size.id !== sizeId),
    } : group));
  };

  return (
    <div>
      <div className="space-y-4">
        {value.map((group, colorIndex) => {
          const normalizedColor = normalizedColors[colorIndex];
          const isDuplicateColor = Boolean(normalizedColor) && normalizedColors.indexOf(normalizedColor) !== colorIndex;
          const normalizedSizes = group.sizeSets.map((size) => normalizeSkuPart(size.value));

          return (
            <section key={group.id} className="border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Input
                  label={`Color ${colorIndex + 1}`}
                  value={group.color}
                  onChange={(event) => updateColor(group.id, event.target.value)}
                  placeholder="e.g. BLACK"
                  error={isDuplicateColor ? "Duplicate colors are not allowed." : undefined}
                  maxLength={100}
                  required
                />
                {value.length > 1 ? (
                  <Button variant="ghost" size="sm" className="mt-7 shrink-0 text-[#7A1F2B]" onClick={() => onChange(value.filter((item) => item.id !== group.id))}>Remove color</Button>
                ) : null}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Size sets</p>
                <div className="space-y-2">
                  {group.sizeSets.map((size, sizeIndex) => {
                    const normalizedSize = normalizedSizes[sizeIndex];
                    const isDuplicateSize = Boolean(normalizedSize) && normalizedSizes.indexOf(normalizedSize) !== sizeIndex;
                    return (
                      <div key={size.id} className="flex items-start gap-2">
                        <Input
                          aria-label={`Size set ${sizeIndex + 1} for color ${colorIndex + 1}`}
                          value={size.value}
                          onChange={(event) => updateSize(group.id, size.id, event.target.value)}
                          placeholder="e.g. 30-38 or S-XL"
                          error={isDuplicateSize ? "Duplicate size set for this color." : undefined}
                          maxLength={100}
                          required
                        />
                        {group.sizeSets.length > 1 ? (
                          <Button variant="ghost" size="sm" className="mt-1 shrink-0 px-2 text-neutral-500" onClick={() => removeSize(group.id, size.id)} aria-label="Remove size set">Remove</Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => addSize(group.id)}>+ Add Size Set</Button>
              </div>
            </section>
          );
        })}
      </div>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <Button variant="secondary" className="mt-4" onClick={() => onChange([...value, createEmptyColorGroup()])}>+ Add Another Color</Button>

      <div className="mt-5 border border-neutral-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">SKU Preview</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {value.flatMap((group) => group.sizeSets.map((size) => {
            const productPart = normalizeSkuPart(productName);
            const colorPart = normalizeSkuPart(group.color);
            const sizePart = normalizeSkuPart(size.value);
            if (!productPart || !colorPart || !sizePart) return null;
            return <code key={`${group.id}-${size.id}`} className="border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-800">{productPart}_{colorPart}_{sizePart}</code>;
          }))}
          {!value.some((group) => group.color.trim() && group.sizeSets.some((size) => size.value.trim())) ? <p className="text-sm text-neutral-500">Enter a product name, color, and size set to preview generated SKUs.</p> : null}
        </div>
        <p className="mt-3 text-xs leading-5 text-neutral-500">Preview only. The backend generates and validates the authoritative SKU.</p>
      </div>
    </div>
  );
}
