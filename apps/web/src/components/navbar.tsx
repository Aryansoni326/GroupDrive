"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const CITIES = [
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedCity, setSelectedCity] = React.useState("Bengaluru");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const cityDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("gd_selected_city") : null;
    if (saved && CITIES.includes(saved)) {
      setSelectedCity(saved);
    }
  }, []);

  // Click outside and escape key listener for city dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCityDropdownOpen(false);
      }
    }
    if (isCityDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCityDropdownOpen]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setIsCityDropdownOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("gd_selected_city", city);
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/cars", label: "Explore Cars" },
    { href: "/dealers", label: "Dealers" },
    { href: "/about", label: "About Us" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-subtle">
      {/* Main Navbar */}
      <div className="container mx-auto flex h-20 sm:h-24 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Brand Logo (Uploaded GroupDrive Official Emblem) */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center group py-1">
            <img
              src="/images/logo.png"
              alt="GroupDrive - DRIVE • CONNECT • GO FURTHER"
              width={280}
              height={64}
              style={{ maxHeight: "64px", maxWidth: "280px", width: "auto", height: "auto" }}
              className="h-12 sm:h-14 md:h-16 w-auto object-contain hover:opacity-95 transition-opacity"
            />
          </Link>
        </div>

        {/* Center: Main Navigation Links (Clean Direct Links, No Dropdown) */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const isActive = link.href === "/cars"
              ? pathname.startsWith("/cars") || pathname === "/compare" || pathname === "/groups"
              : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm md:text-base font-bold transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Corner: Location Selector + Action Area */}
        <div className="flex items-center gap-3">
          {/* City Selector Pill positioned at top right */}
          <div className="relative" ref={cityDropdownRef}>
            <button
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-sm font-semibold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              aria-label="Select City"
              aria-expanded={isCityDropdownOpen}
              aria-haspopup="listbox"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{selectedCity}</span>
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isCityDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-elevated py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Metro Area
                </div>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCityChange(c)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                      selectedCity === c
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{c}</span>
                    {selectedCity === c && <span className="text-blue-600 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Single "Grab Your Deal" Button (or Dashboard when logged in) */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs font-bold">
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard?tab=settings" className="flex items-center gap-2 pl-1 hover:opacity-85 transition-opacity">
                <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                  {user.first_name?.[0] || "U"}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-[10px] text-slate-500">{user.city || "Customer"}</p>
                </div>
              </Link>
              <button
                onClick={logout}
                className="text-xs text-slate-400 hover:text-slate-700 p-1 focus:outline-none focus:ring-1 focus:ring-blue-600 rounded"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <Link href="/register">
              <Button
                variant="default"
                size="default"
                className="font-black text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-card flex items-center gap-2 transition-all"
              >
                <span>Grab Your Deal</span>
                <span className="text-xs font-bold">→</span>
              </Button>
            </Link>
          )}

          {/* Mobile menu hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-4 animate-in slide-in-from-top-4 duration-200 shadow-elevated">
          {/* City Selection in Mobile Menu */}
          <div className="pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Select Metro Territory
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCityChange(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    selectedCity === c
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                pathname === "/" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              Home
            </Link>

            {/* Explore Cars & Sub-Features */}
            <div className="space-y-1 pl-1">
              <Link
                href="/cars"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  pathname === "/cars" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-800 hover:bg-slate-50"
                }`}
              >
                Explore Cars
              </Link>
              <div className="pl-4 space-y-1 border-l-2 border-slate-100 ml-3">
                <Link
                  href="/compare"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600"
                >
                  ⚖️ Compare Cars (Side-by-Side)
                </Link>
                <Link
                  href="/groups"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600"
                >
                  👥 Group Buying Hub
                </Link>
              </div>
            </div>

            <Link
              href="/dealers"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                pathname === "/dealers" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              Dealers
            </Link>

            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                pathname === "/about" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              About Us
            </Link>

            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Contact & Support
            </Link>
            {isAuthenticated && (
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50"
              >
                Customer Dashboard & Profile
              </Link>
            )}
          </div>

          {/* Mobile Action Area */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {!isAuthenticated ? (
              <div className="space-y-2">
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full block">
                  <Button variant="default" size="default" className="w-full font-black text-sm bg-blue-600 hover:bg-blue-700 text-white py-2.5 shadow-sm">
                    Grab Your Deal →
                  </Button>
                </Link>
                <div className="text-center text-xs text-slate-500 pt-1">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Log In
                  </Link>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full"
              >
                Sign Out
              </Button>
            )}

            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100"
            >
              <span>Authorized Dealership Portal (DealerOS)</span>
              <span>→</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
