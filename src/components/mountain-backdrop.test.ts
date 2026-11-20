import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CLIMBER_FOOT, ICE_FACE, MountainBackdrop } from "./mountain-backdrop";

type Point = readonly [number, number];

/** Lutningen i grader för en linje som stiger åt höger (y växer nedåt i SVG). */
const angle = ([x0, y0]: Point, [x1, y1]: Point) => (Math.atan2(y0 - y1, x1 - x0) * 180) / Math.PI;
/** Linjens x vid höjden y. */
const xAt = ([x0, y0]: Point, [x1, y1]: Point, y: number) => x0 + ((y - y0) * (x1 - x0)) / (y1 - y0);

/** Eggen som klättraren går uppför i loggan: bergets två första hörn, och var den bakre foten står. */
function logoClimb(svg: string): { ridge: [Point, Point]; foot: Point } {
  const ridge = svg.match(/<path d="M(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)L(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)L37/);
  const foot = svg.match(/<g transform="translate\((\d+(?:\.\d+)?) (\d+(?:\.\d+)?)\) scale/);
  if (!ridge || !foot) throw new Error("hittar inte eggen eller klättraren i loggfilen");
  const n = ridge.slice(1).map(Number);
  return { ridge: [[n[0], n[1]], [n[2], n[3]]], foot: [Number(foot[1]), Number(foot[2])] };
}

describe("bakgrunden med klättraren", () => {
  const [bottom, top] = ICE_FACE;

  it("klättrarens bakre fot står på isbranten", () => {
    expect(Math.abs(xAt(bottom, top, CLIMBER_FOOT[1]) - CLIMBER_FOOT[0])).toBeLessThan(1);
  });

  it("klättrar lika brant som i loggan, där foten också står på eggen", () => {
    const logo = readFileSync(new URL("../../docs/logga/hp-lift-symbol.svg", import.meta.url), "utf8");
    const { ridge, foot } = logoClimb(logo);
    expect(Math.abs(angle(bottom, top) - angle(...ridge))).toBeLessThan(1);
    expect(Math.abs(xAt(...ridge, foot[1]) - foot[0])).toBeLessThan(0.2);
  });

  it("är dekorativ och tar inte emot klick", () => {
    const html = renderToStaticMarkup(createElement(MountainBackdrop));
    expect(html).toMatch(/^<div aria-hidden="true" class="mountain-scene pointer-events-none fixed /);
  });
});
