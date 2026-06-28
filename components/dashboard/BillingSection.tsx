"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { Tier } from "@/lib/tier";
import { TIER_LABELS } from "@/lib/tier";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CARD_BRANDS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  jcb: "JCB",
  unionpay: "UnionPay",
  diners: "Diners",
};

interface BillingInfo {
  subscription: { nextBillingDate: string | null } | null;
  card: { brand: string; last4: string; expMonth: number; expYear: number } | null;
}

function UpdateCardForm({ onSuccess, onCancel, retry }: { onSuccess: () => void; onCancel: () => void; retry?: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/setup-intent", { method: "POST" });
      const { clientSecret, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);

      const cardEl = elements.getElement(CardElement);
      if (!cardEl) throw new Error("Card element not found");

      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardEl },
      });

      if (stripeError) throw new Error(stripeError.message);
      if (!setupIntent?.payment_method) throw new Error("No payment method returned");

      const updateRes = await fetch("/api/billing/set-default-card", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: setupIntent.payment_method, retry: retry ?? false }),
      });
      if (!updateRes.ok) throw new Error("Failed to set card as default");

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 10,
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.12)",
          marginBottom: 12,
        }}
      >
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: "#f5f5f5",
                fontFamily: "sans-serif",
                fontSize: "15px",
                "::placeholder": { color: "rgba(255,255,255,0.3)" },
              },
              invalid: { color: "#ff4444" },
            },
          }}
        />
      </div>
      {error && <p style={{ color: "#ff4444", fontSize: 13, marginBottom: 10 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={saving || !stripe}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            background: "#00ff88",
            color: "#000",
            fontWeight: 700,
            fontSize: 13,
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Card"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.6)",
            fontWeight: 600,
            fontSize: 13,
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function BillingSection({ tier, retryOnSave }: { tier: Tier; retryOnSave?: boolean }) {
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/billing/info");
      const data = await res.json();
      setInfo(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleSuccess() {
    setUpdating(false);
    setSaved(true);
    load();
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return null;

  const brandLabel = info?.card ? (CARD_BRANDS[info.card.brand] ?? info.card.brand) : null;
  const tierLabel = tier ? TIER_LABELS[tier] : null;

  return (
    <div
      style={{
        padding: "20px 24px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        marginBottom: 32,
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", margin: "0 0 16px" }}>
        BILLING
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: updating ? 20 : 0 }}>
        {tierLabel && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", margin: "0 0 4px" }}>PLAN</p>
            <p style={{ color: "#f5f5f5", fontSize: 15, fontWeight: 600, margin: 0 }}>{tierLabel}</p>
          </div>
        )}
        {info?.subscription?.nextBillingDate && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", margin: "0 0 4px" }}>NEXT BILLING</p>
            <p style={{ color: "#f5f5f5", fontSize: 15, fontWeight: 600, margin: 0 }}>{info?.subscription?.nextBillingDate}</p>
          </div>
        )}
        {info?.card && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", margin: "0 0 4px" }}>CARD ON FILE</p>
            <p style={{ color: "#f5f5f5", fontSize: 15, fontWeight: 600, margin: 0 }}>
              {brandLabel} •••• {info?.card?.last4}
              <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400, fontSize: 13 }}>
                {" "}exp {String(info?.card?.expMonth).padStart(2, "0")}/{String(info?.card?.expYear).slice(-2)}
              </span>
            </p>
          </div>
        )}
      </div>

      {saved && (
        <p style={{ color: "#00ff88", fontSize: 13, margin: "12px 0 0" }}>Card updated successfully.</p>
      )}

      {!updating && !saved && (
        <button
          type="button"
          onClick={() => setUpdating(true)}
          style={{
            marginTop: 16,
            padding: "8px 18px",
            borderRadius: 8,
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            fontWeight: 600,
            fontSize: 13,
            border: "1px solid rgba(255,255,255,0.12)",
            cursor: "pointer",
          }}
        >
          Update Card
        </button>
      )}

      {updating && (
        <Elements stripe={stripePromise}>
          <UpdateCardForm onSuccess={handleSuccess} onCancel={() => setUpdating(false)} retry={retryOnSave} />
        </Elements>
      )}
    </div>
  );
}
