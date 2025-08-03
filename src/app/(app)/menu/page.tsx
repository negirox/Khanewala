
"use client";

import { MenuEditor } from "@/components/menu-editor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Printer, QrCode } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import QRCode from "react-qr-code";

export default function MenuPage() {
  const [isQrCodeOpen, setQrCodeOpen] = React.useState(false);
  const [menuUrl, setMenuUrl] = React.useState("");

  React.useEffect(() => {
    // Ensure this runs only on the client
    setMenuUrl(`${window.location.origin}/menu/print`);
  }, []);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
           <h1 className="text-2xl font-bold font-headline">Menu Editor</h1>
           <div className="flex items-center gap-2">
             <Button onClick={() => setQrCodeOpen(true)} variant="outline">
                <QrCode className="mr-2 h-4 w-4" />
                Show QR Code
             </Button>
             <Button asChild variant="outline">
                <Link href="/menu/print">
                  <Printer className="mr-2 h-4 w-4" />
                  Printable Menu
                </Link>
             </Button>
           </div>
        </div>
        <MenuEditor />
      </div>

      <Dialog open={isQrCodeOpen} onOpenChange={setQrCodeOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Scan to View Menu</DialogTitle>
                  <DialogDescription>
                      Customers can scan this QR code with their phone to view the menu.
                  </DialogDescription>
              </DialogHeader>
              <div className="p-4 bg-white rounded-lg flex items-center justify-center">
                  {menuUrl && <QRCode value={menuUrl} size={256} />}
              </div>
          </DialogContent>
      </Dialog>
    </>
  );
}
