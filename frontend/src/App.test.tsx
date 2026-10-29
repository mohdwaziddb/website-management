import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { cleanDomain } from "./platform/TenantsPage";

// jsdom host = localhost => platform (hamara product)
describe("App routing on root domain", () => {
  afterEach(() => window.history.pushState({}, "", "/"));

  it("/ => marketing site", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByText("47 templates for 15 kinds of websites")).toBeInTheDocument();
    expect(screen.getAllByText("Admin login").length).toBeGreaterThan(0);
  });

  it("/admin => super admin login", () => {
    window.history.pushState({}, "", "/admin");
    render(<App />);
    expect(screen.getByText("Super admin sign in")).toBeInTheDocument();
  });
});

describe("cleanDomain", () => {
  it("URL / www / slash hata deta hai", () => {
    expect(cleanDomain(" https://www.Xyz.com/home ")).toBe("xyz.com");
    expect(cleanDomain("school.co.in")).toBe("school.co.in");
  });
});
