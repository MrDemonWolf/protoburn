<<<<<<< Updated upstream
import { Flame } from "lucide-react";
import { ModeToggle } from "./mode-toggle";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">protoburn</span>
        </div>
        <ModeToggle />
      </div>
    </header>
=======
"use client";
import Link from "next/link";
import { Flame } from "lucide-react";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Flame className="h-5 w-5 text-primary" />
          protoburn
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
      <hr />
    </div>
>>>>>>> Stashed changes
  );
}
