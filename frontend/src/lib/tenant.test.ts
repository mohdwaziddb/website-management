import { describe, expect, it } from "vitest";
import { isAdminPath, isPlatformHost, tenantUrl } from "./tenant";

describe("isPlatformHost (backend TenantResolver jaisa)", () => {
  it("root, www, reserved, IP aur bare hosts platform hain", () => {
    expect(isPlatformHost("abc.com", "abc.com")).toBe(true);
    expect(isPlatformHost("www.abc.com", "abc.com")).toBe(true);
    expect(isPlatformHost("admin.abc.com", "abc.com")).toBe(true);
    expect(isPlatformHost("ABC.com.", "abc.com")).toBe(true);
    expect(isPlatformHost("localhost", "localhost")).toBe(true);
    expect(isPlatformHost("127.0.0.1", "abc.com")).toBe(true);
    expect(isPlatformHost("localhost", "abc.com")).toBe(true);
  });

  it("subdomain aur custom domain client websites hain", () => {
    expect(isPlatformHost("dbwebsite.abc.com", "abc.com")).toBe(false);
    expect(isPlatformHost("www.dbwebsite.abc.com", "abc.com")).toBe(false);
    expect(isPlatformHost("demo.localhost", "localhost")).toBe(false);
    expect(isPlatformHost("www.xyz.com", "abc.com")).toBe(false);
    expect(isPlatformHost("xyz.test", "localhost")).toBe(false);
  });
});

describe("isAdminPath", () => {
  it("sirf /admin aur /admin/... admin hain", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/m/sliders")).toBe(true);
    expect(isAdminPath("/")).toBe(false);
    expect(isAdminPath("/administrator")).toBe(false);
    expect(isAdminPath("/page/admin")).toBe(false);
  });
});

describe("tenantUrl", () => {
  it("subdomain pehle, warna custom domain", () => {
    const port = window.location.port ? ":" + window.location.port : "";
    expect(tenantUrl({ subdomain: "abc", customDomain: "xyz.com" })).toBe(`http://abc.localhost${port}/`);
    expect(tenantUrl({ subdomain: null, customDomain: "xyz.com" }, "/admin")).toBe(`http://xyz.com${port}/admin`);
  });
});
