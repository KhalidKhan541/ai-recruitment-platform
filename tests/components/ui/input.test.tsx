import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("renders with placeholder", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeTruthy();
  });

  it("renders label", () => {
    render(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeTruthy();
  });

  it("associates label with input via htmlFor", () => {
    render(<Input label="Email" />);
    const label = screen.getByText("Email");
    const input = screen.getByRole("textbox");
    expect(label.getAttribute("for")).toBe(input.id);
  });

  it("generates id from label", () => {
    render(<Input label="First Name" />);
    const input = screen.getByRole("textbox");
    expect(input.id).toBe("first-name");
  });

  it("uses custom id", () => {
    render(<Input id="custom-id" label="Name" />);
    const input = screen.getByRole("textbox");
    expect(input.id).toBe("custom-id");
  });

  it("displays error message", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeTruthy();
  });

  it("applies error styles", () => {
    render(<Input error="Error" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-500");
  });

  it("displays hint when no error", () => {
    render(<Input hint="Enter your email" />);
    expect(screen.getByText("Enter your email")).toBeTruthy();
  });

  it("hides hint when error present", () => {
    render(<Input hint="Help text" error="Error text" />);
    expect(screen.queryByText("Help text")).toBeNull();
    expect(screen.getByText("Error text")).toBeTruthy();
  });

  it("calls onChange when value changes", () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "test" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("applies custom className", () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("custom-input");
  });

  it("passes through input attributes", () => {
    render(<Input type="password" maxLength={50} />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("type")).toBe("password");
    expect(input.getAttribute("maxlength")).toBe("50");
  });

  it("renders left addon", () => {
    render(<Input leftAddon={<span>@</span>} />);
    expect(screen.getByText("@")).toBeTruthy();
  });

  it("renders right addon", () => {
    render(<Input rightAddon={<span>.com</span>} />);
    expect(screen.getByText(".com")).toBeTruthy();
  });

  it("disables input", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input.disabled).toBe(true);
  });
});
