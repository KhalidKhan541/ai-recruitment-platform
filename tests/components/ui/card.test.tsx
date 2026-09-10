import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeTruthy();
  });

  it("applies default styles", () => {
    render(<Card>Test</Card>);
    const card = screen.getByText("Test").parentElement;
    expect(card?.className).toContain("rounded-xl");
    expect(card?.className).toContain("border");
    expect(card?.className).toContain("bg-white");
  });

  it("applies hover styles when hover=true", () => {
    render(<Card hover>Test</Card>);
    const card = screen.getByText("Test").parentElement;
    expect(card?.className).toContain("hover:shadow-md");
    expect(card?.className).toContain("cursor-pointer");
  });

  it("applies custom className", () => {
    render(<Card className="custom-card">Test</Card>);
    const card = screen.getByText("Test").parentElement;
    expect(card?.className).toContain("custom-card");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    fireEvent.click(screen.getByText("Clickable"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("adds cursor-pointer when onClick provided", () => {
    render(<Card onClick={() => {}}>Test</Card>);
    const card = screen.getByText("Test").parentElement;
    expect(card?.className).toContain("cursor-pointer");
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<Card><CardHeader>Header</CardHeader></Card>);
    expect(screen.getByText("Header")).toBeTruthy();
  });

  it("applies border bottom", () => {
    render(<Card><CardHeader>Header</CardHeader></Card>);
    const header = screen.getByText("Header").parentElement;
    expect(header?.className).toContain("border-b");
  });

  it("applies custom className", () => {
    render(<Card><CardHeader className="custom">Header</CardHeader></Card>);
    const header = screen.getByText("Header").parentElement;
    expect(header?.className).toContain("custom");
  });
});

describe("CardBody", () => {
  it("renders children", () => {
    render(<Card><CardBody>Body content</CardBody></Card>);
    expect(screen.getByText("Body content")).toBeTruthy();
  });

  it("applies padding", () => {
    render(<Card><CardBody>Body</CardBody></Card>);
    const body = screen.getByText("Body").parentElement;
    expect(body?.className).toContain("px-6");
    expect(body?.className).toContain("py-4");
  });

  it("applies custom className", () => {
    render(<Card><CardBody className="custom-body">Body</CardBody></Card>);
    const body = screen.getByText("Body").parentElement;
    expect(body?.className).toContain("custom-body");
  });
});

describe("CardFooter", () => {
  it("renders children", () => {
    render(<Card><CardFooter>Footer</CardFooter></Card>);
    expect(screen.getByText("Footer")).toBeTruthy();
  });

  it("applies border top", () => {
    render(<Card><CardFooter>Footer</CardFooter></Card>);
    const footer = screen.getByText("Footer").parentElement;
    expect(footer?.className).toContain("border-t");
  });

  it("applies custom className", () => {
    render(<Card><CardFooter className="custom-footer">Footer</CardFooter></Card>);
    const footer = screen.getByText("Footer").parentElement;
    expect(footer?.className).toContain("custom-footer");
  });
});

describe("Card composition", () => {
  it("renders full card with all subcomponents", () => {
    render(
      <Card>
        <CardHeader>Title</CardHeader>
        <CardBody>Content</CardBody>
        <CardFooter>Actions</CardFooter>
      </Card>
    );
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
  });
});
