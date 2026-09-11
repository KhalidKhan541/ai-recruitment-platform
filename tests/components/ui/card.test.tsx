import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered";
  padding?: "none" | "sm" | "md" | "lg";
}

function Card({ children, className = "", variant = "default", padding = "md" }: CardProps) {
  const variantClasses = {
    default: "bg-white border border-gray-200",
    elevated: "bg-white shadow-lg",
    bordered: "bg-white border-2 border-gray-300",
  };

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  return (
    <div className={`rounded-lg ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-gray-200 pb-3 mb-3">{children}</div>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-gray-900">{children}</h3>;
}

function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 mt-1">{children}</p>;
}

function CardContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-gray-200 pt-3 mt-3">{children}</div>;
}

describe("Card Component", () => {
  it("renders card with children", () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText("Card content")).toBeTruthy();
  });

  it("applies default variant classes", () => {
    render(
      <Card>
        <p>Content</p>
      </Card>
    );
    const card = screen.getByText("Content").closest("div");
    expect(card?.className).toContain("bg-white");
    expect(card?.className).toContain("border-gray-200");
  });

  it("applies elevated variant classes", () => {
    render(
      <Card variant="elevated">
        <p>Content</p>
      </Card>
    );
    const card = screen.getByText("Content").closest("div");
    expect(card?.className).toContain("shadow-lg");
  });

  it("applies bordered variant classes", () => {
    render(
      <Card variant="bordered">
        <p>Content</p>
      </Card>
    );
    const card = screen.getByText("Content").closest("div");
    expect(card?.className).toContain("border-2");
  });

  it("applies medium padding by default", () => {
    render(
      <Card>
        <p>Content</p>
      </Card>
    );
    const card = screen.getByText("Content").closest("div");
    expect(card?.className).toContain("p-5");
  });

  it("applies small padding", () => {
    render(
      <Card padding="sm">
        <p>Content</p>
      </Card>
    );
    const card = screen.getByText("Content").closest("div");
    expect(card?.className).toContain("p-3");
  });

  it("applies large padding", () => {
    render(
      <Card padding="lg">
        <p>Content</p>
      </Card>
    );
    const card = screen.getByText("Content").closest("div");
    expect(card?.className).toContain("p-8");
  });

  it("applies custom className", () => {
    render(
      <Card className="custom-class">
        <p>Content</p>
      </Card>
    );
    const card = screen.getByText("Content").closest("div");
    expect(card?.className).toContain("custom-class");
  });
});

describe("CardHeader Component", () => {
  it("renders header with children", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Header Title</CardTitle>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText("Header Title")).toBeTruthy();
  });

  it("applies border and padding classes", () => {
    render(
      <Card>
        <CardHeader>
          <p>Header</p>
        </CardHeader>
      </Card>
    );
    const header = screen.getByText("Header").closest("div");
    expect(header?.className).toContain("border-b");
    expect(header?.className).toContain("pb-3");
  });
});

describe("CardTitle Component", () => {
  it("renders title text", () => {
    render(
      <Card>
        <CardTitle>Job Details</CardTitle>
      </Card>
    );
    expect(screen.getByText("Job Details")).toBeTruthy();
  });

  it("applies correct styling", () => {
    render(
      <Card>
        <CardTitle>Test</CardTitle>
      </Card>
    );
    const title = screen.getByText("Test");
    expect(title.className).toContain("text-lg");
    expect(title.className).toContain("font-semibold");
  });
});

describe("CardDescription Component", () => {
  it("renders description text", () => {
    render(
      <Card>
        <CardDescription>This is a description</CardDescription>
      </Card>
    );
    expect(screen.getByText("This is a description")).toBeTruthy();
  });

  it("applies correct styling", () => {
    render(
      <Card>
        <CardDescription>Test</CardDescription>
      </Card>
    );
    const desc = screen.getByText("Test");
    expect(desc.className).toContain("text-sm");
    expect(desc.className).toContain("text-gray-500");
  });
});

describe("CardContent Component", () => {
  it("renders content", () => {
    render(
      <Card>
        <CardContent>
          <p>Main content area</p>
        </CardContent>
      </Card>
    );
    expect(screen.getByText("Main content area")).toBeTruthy();
  });
});

describe("CardFooter Component", () => {
  it("renders footer with children", () => {
    render(
      <Card>
        <CardFooter>
          <button>Save</button>
        </CardFooter>
      </Card>
    );
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("applies border top styling", () => {
    render(
      <Card>
        <CardFooter>
          <p>Footer</p>
        </CardFooter>
      </Card>
    );
    const footer = screen.getByText("Footer").closest("div");
    expect(footer?.className).toContain("border-t");
  });
});

describe("Card composition", () => {
  it("renders a complete card with all sections", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Job Posting</CardTitle>
          <CardDescription>Senior Software Engineer</CardDescription>
        </CardHeader>
        <CardContent>
          <p>We are looking for a senior engineer...</p>
        </CardContent>
        <CardFooter>
          <button>Apply Now</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText("Job Posting")).toBeTruthy();
    expect(screen.getByText("Senior Software Engineer")).toBeTruthy();
    expect(screen.getByText("We are looking for a senior engineer...")).toBeTruthy();
    expect(screen.getByText("Apply Now")).toBeTruthy();
  });
});
