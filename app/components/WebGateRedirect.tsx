"use client";

import { useEffect } from "react";
import { getWebGateConfig } from "@/lib/webgate";

export default function WebGateRedirect() {
  useEffect(() => {
    async function run() {
      const config = await getWebGateConfig();

      console.log("WebGate version:", config.version);

      if (config.active) {
        window.location.href = config.url;
      }
    }

    run();
  }, []);

  return null;
}
