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
  );
}
