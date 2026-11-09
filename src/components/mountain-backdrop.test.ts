import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOGO_MOUNTAIN_POINTS, MountainBackdrop } from "./mountain-backdrop";

/** Hörnen i loggans bergsbana ("M-6 70V50l7-4 …V70z"), utan de två bottenhörnen. */
function logoMountainVertices(svg: string): Array<[number, number]> {
  const d = svg.match(/<path d="(M-6 70[^"]+)"/)?.[1];
  if (!d) throw new Error("hittar inte berget i loggfilen");
  const tokens = d.match(/[MVLlz]|-?\d+(?:\.\d+)?/g) ?? [];
  const points: Array<[number, number]> = [];
  let x = 0;
  let y = 0;
  let command = "";
  for (let i = 0; i < tokens.length; ) {
    if (/[MVLlz]/.test(tokens[i])) command = tokens[i++];
    if (command === "z") break;
    if (command === "V") {
      y = Number(tokens[i++]);
    } else if (command === "l") {
      x += Number(tokens[i++]);
      y += Number(tokens[i++]);
    } else {
      x = Number(tokens[i++]);
      y = Number(tokens[i++]);
    }
    points.push([x, y]);
  }
  // Första och sista punkten ligger under rutan (start och slut på bottenkanten).
  return points.slice(1, -1);
}

describe("bakgrunden med vandraren", () => {
  it("använder samma berg som loggan", () => {
    const logo = readFileSync(new URL("../../docs/logga/hp-lift-symbol.svg", import.meta.url), "utf8");
    expect(LOGO_MOUNTAIN_POINTS).toEqual(logoMountainVertices(logo));
  });

  it("är dekorativ och tar inte emot klick", () => {
    const html = renderToStaticMarkup(createElement(MountainBackdrop));
    expect(html).toMatch(/^<div aria-hidden="true" class="pointer-events-none fixed /);
  });
});
