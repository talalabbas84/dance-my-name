import type { DanceStyle } from "@/types/rhythm";

const STYLE_COPY: Record<DanceStyle, string> = {
  salsa: "salsa 🔥",
  bachata: "bachata 🌹",
};

export function buildShareText(name: string, style: DanceStyle): string {
  return `Apparently, "${name}" sounds like ${STYLE_COPY[style]} What does your name sound like?`;
}

export function buildShareUrl(name: string, style: DanceStyle): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("name", name);
  url.searchParams.set("style", style);
  return url.toString();
}
