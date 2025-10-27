// components/FloatingHelpButton.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Headset } from "lucide-react";

export default function FloatingHelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-4 w-64 space-y-2">
          <Link onClick={() => setIsOpen(false)} href="/support/create-ticket">
            <Button variant="outline" className="w-full justify-start">
              📝 Create Ticket
            </Button>
          </Link>
          <Link onClick={() => setIsOpen(false)} href="/support/tickets">
            <Button variant="outline" className="w-full justify-start">
              📋 My Tickets
            </Button>
          </Link>
          <Link onClick={() => setIsOpen(false)} href="/help">
            <Button variant="outline" className="w-full justify-start">
              ❓ Help Center
            </Button>
          </Link>
        </div>
      )}
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full  w-14 h-14 bg-[#C29307] shadow-lg cursor-pointer"
      >
         <Headset className="text-2xl " />
      </Button>
    </div>
  );
}