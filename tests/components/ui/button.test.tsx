import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeTruthy();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies primary variant by default", () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-blue-600");
  });

  it("applies secondary variant", () => {
    render(<Button variant="secondary">Test</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-slate-100");
  });

  it("applies outline variant", () => {
    render(<Button variant="outline">Test</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("border");
  });

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Test</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("hover:bg-slate-100");
  });

  it("applies danger variant", () => {
    render(<Button variant="danger">Test</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-red-600");
  });

  it("applies success variant", () => {
    render(<Button variant="success">Test</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-emerald-600");
  });

  it("applies small size", () => {
    render(<Button size="sm">Test</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("px-3");
  });

  it("applies medium size", () => {
    render(<Button size="md">Test</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("px-4");
  });

  it("applies large size", () => {
    render(<Button size="lg">Test</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("px-6");
  });

  it("applies icon size", () => {
    render(<Button size="icon">X</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("p-2");
  });

  it("disables button when disabled prop", () => {
    render(<Button disabled>Test</Button>);
    const button = screen.getByRole("button");
    expect(button.disabled).toBe(true);
  });

  it("disables button when loading", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button.disabled).toBe(true);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Test</Button>);
    fireEvent.click(screen.getByText("Test"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows spinner when loading", () => {
    render(<Button loading>Loading</Button>);
    const spinner = screen.getByRole("button").querySelector("svg");
    expect(spinner).toBeTruthy();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Test</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("custom-class");
  });

  it("passes through HTML button attributes", () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
    const button = screen.getByTestId("submit-btn");
    expect(button.getAttribute("type")).toBe("submit");
  });
});
