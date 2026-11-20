import * as React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white text-slate-800 border-t border-slate-200/90 pt-8 pb-10">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-slate-200 text-xs">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                GD
              </div>
              <span className="text-xl font-black tracking-tight text-slate-950">
                GROUP<span className="text-blue-600">DRIVE</span>
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              Discover. Compare. Group. Negotiate. Drive.
            </p>
            <p className="text-slate-600 leading-relaxed max-w-sm">
              The AI-powered automotive marketplace connecting retail car buyers with authorized regional dealerships for transparent pricing and collective purchasing leverage.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
              >
                <span>DealerOS Partner Portal</span>
                <span>→</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                <span>Customer Helpdesk</span>
              </Link>
            </div>
          </div>

          {/* Automotive Catalogue */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Explore Vehicles
            </h4>
            <ul className="space-y-2 text-slate-600 font-medium">
              <li><Link href="/cars" className="hover:text-blue-600 transition-colors">Browse All Vehicles</Link></li>
              <li><Link href="/compare" className="hover:text-blue-600 transition-colors">Compare Vehicles</Link></li>
              <li><Link href="/cars?brand=Maruti+Suzuki" className="hover:text-blue-600 transition-colors">Maruti Suzuki</Link></li>
              <li><Link href="/cars?brand=Hyundai" className="hover:text-blue-600 transition-colors">Hyundai</Link></li>
              <li><Link href="/cars?brand=Tata+Motors" className="hover:text-blue-600 transition-colors">Tata Motors</Link></li>
              <li><Link href="/cars?brand=Mahindra" className="hover:text-blue-600 transition-colors">Mahindra</Link></li>
              <li><Link href="/cars?brand=Toyota" className="hover:text-blue-600 transition-colors">Toyota</Link></li>
            </ul>
          </div>

          {/* Buyer Groups */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Group Buying
            </h4>
            <ul className="space-y-2 text-slate-600 font-medium">
              <li><Link href="/groups" className="hover:text-blue-600 transition-colors">All Active Groups</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link></li>
              <li><Link href="/groups?city=Bengaluru" className="hover:text-blue-600 transition-colors">Bengaluru Groups</Link></li>
              <li><Link href="/groups?city=Mumbai" className="hover:text-blue-600 transition-colors">Mumbai Groups</Link></li>
              <li><Link href="/groups?city=Delhi+NCR" className="hover:text-blue-600 transition-colors">Delhi NCR Groups</Link></li>
              <li><Link href="/my-groups" className="hover:text-blue-600 transition-colors">My Group Membership</Link></li>
            </ul>
          </div>

          {/* Dealerships & Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Dealers & Support
            </h4>
            <ul className="space-y-2 text-slate-600 font-medium">
              <li><Link href="/dealers" className="hover:text-blue-600 transition-colors">Authorized Dealers</Link></li>
              <li><Link href="/campaigns" className="hover:text-blue-600 transition-colors">Special Campaigns</Link></li>
              <li><Link href="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact & Support</Link></li>
              <li><Link href="/login" className="hover:text-blue-600 transition-colors">Customer Log In</Link></li>
              <li><Link href="/register" className="hover:text-blue-600 transition-colors">Customer Sign Up</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© 2026 GROUPDRIVE Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Direct OEM Authorized Delivery</span>
            <span>•</span>
            <span>Zero Brokerage Policy</span>
            <span>•</span>
            <span>Made for Indian Automotive Buyers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
