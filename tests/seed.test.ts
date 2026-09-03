import { describe, expect, it, vi } from "vitest";
import { seedProducts } from "../prisma/seed";

describe("seedProducts", () => {
  it("rejects malformed fixture data before starting a database transaction", async () => {
    const transaction = vi.fn();

    await expect(seedProducts([{}], { $transaction: transaction } as never))
      .rejects.toThrow("Invalid product seed fixture");
    expect(transaction).not.toHaveBeenCalled();
  });
});
