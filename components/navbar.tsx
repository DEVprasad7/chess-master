"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const isGamePage = pathname === '/game' || pathname === '/ai-game';

  return (
    <nav className="border-b py-4 border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side (logo/title) */}
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-shrink-0">
              ♔ ChessMaster
            </h1>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Home
              </Link>
              {!isGamePage && (
                <Link href="/models" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Models
                </Link>
              )}
            </nav>
          </div>

          {/* Right side (theme toggle + auth buttons) */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* If user is signed in, show UserButton */}
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            {/* If user is signed out, show Sign In / Sign Up buttons */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}
