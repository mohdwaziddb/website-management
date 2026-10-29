import { AxiosError, AxiosHeaders, AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { errorMessage, fileUrl, unwrap } from "./api";

const res = (data: unknown) => ({ data, status: 200, statusText: "OK", headers: {}, config: { headers: new AxiosHeaders() } }) as AxiosResponse;

describe("unwrap (GeneralResponse)", () => {
  it("{success, message, data} se data nikalta hai", () => {
    expect(unwrap(res({ success: true, message: "Successfully", data: { a: 1 } })).data).toEqual({ a: 1 });
    expect(unwrap(res({ success: true, message: "Deleted", data: null })).data).toBeNull();
  });

  it("baaki responses ko nahi chhedta", () => {
    expect(unwrap(res([1, 2])).data).toEqual([1, 2]);
    expect(unwrap(res({ success: "yes", data: 1 })).data).toEqual({ success: "yes", data: 1 });
    expect(unwrap(res("text")).data).toBe("text");
  });
});

describe("errorMessage", () => {
  it("backend ka message dikhata hai", () => {
    const e = new AxiosError("x", "ERR", undefined, undefined, {
      ...res({ success: false, message: "Title is required", data: null }),
      status: 400
    });
    expect(errorMessage(e)).toBe("Title is required");
  });

  it("network error / unknown", () => {
    expect(errorMessage(new AxiosError("Network Error"))).toBe("Server not reachable");
    expect(errorMessage(new Error("boom"))).toBe("Something went wrong");
  });
});

describe("fileUrl", () => {
  it("/files paths aur external links", () => {
    expect(fileUrl("/files/a/b.png")).toBe("/files/a/b.png");
    expect(fileUrl("https://x.com/a.png")).toBe("https://x.com/a.png");
    expect(fileUrl(null)).toBe("");
    expect(fileUrl(5)).toBe("");
  });
});
