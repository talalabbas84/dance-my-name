"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import type { DanceStyle } from "@/types/rhythm";
import { buildShareText, buildShareUrl } from "@/lib/rhythm/share";

interface ShareButtonProps {
  name: string;
  style: DanceStyle;
}

export function ShareButton({ name, style }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = buildShareUrl(name, style);
    const text = buildShareText(name, style);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Dance My Name", text, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard unavailable — nothing more we can do silently
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold transition hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      {copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
      {copied ? "Copied to clipboard!" : "Share This Rhythm"}
    </button>
  );
}
