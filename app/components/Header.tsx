"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { useUserContextData } from "../context/userData";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user } = useUserContextData();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isOpen]);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -96;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const links = [
    { name: "Services", href: "services" },
    { name: "Features", href: "features" },
    { name: "Testimonial", href: "testimonials" },
    { name: "Pricing", href: "pricing" },
    {
      name: "Academy",
      href: "https://www.instagram.com/digitalbusinessschool_/",
      external: true,
    },
    { name: "Faq", href: "faq" },
    { name: "Contact", href: "contact" },
  ];

  return (
    <header
      className={`fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 transition-all duration-300 ${
        hasScrolled ? "border-b border-gray-200 shadow-sm" : "border-none"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Zidwell Logo" width={32} height={32} className="w-20 object-contain" />
            <h1 className="font-bold text-lg">Zidwell</h1>
          </Link>

          <nav className="hidden lg:flex ml-10 space-x-8">
            {links.map((link) =>
              link.external ? (
                <Link
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 cursor-pointer hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.name}
                  onClick={() => scrollToId(link.href)}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {link.name}
                </button>
              )
            )}
          </nav>

          {user ? (
            <Button className="bg-[#C29307] text-white hover:bg-[#a87e06] lg:block hidden" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          ) : (
            <div className="hidden lg:flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/auth/login")}>Sign In</Button>
              <Button className="bg-[#C29307] text-white hover:bg-[#a87e06]" onClick={() => router.push("/auth/signup")}>
                Register
              </Button>
            </div>
          )}

          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 z-50"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden mt-2">
            <div className="fixed h-screen z-[-1] inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t z-50 rounded-md shadow-lg">
              {links.map((link) =>
                link.external ? (
                  <Link
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-gray-600 cursor-pointer hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <button
                    key={link.name}
                    onClick={() => scrollToId(link.href)}
                    className="w-full text-left text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    {link.name}
                  </button>
                )
              )}

              <div className="pt-4 pb-3 border-t border-gray-200">
                {user ? (
                  <Button className="bg-[#C29307] text-white hover:bg-[#a87e06] w-full" onClick={() => router.push("/dashboard")}>
                    Dashboard
                  </Button>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Button onClick={() => router.push("/auth/login")} variant="outline">Sign In</Button>
                    <Button className="bg-[#C29307] text-white hover:bg-[#a87e06]" onClick={() => router.push("/auth/signup")}>
                      Register
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
