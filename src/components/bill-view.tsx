
"use client";

import * as React from 'react';
import type { Order, AppConfigData } from '@/lib/types';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import QRCode from "react-qr-code";
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area';

export function BillView({ order, appConfig }: { order: Order, appConfig: AppConfigData }) {
  const [tokenNumber, setTokenNumber] = React.useState<number | null>(null);
  const [paymentQrValue, setPaymentQrValue] = React.useState<string>("");

  React.useEffect(() => {
    // Generate a random 3-digit token number only on the client-side after mount
    // to prevent hydration errors.
    setTokenNumber(Math.floor(100 + Math.random() * 900));
    
    if(appConfig.upiId && appConfig.enableUpiQrOnBill) {
        // Construct UPI payment URL
        const upiUrl = `upi://pay?pa=${appConfig.upiId}&pn=${encodeURIComponent(appConfig.title)}&am=${order.total.toFixed(2)}&tn=Order_${order.id}&cu=INR`;
        setPaymentQrValue(upiUrl);
    }

  }, [order.id, order.total, appConfig]);


  const handlePrint = () => {
    const billContent = document.getElementById('bill-content-printable');
    if (!billContent) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow?.document.write('<html><head><title>Print Bill</title>');
    // Simple styling for print
    printWindow?.document.write(`
        <style>
            body { font-family: monospace; font-size: 10pt; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-xl { font-size: 1.25rem; }
            .text-5xl { font-size: 3rem; }
            .text-xs { font-size: 0.75rem; }
            .text-lg { font-size: 1.125rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .p-2 { padding: 0.5rem; }
            .inline-block { display: inline-block; }
            .bg-white { background-color: #fff; }
            .rounded-lg { border-radius: 0.5rem; }
            .border-dashed { border-style: dashed; border-bottom: 1px solid black; }
            .justify-between { justify-content: space-between; }
            .flex { display: flex; }
        </style>
    `);
    printWindow?.document.write('</head><body>');
    printWindow?.document.write(billContent.innerHTML);
    printWindow?.document.write('</body></html>');
    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
  };

  return (
    <div className="flex flex-col h-[80vh]">
        <ScrollArea className="flex-1">
            <div id="bill-content-printable" className="p-1 bg-white text-black font-mono text-sm">
                <div className="text-center mb-4">
                    {appConfig.logo && appConfig.logo !== '/logo.png' && (
                    <Image src={appConfig.logo} alt="Logo" width={64} height={64} className="mx-auto mb-2" />
                    )}
                    <h2 className="text-xl font-bold">{appConfig.title}</h2>
                    <p className="text-xs">{appConfig.address}</p>
                    <p className="text-xs">Tel: {appConfig.phone}</p>
                    {appConfig.gstNumber && <p className="text-xs">GSTIN: {appConfig.gstNumber}</p>}
                    {appConfig.fssaiLicense && <p className="text-xs">FSSAI Lic: {appConfig.fssaiLicense}</p>}
                </div>
                {tokenNumber && (
                    <div className="text-center my-4">
                        <p className="text-lg">TOKEN NO.</p>
                        <p className="text-5xl font-bold">{tokenNumber}</p>
                    </div>
                )}
                <div className="my-2 border-dashed" />
                <div className="flex justify-between mb-1 text-xs">
                    <span>Bill No: {order.id}</span>
                    {order.tableNumber && <span>Table: {order.tableNumber}</span>}
                </div>
                <div className="flex justify-between mb-2 text-xs">
                    <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                    <span>Time: {new Date(order.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="my-2 border-dashed" />
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
                <div className="my-2 border-dashed" />
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="text-right">{appConfig.currency}{order.subtotal.toFixed(2)}</span>
                    </div>
                    {order.discount > 0 && (
                        <div className="flex justify-between">
                            <span>Discount ({order.discount}%):</span>
                            <span className="text-right">-{appConfig.currency}{(order.subtotal * order.discount / 100).toFixed(2)}</span>
                        </div>
                    )}
                    {(order.redeemedValue ?? 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Points Redeemed:</span>
                            <span className="text-right">-{appConfig.currency}{(order.redeemedValue!).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-base mt-2">
                        <span>Total:</span>
                        <span className="text-right">{appConfig.currency}{order.total.toFixed(2)}</span>
                    </div>
                </div>
                <div className="my-2 border-dashed" />
                {paymentQrValue && (
                    <div className="text-center mt-4">
                        <p className="text-xs font-bold mb-2">Scan to Pay</p>
                        <div className="p-2 bg-white rounded-lg inline-block">
                            <QRCode value={paymentQrValue} size={128} />
                        </div>
                    </div>
                )}
                <div className="text-center mt-4 text-xs">
                    <p>Thank you for dining with us!</p>
                </div>
            </div>
        </ScrollArea>

        <div className="mt-4">
            <Button id="print-bill-button" onClick={handlePrint} className="w-full">
                Print Bill
            </Button>
        </div>
    </div>
  );
}
