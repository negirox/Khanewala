import { MenuEditor } from "@/components/menu-editor";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Link from "next/link";

export default function MenuPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold font-headline">Menu Editor</h1>
         <Button asChild variant="outline">
            <Link href="/menu/print">
              <Printer className="mr-2 h-4 w-4" />
              Printable Menu
            </Link>
         </Button>
      </div>
      <MenuEditor />
    </div>
  );
}
