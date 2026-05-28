/**
 * Professional Invoice PDF Generator
 * Combines best elements from both reference PDFs:
 * - Clean header with business branding
 * - Full customer & shipping details
 * - Itemized product table with variants
 * - Financial summary with subtotal/discount/shipping/tax/total
 */

interface InvoiceOrder {
  order_number: string;
  created_at: string;
  status: string;
  payment_method: string;
  items?: {
    id: string;
    product_name: string;
    product_image?: string | null;
    quantity: number;
    price: number;
    variations?: any;
  }[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  shipping_address?: any;
  profile?: { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null };
  guest_email?: string | null;
  guest_phone?: string | null;
  user_id?: string | null;
}

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const getAddr = (sa: any = {}) => ({
  first_name: sa?.first_name || sa?.firstName || '',
  last_name: sa?.last_name || sa?.lastName || '',
  email: sa?.email || '',
  phone: sa?.phone || '',
  address: sa?.address || '',
  apartment: sa?.apartment || '',
  city: sa?.city || '',
  state: sa?.state || '',
  zip_code: sa?.zip_code || sa?.zipCode || '',
  country: sa?.country || 'BD',
});

const isPhoneAlias = (v: string | null | undefined) => typeof v === 'string' && /^phone_\d+@phone\.local$/i.test(v.trim());

const getName = (o: InvoiceOrder) => {
  const sa = getAddr(o.shipping_address);
  return `${o.profile?.first_name || sa.first_name || 'Guest'} ${o.profile?.last_name || sa.last_name || ''}`.trim() || 'Guest';
};

const getEmail = (o: InvoiceOrder) => {
  const sa = getAddr(o.shipping_address);
  const pe = isPhoneAlias(o.profile?.email) ? null : o.profile?.email;
  return pe || o.guest_email || sa.email || '';
};

const getPhone = (o: InvoiceOrder) => {
  const sa = getAddr(o.shipping_address);
  return o.profile?.phone || o.guest_phone || sa.phone || '';
};

const formatDate = (d: string) => {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return d; }
};

function generateInvoiceHTML(order: InvoiceOrder): string {
  const addr = getAddr(order.shipping_address);
  const customerName = getName(order);
  const customerEmail = getEmail(order);
  const customerPhone = getPhone(order);
  const fullAddress = [addr.address, addr.apartment, addr.city, addr.state, addr.zip_code, addr.country].filter(Boolean).join(', ');
  const isPaid = order.payment_method !== 'cod' || order.status === 'delivered';

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:780px;margin:0 auto;padding:30px 40px;color:#1a1a1a;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #2563eb;">
        <div>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#2563eb;letter-spacing:-0.5px;">INVOICE</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Eylace Store</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:13px;color:#6b7280;">Invoice No.</p>
          <p style="margin:2px 0 0;font-size:15px;font-weight:700;color:#1a1a1a;">#${esc(order.order_number)}</p>
          <p style="margin:6px 0 0;font-size:12px;color:#6b7280;">Date: ${formatDate(order.created_at)}</p>
          <p style="margin:3px 0 0;font-size:12px;color:#6b7280;">Status: <span style="font-weight:600;color:${isPaid ? '#059669' : '#d97706'};">${isPaid ? 'Paid' : 'Unpaid'}</span></p>
        </div>
      </div>

      <!-- Customer & Shipping Info -->
      <div style="display:flex;gap:30px;margin-bottom:28px;">
        <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e5e7eb;">
          <h3 style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:700;">Bill To</h3>
          <p style="margin:0;font-size:14px;font-weight:600;">${esc(customerName)}</p>
          ${customerEmail ? `<p style="margin:3px 0 0;font-size:12px;color:#4b5563;">${esc(customerEmail)}</p>` : ''}
          ${customerPhone ? `<p style="margin:3px 0 0;font-size:12px;color:#4b5563;">Phone: ${esc(customerPhone)}</p>` : ''}
        </div>
        <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e5e7eb;">
          <h3 style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:700;">Ship To</h3>
          <p style="margin:0;font-size:14px;font-weight:600;">${esc(customerName)}</p>
          <p style="margin:3px 0 0;font-size:12px;color:#4b5563;">${esc(fullAddress) || 'N/A'}</p>
          ${customerPhone ? `<p style="margin:3px 0 0;font-size:12px;color:#4b5563;">Phone: ${esc(customerPhone)}</p>` : ''}
        </div>
      </div>

      <!-- Payment Info -->
      <div style="margin-bottom:24px;padding:10px 16px;background:#eff6ff;border-radius:6px;display:flex;gap:24px;font-size:12px;">
        <span><strong>Payment:</strong> ${esc(order.payment_method?.toUpperCase() || 'N/A')}</span>
        <span><strong>Delivery:</strong> Home Delivery</span>
      </div>

      <!-- Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#1e293b;">
            <th style="padding:10px 12px;text-align:left;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-radius:6px 0 0 0;">#</th>
            <th style="padding:10px 12px;text-align:left;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Item</th>
            <th style="padding:10px 12px;text-align:left;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Variant</th>
            <th style="padding:10px 12px;text-align:center;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Qty</th>
            <th style="padding:10px 12px;text-align:right;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-radius:0 6px 0 0;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${(order.items || []).map((item, idx) => {
            const variant = item.variations ? (typeof item.variations === 'string' ? item.variations : Object.values(item.variations).join(', ')) : 'Default';
            const bgColor = idx % 2 === 0 ? '#fff' : '#f9fafb';
            return `<tr style="background:${bgColor};">
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#6b7280;">${idx + 1}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:500;">${esc(item.product_name)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#6b7280;">${esc(variant)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;">${item.quantity}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right;">৳${Number(item.price).toLocaleString()}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right;font-weight:600;">৳${(item.quantity * item.price).toLocaleString()}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="display:flex;justify-content:flex-end;">
        <div style="width:280px;">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6b7280;">
            <span>Subtotal:</span><span style="color:#1a1a1a;">৳${order.subtotal?.toLocaleString() || '0'}</span>
          </div>
          ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#059669;">
            <span>Discount:</span><span>-৳${order.discount.toLocaleString()}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6b7280;">
            <span>Shipping:</span><span style="color:#1a1a1a;">৳${order.shipping?.toLocaleString() || '0'}</span>
          </div>
          ${order.tax > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6b7280;">
            <span>Tax:</span><span style="color:#1a1a1a;">৳${order.tax.toLocaleString()}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:6px;border-top:2px solid #1e293b;font-size:18px;font-weight:800;">
            <span>Total:</span><span>৳${order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;font-size:13px;color:#6b7280;">Thank you for your order!</p>
        <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">This is a computer-generated invoice. No signature required.</p>
      </div>
    </div>`;
}

export function printSingleInvoice(order: InvoiceOrder) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${esc(order.order_number)}</title>
    <style>@media print{body{margin:0}@page{size:A4;margin:15mm}}</style></head>
    <body>${generateInvoiceHTML(order)}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export function printBulkInvoices(orders: InvoiceOrder[]) {
  const win = window.open('', '_blank');
  if (!win) return;
  const pages = orders.map(o => `<div style="page-break-after:always;">${generateInvoiceHTML(o)}</div>`).join('');
  win.document.write(`<!DOCTYPE html><html><head><title>Bulk Invoices (${orders.length})</title>
    <style>@media print{body{margin:0}@page{size:A4;margin:15mm}}</style></head>
    <body>${pages}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export function downloadSingleInvoice(order: InvoiceOrder) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${esc(order.order_number)}</title>
    <style>@media print{body{margin:0}@page{size:A4;margin:15mm}}</style></head>
    <body>${generateInvoiceHTML(order)}
    <script>window.onload=function(){window.print();}<\/script></body></html>`);
  win.document.close();
}

export function downloadBulkInvoices(orders: InvoiceOrder[]) {
  const win = window.open('', '_blank');
  if (!win) return;
  const pages = orders.map(o => `<div style="page-break-after:always;">${generateInvoiceHTML(o)}</div>`).join('');
  win.document.write(`<!DOCTYPE html><html><head><title>Bulk Invoices (${orders.length})</title>
    <style>@media print{body{margin:0}@page{size:A4;margin:15mm}}body{font-family:'Segoe UI',Arial,sans-serif}</style></head>
    <body>${pages}
    <script>window.onload=function(){window.print();}<\/script></body></html>`);
  win.document.close();
}

/**
 * Mobile-friendly print using a hidden iframe instead of window.open
 * (popups are commonly blocked on iOS/Android browsers).
 * Falls back to printSingleInvoice if iframe creation fails.
 */
export function printInvoiceInline(order: InvoiceOrder) {
  try {
    const existing = document.getElementById('lovable-print-frame');
    if (existing) existing.remove();
    const frame = document.createElement('iframe');
    frame.id = 'lovable-print-frame';
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    document.body.appendChild(frame);
    const doc = frame.contentDocument || frame.contentWindow?.document;
    if (!doc) {
      printSingleInvoice(order);
      return;
    }
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>Invoice #${esc(order.order_number)}</title>
      <style>@media print{body{margin:0}@page{size:A4;margin:15mm}}body{font-family:'Segoe UI',Arial,sans-serif}</style></head>
      <body>${generateInvoiceHTML(order)}</body></html>`);
    doc.close();
    setTimeout(() => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        printSingleInvoice(order);
      }
    }, 350);
  } catch {
    printSingleInvoice(order);
  }
}
