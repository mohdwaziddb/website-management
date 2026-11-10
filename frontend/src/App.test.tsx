import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

// jsdom host = localhost => platform (hamara product)
describe("App routing on root domain", () => {
  afterEach(() => window.history.pushState({}, "", "/"));

  it("/ => marketing site", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByText("Pick your industry. See it live.")).toBeInTheDocument();
    expect(screen.queryByText("Admin login")).not.toBeInTheDocument();
  });

  it("/admin => root par admin nahi, marketing site par wapas", () => {
    window.history.pushState({}, "", "/admin");
    render(<App />);
    expect(window.location.pathname).toBe("/");
    expect(screen.getByText("Pick your industry. See it live.")).toBeInTheDocument();
  });
});
