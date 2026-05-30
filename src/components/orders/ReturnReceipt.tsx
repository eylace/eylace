import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

interface ReturnReceiptProps {
  trackingNumber: string;
  orderNumber: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  price?: number;
  reason: string;
  description?: string;
  refundMethod?: string;
  refundAmount?: number;
  status: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
}

export const ReturnReceipt = (props: ReturnReceiptProps) => {
  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) {
      // Fallback for popup blockers
      const blob = new Blob([generateHTML()], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `return-receipt-${props.trackingNumber}.html`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    win.document.write(generateHTML());
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const generateHTML = () => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Return Receipt - ${props.trackingNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 3px solid #e11d48; padding-bottom: 20px; margin-bottom: 24px; }
  .header h1 { font-size: 28px; letter-spacing: 3px; color: #e11d48; }
  .header p { color: #666; font-size: 13px; margin-top: 4px; }
  .tracking { background: #fef2f2; border: 2px dashed #e11d48; padding: 16px; text-align: center; border-radius: 8px; margin-bottom: 24px; }
  .tracking h2 { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
  .tracking .code { font-size: 24px; font-weight: 700; color: #e11d48; margin-top: 4px; font-family: monospace; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; vertical-align: top; }
  td:first-child { color: #666; width: 40%; }
  td:last-child { font-weight: 600; }
  .product { background: #f8f8f8; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
  .product strong { display: inline; }
  .instructions { background: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 13px; }
  .instructions h3 { font-size: 14px; margin-bottom: 8px; }
  .instructions ul { padding-left: 20px; }
  .instructions li { margin-bottom: 6px; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="header">
  <h1>Eylace Return Acknowledgement Receipt</h1>
  <p>Keep this for your records</p>
</div>
<div class="tracking">
  <h2>Return Tracking Number</h2>
  <div class="code">${props.trackingNumber}</div>
</div>
<table>
  <tbody>
    ${props.orderNumber ? `<tr><td>Order Number</td><td>#${props.orderNumber}</td></tr>` : ''}
    <tr><td>Status</td><td style="text-transform:capitalize">${props.status}</td></tr>
    <tr><td>Date Submitted</td><td>${format(new Date(props.createdAt), 'MMMM d, yyyy')}</td></tr>
    ${props.customerName ? `<tr><td>Customer</td><td>${props.customerName}</td></tr>` : ''}
    ${props.customerEmail ? `<tr><td>Email</td><td>${props.customerEmail}</td></tr>` : ''}
    <tr><td>Return Reason</td><td>${props.reason}</td></tr>
    ${props.description ? `<tr><td>Details</td><td>${props.description}</td></tr>` : ''}
    <tr><td>Refund Method</td><td style="text-transform:capitalize">${props.refundMethod || 'Original Payment'}</td></tr>
    ${props.refundAmount != null ? `<tr><td>Refund Amount</td><td>৳${Number(props.refundAmount).toFixed(2)}</td></tr>` : ''}
  </tbody>
</table>
${props.productName ? `
<div class="product">
  <strong>Product:</strong> ${props.productName}<br/>
  ${props.quantity ? `<strong>Quantity:</strong> ${props.quantity}<br/>` : ''}
  ${props.price ? `<strong>Unit Price:</strong> ৳${props.price.toFixed(2)}` : ''}
</div>
` : ''}
<div class="instructions">
  <h3>📋 Important Instructions</h3>
  <ul>
    <li>Keep this receipt for your records.</li>
    <li>Mention your <strong>Order Number</strong> and <strong>Return Tracking Number</strong> on the package.</li>
    <li>Return the item in original packaging with all tags and accessories.</li>
    <li>Collect the Return Acknowledgement Form from the hub when returning.</li>
  </ul>
</div>
<div class="footer">
  <p>This is an auto-generated receipt from Eylace. Keep this for your records.</p>
  <p>Generated on ${format(new Date(), 'MMMM d, yyyy, h:mm a')}</p>
</div>
</body></html>`;

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
      <Printer className="h-3.5 w-3.5" />
      Download Receipt
    </Button>
  );
};
