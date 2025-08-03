
"use client";

import * as React from "react";
import Image from "next/image";
import { getMenuItems } from "@/app/actions";
import { appConfig } from "@/lib/config";
import type { MenuItem } from "@/lib/types";
import { Button } from "./ui/button";
import { Printer, UtensilsCrossed } from "lucide-react";
import { Separator } from "./ui/separator";

export function PrintableMenu() {
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  
  React.useEffect(() => {
    getMenuItems().then(setMenuItems);
  }, []);

  const menuByCategory = React.useMemo(() => {
    return menuItems.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems]);

  const handlePrint = React.useCallback(() => {
    // Temporarily hide the print button for printing
    const printButton = document.getElementById('print-menu-button');
    if (printButton) printButton.style.display = 'none';
    
    window.print();

    // Restore the print button after printing
    if (printButton) printButton.style.display = 'block';
  }, []);


  return (
    <div className="bg-background text-foreground font-body">
       <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <div id="printable-menu-content" className="p-2 print:p-0">
                {/* Header */}
                <header className="text-center mb-8 border-b-4 border-primary pb-4">
                    <div className="flex justify-center items-center gap-4 mb-2">
                        <UtensilsCrossed className="h-16 w-16 text-primary" />
                        <div>
                            <h1 className="text-5xl font-bold font-headline text-primary">{appConfig.title}</h1>
                            <p className="text-lg text-muted-foreground">Authentic Indian Cuisine</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">123 Spice Street, Flavor Town | Tel: (123) 456-7890</p>
                </header>
                
                {/* Menu Body */}
                <main className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                    {Object.entries(menuByCategory).map(([category, items]) => (
                        <section key={category} className="break-inside-avoid">
                            <h2 className="text-3xl font-headline font-bold text-primary mb-4 border-b-2 border-accent pb-2">{category}</h2>
                            <div className="space-y-6">
                                {items.map((item) => (
                                <div key={item.id} className="flex gap-4 items-start">
                                    {item.image && (
                                        <Image 
                                            data-ai-hint={item['data-ai-hint']}
                                            src={item.image} 
                                            alt={item.name} 
                                            width={80} 
                                            height={80} 
                                            className="rounded-lg object-cover shadow-md w-20 h-20" 
                                        />
                                    )}
                                    <div className="flex-1">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="text-lg font-bold font-headline">{item.name}</h3>
                                        <p className="text-lg font-semibold text-primary">{appConfig.currency}{item.price.toFixed(2)}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </main>

                 {/* Footer */}
                <footer className="mt-12 text-center">
                    <Separator className="mb-4 bg-primary"/>
                    <p className="text-sm text-muted-foreground">All prices are inclusive of applicable taxes. We levy a 10% service charge.</p>
                    {appConfig.gstNumber && <p className="text-xs text-muted-foreground mt-1">GSTIN: {appConfig.gstNumber}</p>}
                </footer>
            </div>

            <Button id="print-menu-button" onClick={handlePrint} className="w-full mt-8 print:hidden">
                <Printer className="mr-2"/>
                Print Menu
            </Button>
       </div>
       <style jsx global>{`
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .print\\:p-0 {
                    padding: 0;
                }
                .print\\:hidden {
                    display: none;
                }
                @page {
                    size: A4;
                    margin: 20mm;
                }
            }
            .break-inside-avoid {
                break-inside: avoid;
            }
       `}</style>
    </div>
  );
}
