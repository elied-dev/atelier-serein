"use client";

import { useEffect } from "react";

type DynamicYieldContext = {
  type: "HOMEPAGE" | "PRODUCT" | "CATEGORY" | "CART";
  data?: string[];
};

type DynamicYieldWindow = Window & {
  DY?: { recommendationContext?: DynamicYieldContext };
};

export function DynamicYieldContextScript(context: DynamicYieldContext) {
  const contextJson = JSON.stringify(context).replace(/</g, "\\u003c");

  useEffect(() => {
    const target = window as DynamicYieldWindow;
    target.DY ||= {};
    target.DY.recommendationContext = JSON.parse(contextJson) as DynamicYieldContext;
  }, [contextJson]);

  return (
    <script
      type="text/javascript"
      dangerouslySetInnerHTML={{
        __html: `window.DY = window.DY || {};DY.recommendationContext = ${contextJson};`,
      }}
    />
  );
}
