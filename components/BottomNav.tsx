"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Car, Truck, Heart, ClipboardList, User, Home, Settings, IndianRupee } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavLink {
  href: string;
  icon: LucideIcon;
  label: string;
}

const passengerLinks: NavLink[] = [
  { href: "/book",     icon: Car,           label: "Book" },
  { href: "/cargo",    icon: Truck,         label: "Cargo" },
  { href: "/wedding",  icon: Heart,         label: "Wedding" },
  { href: "/trip-log", icon: ClipboardList, label: "My Rides" },
  { href: "/profile",  icon: User,          label: "Profile" },
];

const driverLinks: NavLink[] = [
  { href: "/driver/dashboard", icon: Home,          label: "Dashboard" },
  { href: "/driver/pricing",   icon: Settings,      label: "Pricing" },
  { href: "/driver/earnings",  icon: IndianRupee,   label: "Earnings" },
  { href: "/profile",          icon: User,          label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isDriver = pathname.startsWith("/driver");
  const links = isDriver ? driverLinks : passengerLinks;

  if (!session) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 nav-safe">
      <div className="glass border-t border-white/60 mx-2 mb-2 rounded-3xl shadow-card-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 btn-press ${
                  active
                    ? "bg-brand-500 text-white shadow-glow-green scale-105"
                    : "text-gray-400 hover:text-brand-500 hover:bg-brand-100"
                }`}
              >
                <Icon size={20} strokeWidth={2} />
                <span className={`text-[10px] font-semibold leading-none ${active ? "text-white" : ""}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
