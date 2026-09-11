import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  id?: string;
}

function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  label,
  required = false,
  id,
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 border rounded-md ${
          error ? "border-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-100" : ""}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

describe("Input Component", () => {
  it("renders input with placeholder", () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText("Enter email")).toBeTruthy();
  });

  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeTruthy();
  });

  it("links label to input via htmlFor", () => {
    render(<Input label="Email" />);
    const label = screen.getByText("Email");
    const input = screen.getByRole("textbox");
    expect(label.getAttribute("for")).toBe(input.id);
  });

  it("shows required indicator", () => {
    render(<Input label="Email" required />);
    expect(screen.getByText("*")).toBeTruthy();
  });

  it("calls onChange when value changes", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "test@example.com" },
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("displays error message", () => {
    render(<Input error="Invalid email" />);
    expect(screen.getByText("Invalid email")).toBeTruthy();
  });

  it("applies error styling when error is present", () => {
    render(<Input error="Error" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-500");
  });

  it("disables input when disabled prop is true", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input.disabled).toBe(true);
  });

  it("applies disabled styling", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("bg-gray-100");
  });

  it("renders different input types", () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole("textbox").getAttribute("type")).toBe("email");

    rerender(<Input type="password" />);
    expect(screen.getByDisplayValue("").getAttribute("type")).toBe("password");

    rerender(<Input type="number" />);
    expect(screen.getByRole("spinbutton")).toBeTruthy();
  });

  it("renders with custom id", () => {
    render(<Input id="custom-id" label="Test" />);
    const input = screen.getByRole("textbox");
    expect(input.id).toBe("custom-id");
  });

  it("generates id from label when not provided", () => {
    render(<Input label="Full Name" />);
    const input = screen.getByRole("textbox");
    expect(input.id).toBe("full-name");
  });
});

describe("Input with value", () => {
  it("displays controlled value", () => {
    render(<Input value="hello" onChange={() => {}} />);
    expect(screen.getByDisplayValue("hello")).toBeTruthy();
  });

  it("handles empty value", () => {
    render(<Input value="" onChange={() => {}} />);
    expect(screen.getByDisplayValue("")).toBeTruthy();
  });
});
