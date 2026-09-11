import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">TalentAI</span>
          </Link>
        </div>

        <div className="space-y-10">
          <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">
            The future of recruitment starts here
          </h1>
          <p className="text-lg text-blue-100">
            Join thousands of companies using AI to find and hire exceptional talent faster.
          </p>
          <div className="space-y-4">
            {[
              "AI-powered candidate matching with 95% accuracy",
              "Automated screening saves 10+ hours per hire",
              "Real-time analytics and insights dashboard",
              "Seamless team collaboration tools",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-100">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            {["bg-white/30", "bg-white/20", "bg-white/10"].map((bg, i) => (
              <div key={i} className={`h-8 w-8 rounded-full ${bg} border-2 border-white/20`} />
            ))}
          </div>
          <div className="text-sm text-blue-200">
            <span className="font-semibold text-white">2,500+</span> companies trust TalentAI
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground">TalentAI</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
