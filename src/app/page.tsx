"use client";

import Link from "next/link";
import { useState } from "react";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "AI-Powered Matching",
    description:
      "Our advanced AI analyzes candidate profiles and matches them to your requirements with unprecedented accuracy.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Automated Screening",
    description:
      "Let AI handle initial resume screening. Save hours of manual review while reducing bias in the hiring process.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    title: "Smart Analytics",
    description:
      "Gain deep insights into your recruitment pipeline with real-time analytics and performance metrics.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
    title: "Collaborative Hiring",
    description:
      "Streamline team collaboration with shared notes, interview feedback, and real-time status updates.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "Secure & Compliant",
    description:
      "Enterprise-grade security with GDPR compliance. Your candidate data is always protected.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
    title: "Customizable Workflows",
    description:
      "Adapt the platform to your unique hiring process with flexible pipeline configurations.",
  },
];

const stats = [
  { value: "10x", label: "Faster Screening" },
  { value: "95%", label: "Match Accuracy" },
  { value: "60%", label: "Less Time-to-Hire" },
  { value: "40%", label: "Cost Reduction" },
];

const testimonials = [
  {
    quote:
      "TalentAI has completely transformed our recruitment process. We've reduced our time-to-hire by 50% and found exceptional candidates we never would have found otherwise.",
    author: "Sarah Mitchell",
    role: "VP of People",
    company: "TechStart Inc.",
    avatar: "SM",
  },
  {
    quote:
      "The AI matching is incredibly accurate. It's like having a senior recruiter working 24/7. Our hiring managers love the quality of candidates presented.",
    author: "Michael Rodriguez",
    role: "Head of Talent Acquisition",
    company: "InnovateCorp",
    avatar: "MR",
  },
  {
    quote:
      "We were skeptical about AI in recruitment, but TalentAI proved us wrong. It's not about replacing humans—it's about giving us better tools to make better decisions.",
    author: "Jennifer Park",
    role: "Chief HR Officer",
    company: "GlobalTech",
    avatar: "JP",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$99",
    period: "per month",
    description: "Perfect for small teams getting started with AI recruitment.",
    features: [
      "Up to 10 active job postings",
      "AI-powered candidate matching",
      "Basic analytics dashboard",
      "Email support",
      "5 team members",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$249",
    period: "per month",
    description: "For growing teams that need advanced features and integrations.",
    features: [
      "Unlimited job postings",
      "Advanced AI screening & matching",
      "Custom assessment builder",
      "Priority support & onboarding",
      "25 team members",
      "API access",
      "Custom integrations",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored for you",
    description: "For large organizations with complex recruitment needs.",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom AI model training",
      "SSO & advanced security",
      "Unlimited team members",
      "SLA guarantee",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-sm dark:bg-gray-950/80">
        <div className="page-container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">TalentAI</span>
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-6">
            {["Features", "Pricing", "Testimonials"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link href="/login" className="btn-ghost">Log in</Link>
            <Link href="/register" className="btn-primary">Get Started</Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border bg-white px-4 py-4 dark:bg-gray-950 md:hidden">
            <nav className="flex flex-col gap-3">
              {["Features", "Pricing", "Testimonials"].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-muted-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <hr className="divider my-2" />
              <Link href="/login" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Log in
              </Link>
              <Link href="/register" className="btn-primary text-center" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 blur-3xl" />
            <div className="absolute -bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-secondary-500/20 to-accent-500/20 blur-3xl" />
          </div>

          <div className="page-container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
                </span>
                Now with GPT-4 Integration
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Hire Smarter with{" "}
                <span className="gradient-text">AI-Powered</span>{" "}
                Recruitment
              </h1>

              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
                Transform your hiring process with intelligent candidate matching,
                automated screening, and data-driven insights. Find the right talent
                faster than ever before.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/register" className="btn-primary btn-xl w-full sm:w-auto">
                  Start Free Trial
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link href="#demo" className="btn-secondary btn-xl w-full sm:w-auto">
                  Watch Demo
                </Link>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required. 14-day free trial.
              </p>
            </div>

            {/* Hero Visual */}
            <div className="relative mx-auto mt-16 max-w-4xl">
              <div className="rounded-xl border border-border bg-card p-2 shadow-2xl">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    <div className="ml-4 flex-1 rounded-md bg-background px-3 py-1.5 text-sm text-muted-foreground">
                      app.talentai.com/dashboard
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 rounded-lg border border-border bg-card p-4">
                      <div className="mb-3 h-8 w-8 rounded-lg bg-primary/10" />
                      <div className="mb-2 h-4 w-24 rounded bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                    <div className="col-span-2 rounded-lg border border-border bg-card p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="h-4 w-32 rounded bg-muted" />
                        <div className="h-6 w-20 rounded-full bg-primary/20" />
                      </div>
                      <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted" />
                            <div className="flex-1">
                              <div className="mb-1 h-3 w-32 rounded bg-muted" />
                              <div className="h-2 w-20 rounded bg-muted" />
                            </div>
                            <div className="h-6 w-16 rounded-full bg-emerald-100" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-border bg-muted/30 py-12">
          <div className="page-container">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold gradient-text sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-28">
          <div className="page-container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="section-title">Everything you need to hire smarter</h2>
              <p className="section-subtitle">
                Our AI-powered platform streamlines every step of your recruitment
                process, from sourcing to offer management.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="card group">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="border-y border-border bg-muted/30 py-20 sm:py-28">
          <div className="page-container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="section-title">Trusted by industry leaders</h2>
              <p className="section-subtitle">
                See how companies are transforming their hiring with TalentAI.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.author} className="card">
                  <div className="mb-4 flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 sm:py-28">
          <div className="page-container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="section-title">Simple, transparent pricing</h2>
              <p className="section-subtitle">
                Choose the plan that fits your team. All plans include a 14-day free trial.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`card relative ${
                    plan.popular
                      ? "border-primary shadow-lg ring-2 ring-primary/20"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="badge-primary px-3 py-1 text-xs">Most Popular</span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      {plan.price !== "Custom" && (
                        <span className="text-sm text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.price === "Custom" ? "/contact" : "/register"}
                    className={`w-full ${plan.popular ? "btn-primary" : "btn-outline"}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-28">
          <div className="page-container">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 px-8 py-16 text-center sm:px-16">
              <div className="absolute inset-0 -z-10">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary-500/30 blur-3xl" />
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to transform your hiring?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-blue-100">
                Join hundreds of companies already using TalentAI to find and hire
                exceptional talent faster.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-primary-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
                >
                  Start Free Trial
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
                >
                  Schedule Demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="page-container py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-foreground">TalentAI</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                AI-powered recruitment platform for modern teams.
              </p>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Product</h3>
              <ul className="space-y-2">
                {["Features", "Pricing", "Integrations", "API"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Company</h3>
              <ul className="space-y-2">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Legal</h3>
              <ul className="space-y-2">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TalentAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
