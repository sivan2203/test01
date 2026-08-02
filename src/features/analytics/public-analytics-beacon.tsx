"use client";

import { useEffect, useRef } from "react";

import { getPublicAttributionHints } from "./source-attribution";

type PublicAnalyticsBeaconProps = {
  eventName: "store_view" | "product_view";
  storeSlug: string;
  productId?: string;
};

export function PublicAnalyticsBeacon({
  eventName,
  storeSlug,
  productId,
}: PublicAnalyticsBeaconProps) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    const attributionHints = getPublicAttributionHints(
      new URL(window.location.href),
      document.referrer,
    );

    void fetch("/api/analytics", {
      body: JSON.stringify({
        eventName,
        storeSlug,
        productId,
        ...attributionHints,
      }),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(() => {
      // Public rendering must remain usable when analytics is unavailable.
    });
  }, [eventName, productId, storeSlug]);

  return null;
}
