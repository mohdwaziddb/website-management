import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Avatar, EmptyState, pageNumbers, Pagination, StatCard, Switch, Tabs, Thumb } from "./ui";

describe("common ui", () => {
  it("pageNumbers: chhote me sab, bade me … ke saath", () => {
    expect(pageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageNumbers(1, 20)).toEqual([1, 2, "…", 20]);
    expect(pageNumbers(10, 20)).toEqual([1, "…", 9, 10, 11, "…", 20]);
    expect(pageNumbers(20, 20)).toEqual([1, "…", 19, 20]);
  });

  it("Pagination: range text + page click", () => {
    const onPage = vi.fn();
    render(<Pagination page={2} size={20} total={95} onPage={onPage} />);
    expect(screen.getByText("Showing 21–40 of 95 records")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPage.mock.calls).toEqual([[5], [3]]);
  });

  it("Switch toggles", () => {
    const onChange = vi.fn();
    render(<Switch label="Publish on website" checked={false} onChange={onChange} />);
    const sw = screen.getByRole("switch", { name: "Publish on website" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("Thumb: photo na khule to image icon", () => {
    render(<Thumb src="https://broken.example/x.jpg" alt="Cover" />);
    const img = screen.getByAltText("Cover");
    fireEvent.error(img);
    expect(screen.queryByAltText("Cover")).toBeNull();
    expect(screen.getByRole("img", { name: "Cover" }).tagName).toBe("SPAN");
  });

  it("Thumb: khaali src = placeholder", () => {
    render(<Thumb src={null} />);
    expect(screen.getByRole("img", { name: "No image" })).toBeInTheDocument();
  });

  it("Tabs, EmptyState, Avatar, StatCard", () => {
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <Tabs value="a" onChange={onChange} items={[{ value: "a", label: "All" }, { value: "b", label: "Draft", count: 3 }]} />
        <EmptyState title="No pages yet" text="Add one" action={<button>Add</button>} />
        <Avatar name="anita sharma" />
        <StatCard label="Orders today" value={4} to="/store/orders" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("tab", { name: /Draft/ }));
    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("No pages yet")).toBeInTheDocument();
    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(screen.getByText("Orders today").closest("a")).toHaveAttribute("href", "/store/orders");
  });
});
