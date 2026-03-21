"use client";
import Link from "next/link";
import Logo from "./Logo";

export default function Nav() {
  return (
    <nav className="h-14 bg-surface border-b border-border flex items-center px-6 gap-6 sticky top-0 z-50">
      <Link href="/">
        <Logo size="sm" />
      </Link>
      <div className="flex-1" />
      <span className="text-xs text-txt-4 font-mono">v1.0.6</span>
      <span className="text-xs text-txt-4">🔒 Runs in your browser</span>
      <a
        href="/api/logout"
        className="text-xs text-txt-4 hover:text-txt transition-colors"
        title="Lock and return to access page"
      >
        Lock
      </a>
    </nav>
  );
}
