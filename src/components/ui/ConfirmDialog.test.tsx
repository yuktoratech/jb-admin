import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("keeps a failed action message inside the open dialog", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Confirm order"
        description="Stock is revalidated before confirmation."
        error="Insufficient stock for sku-001."
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Confirm order" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Insufficient stock for sku-001.");
  });
});
