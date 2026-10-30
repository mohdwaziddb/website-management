import { createElement } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FieldInput, { URL_PATTERN } from "./FieldInput";
import type { FieldDef } from "../lib/types";

const def = (type: FieldDef["type"], min: number | null): FieldDef => ({ name: "price", label: "Price (₹)", type, required: false, listed: true, searchable: false, unique: false, ref: null, options: [], help: null, min });

describe("NUMBER / DECIMAL input", () => {
  it("DECIMAL = step 0.01 + min", () => {
    const { container } = render(createElement(FieldInput, { field: def("DECIMAL", 0), value: "1299.50", onChange: () => {} }));
    const input = container.querySelector("input")!;
    expect(input.type).toBe("number");
    expect(input.step).toBe("0.01");
    expect(input.min).toBe("0");
    expect(input.value).toBe("1299.50");
  });
  it("NUMBER: min na ho to attribute nahi", () => {
    const { container } = render(createElement(FieldInput, { field: def("NUMBER", null), value: 3, onChange: () => {} }));
    const input = container.querySelector("input")!;
    expect(input.hasAttribute("min")).toBe(false);
    expect(input.hasAttribute("step")).toBe(false);
  });
});

// Browser <input pattern> ko aise hi check karta hai: ^(?:pattern)$ with "v" flag
const valid = (v: string) => new RegExp(`^(?:${URL_PATTERN})$`, "v").test(v);

describe("URL field pattern (backend isValidUrl jaisa)", () => {
  it("full URL aur site ke relative links", () => {
    expect(valid("https://youtube.com/watch?v=1")).toBe(true);
    expect(valid("http://x.com")).toBe(true);
    expect(valid("/contact")).toBe(true);
    expect(valid("/page/about-us")).toBe(true);
  });

  it("galat links", () => {
    expect(valid("//evil.com")).toBe(false);
    expect(valid("javascript:alert(1)")).toBe(false);
    expect(valid("contact")).toBe(false);
    expect(valid("https://a b.com")).toBe(false);
  });
});
