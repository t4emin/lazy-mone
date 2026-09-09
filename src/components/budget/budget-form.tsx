"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, productFetch } from "@/lib/products/client";

export function BudgetForm({
  initial,
}: {
  initial: {
    monthlyBudgetTHB: number;
    warningPercent: number;
    enabled: boolean;
  };
}) {
  const router = useRouter();
  const [budget, setBudget] = useState(initial.monthlyBudgetTHB);
  const [warning, setWarning] = useState(initial.warningPercent);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [message, setMessage] = useState("");
  async function save() {
    try {
      await productFetch("/api/budget", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          monthlyBudgetTHB: budget,
          warningPercent: warning,
          enabled,
        }),
      });
      setMessage("บันทึก budget แล้ว");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }
  return (
    <section className="panel">
      <h2>AI Budget</h2>
      <label>
        Monthly budget (THB)
        <input
          type="number"
          min="1"
          value={budget}
          onChange={(event) => setBudget(Number(event.target.value))}
        />
      </label>
      <label>
        Warn at (%)
        <input
          type="number"
          min="1"
          max="99"
          value={warning}
          onChange={(event) => setWarning(Number(event.target.value))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />{" "}
        Enable budget limit
      </label>
      <p>
        <button type="button" onClick={save}>
          Save Budget
        </button>
      </p>
      {message && (
        <p
          role="status"
          className={message === "บันทึก budget แล้ว" ? "success" : "error"}
        >
          {message}
        </p>
      )}
    </section>
  );
}
