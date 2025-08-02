

"use client";

import * as React from 'react';
import type { Order } from '@/lib/types';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { appConfig } from '@/lib/config';

export function BillView({ order }: { order: Order }) {
  const [tokenNumber, setTokenNumber] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Generate a random 3-digit token number when the component mounts
    setTokenNumber(Math.floor(100 + Math.random() * 900));
  }, [order.id]);


  const handlePrint = () => {
    // Temporarily hide the print button for printing
    const printButton = document.getElementById('print-bill-button');
    if (printButton) printButton.style.display = 'none';
    
    window.print();

    // Restore the print button after printing
    if (printButton) printButton.style.display = 'block';
  };

  return (
    <div>
        <div id="bill-content" className="p-4 bg-white text-black font-mono text-sm">
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{appConfig.title}</h2>
                {appConfig.gstNumber && <p className="text-xs">GSTIN: {appConfig.gstNumber}</p>}
                <p className="text-xs">123 Spice Street, Flavor Town</p>
                <p className="text-xs">Tel: (123) 456-7890</p>
            </div>
            {tokenNumber && (
                <div className="text-center my-4">
                    <p className="text-lg">TOKEN NO.</p>
                    <p className="text-5xl font-bold">{tokenNumber}</p>
                </div>
            )}
            <Separator className="my-2 border-dashed border-black" />
            <div className="flex justify-between mb-1 text-xs">
                <span>Bill No: {order.id}</span>
                <span>Table: {order.tableNumber}</span>
            </div>
            <div className="flex justify-between mb-2 text-xs">
                <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                <span>Time: {new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
            <Separator className="my-2 border-dashed border-black" />
            <table className="w-full text-xs">
                <thead>
                    <tr>
                        <th className="text-left">QTY</th>
                        <th className="text-left">ITEM</th>
                        <th className="text-right">PRICE</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, index) => (
                        <tr key={index}>
                            <td className="align-top">{item.quantity}</td>
                            <td className="align-top">{item.menuItem.name}</td>
                            <td className="text-right align-top">{appConfig.currency}{(item.menuItem.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Separator className="my-2 border-dashed border-black" />
            <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-right">{appConfig.currency}{order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                     <div className="flex justify-between">
                        <span>Discount ({order.discount}%):</span>
                        <span className="text-right">-{appConfig.currency}{(order.subtotal - order.total).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-base mt-2">
                    <span>Total:</span>
                    <span className="text-right">{appConfig.currency}{order.total.toFixed(2)}</span>
                </div>
            </div>
            <Separator className="my-2 border-dashed border-black" />
            <div className="text-center mt-4 text-xs">
                <p>Thank you for dining with us!</p>
            </div>
        </div>

        <Button id="print-bill-button" onClick={handlePrint} className="w-full mt-4">
            Print Bill
        </Button>
    </div>
  );
}
