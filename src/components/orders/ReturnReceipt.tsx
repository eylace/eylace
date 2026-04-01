import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
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
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Return Receipt - ${props.trackingNumber}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px solid #e11d48; padding-bottom: 20px; margin-bottom: 24px; }
        .header h1 { font-size: 28px; margin: 0; letter-spacing: 2px; }
        .header p { color: #666; margin: 4px 0 0; font-size: 13px; }
        .tracking { background: #fef2f2; border: 2px dashed #e11d48; padding: 16px; text-align: center; border-radius: 8px; margin-bottom: 24px; }
        .tracking h2 { margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .tracking .code { font-size: 24px; font-weight: 700; color: #e11d48; margin-top: 4px; font-family: monospace; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        td:first-child { color: #666; width: 40%; }
        td:last-child { font-weight: 600; }
        .product { background: #f8f8f8; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
        .instructions { background: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 13px; }
        .instructions h3 { margin: 0 0 8px; font-size: 14px; }
        .instructions li { margin-bottom: 4px; }
        .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${content.innerHTML}
      <div class="footer">
        <p>This is an auto-generated receipt from Eylace. Keep this for your records.</p>
        <p>Generated on ${format(new Date(), 'MMMM d, yyyy, h:mm a')}</p>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div>
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="header">
          <h1>EYLACE</h1>
          <p>Return Acknowledgement Receipt</p>
        </div>
        <div className="tracking">
          <h2>Return Tracking Number</h2>
          <div className="code">{props.trackingNumber}</div>
        </div>
        <table>
          <tbody>
            <tr><td>Order Number</td><td>#{props.orderNumber}</td></tr>
            <tr><td>Status</td><td style={{ textTransform: 'capitalize' }}>{props.status}</td></tr>
            <tr><td>Date Submitted</td><td>{format(new Date(props.createdAt), 'MMMM d, yyyy')}</td></tr>
            {props.customerName && <tr><td>Customer</td><td>{props.customerName}</td></tr>}
            {props.customerEmail && <tr><td>Email</td><td>{props.customerEmail}</td></tr>}
            <tr><td>Return Reason</td><td>{props.reason}</td></tr>
            {props.description && <tr><td>Details</td><td>{props.description}</td></tr>}
            <tr><td>Refund Method</td><td style={{ textTransform: 'capitalize' }}>{props.refundMethod || 'Original Payment'}</td></tr>
            {props.refundAmount != null && <tr><td>Refund Amount</td><td>৳{Number(props.refundAmount).toFixed(2)}</td></tr>}
          </tbody>
        </table>
        {props.productName && (
          <div className="product">
            <strong>Product:</strong> {props.productName}<br/>
            {props.quantity && <><strong>Quantity:</strong> {props.quantity}<br/></>}
            {props.price && <><strong>Unit Price:</strong> ৳{props.price.toFixed(2)}</>}
          </div>
        )}
        <div className="instructions">
          <h3>📋 Important Instructions</h3>
          <ul>
            <li>Keep this receipt for your records.</li>
            <li>Mention your <strong>Order Number</strong> and <strong>Return Tracking Number</strong> on the package.</li>
            <li>Return the item in original packaging with all tags and accessories.</li>
            <li>Collect the Return Acknowledgement Form from the hub when returning.</li>
          </ul>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
        <Printer className="h-3.5 w-3.5" />
        Download Receipt
      </Button>
    </div>
  );
};
