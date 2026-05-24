import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function LandingFooter() {
  return (
    <footer className="relative border-t border-border bg-bg-deep/60 py-12 backdrop-blur">
      <div className="container-tight">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo className="text-base" />
            <p className="mt-4 max-w-sm text-sm text-ink-muted">
              AI-powered intelligence for the next-generation electricity grid. Real-time telemetry, anomaly detection
              and remote relay control — built for cities that take energy seriously.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <Group title="Platform">
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#engine">Detection Engine</FooterLink>
              <FooterLink href="#grid">Smart Grid</FooterLink>
              <FooterLink href="#analytics">Live Analytics</FooterLink>
            </Group>
            <Group title="Company">
              <FooterLink href="#partners">Partners</FooterLink>
              <FooterLink href="/login">Sign in</FooterLink>
              <FooterLink href="/signup">Create account</FooterLink>
            </Group>
            <Group title="Resources">
              <FooterLink href="#">Docs</FooterLink>
              <FooterLink href="#">Integration guide</FooterLink>
              <FooterLink href="#">Changelog</FooterLink>
              <FooterLink href="#">Status</FooterLink>
            </Group>
          </div>
        </div>
        <div className="divider-line my-10" />
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-ink-dim">
          <div>© {new Date().getFullYear()} AI Powered Smart Electric Meter. All rights reserved.</div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-success shadow-glow-lime" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-dim">
        {title}
      </div>
      <ul className="mt-4 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-ink-muted transition-colors hover:text-ink">
        {children}
      </Link>
    </li>
  );
}
