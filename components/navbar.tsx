import { ThemeToggle } from "./theme-toggle"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <nav className="border-b py-4 border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side (logo/title) */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                ♔ ChessMaster
              </h1>
            </div>
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
                  Sign Up
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  )
}
