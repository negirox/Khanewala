"use client";

import * as React from 'react';
import type { Order } from '@/lib/types';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { appConfig } from '@/lib/config';

export function BillView({ order }: { order: Order }) {

  const handlePrint = () => {
    const printContent = document.getElementById('bill-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printableContent = printContent.innerHTML;
      document.body.innerHTML = printableContent;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore original event listeners etc.
    }
  };

  return (
    <div>
        <div id="bill-content" className="p-4 bg-white text-black font-mono text-sm">
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{appConfig.title} Restaurant</h2>
                <p>123 Spice Street, Flavor Town</p>
                <p>Tel: (123) 456-7890</p>
            </div>
            <Separator className="my-2 border-dashed border-black" />
            <div className="flex justify-between mb-1">
                <span>Order: {order.id}</span>
                <span>Table: {order.tableNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
                <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                <span>Time: {new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
            <Separator className="my-2 border-dashed border-black" />
            <table className="w-full">
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
                            <td>{item.quantity}</td>
                            <td>{item.menuItem.name}</td>
                            <td className="text-right">${(item.menuItem.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Separator className="my-2 border-dashed border-black" />
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-right">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                     <div className="flex justify-between">
                        <span>Discount ({order.discount}%):</span>
                        <span className="text-right">-${(order.subtotal - order.total).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-right">${order.total.toFixed(2)}</span>
                </div>
            </div>
            <Separator className="my-2 border-dashed border-black" />
            <div className="text-center mt-4">
                <p>Thank you for dining with us!</p>
            </div>
        </div>

        <Button onClick={handlePrint} className="w-full mt-4 print-hide">
            Print Bill
        </Button>
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #bill-content, #bill-content * {
              visibility: visible;
            }
            #bill-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print-hide {
              display: none;
            }
          }
        `}</style>
    </div>
  );
}
