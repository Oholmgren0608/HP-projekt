import { readFileSync } from "node:fs";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LogoMark } from "./logo-mark";

const render = (count: number) =>
  renderToStaticMarkup(
    createElement(Fragment, null, ...Array.from({ length: count }, (_, i) => createElement(LogoMark, { key: i }))),
  );

/** Formerna i märket: alla `d` och rektanglarnas mått, i ordning. */
function shapes(svg: string): string[] {
  const paths = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
  const rects = [...svg.matchAll(/<rect ([^>]*?)\/?>/g)].map((m) =>
    ["x", "y", "width", "height", "rx"].map((a) => m[1].match(new RegExp(`\\b${a}="([^"]+)"`))?.[1] ?? "0").join(" "),
  );
  return [...paths, ...rects];
}

describe("loggans märke", () => {
  it("två märken på samma sida får var sitt klipp-id och pekar på sitt eget", () => {
    const html = render(2);
    const ids = [...html.matchAll(/<clipPath id="([^"]+)"/g)].map((m) => m[1]);
    const refs = [...html.matchAll(/clip-path="url\(#([^)]+)\)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(refs).toEqual(ids);
  });

  it("är dekorativt, eftersom namnet står bredvid", () => {
    expect(render(1)).toMatch(/^<svg[^>]* aria-hidden="true"/);
  });

  it("har samma former som loggfilen i docs/logga/", () => {
    const file = readFileSync(new URL("../../docs/logga/hp-lift-symbol.svg", import.meta.url), "utf8");
    expect(shapes(render(1))).toEqual(shapes(file));
  });
});
