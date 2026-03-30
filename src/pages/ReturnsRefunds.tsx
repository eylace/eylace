import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { RotateCcw, Clock, ShieldCheck, CreditCard, PackageOpen, Truck, CheckCircle, FileText, AlertTriangle, Tag, Shirt } from "lucide-react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const refundTimeline = [
  { method: "Debit or Credit Card", option: "Debit or Credit Card Payment Reversal", time: "10 working days" },
  { method: "Equated Monthly Installments", option: "Debit or Credit Card", time: "10 working days" },
  { method: "Rocket (Wallet DBBL)", option: "Mobile Wallet Reversal / Rocket", time: "7 working days" },
  { method: "Nagad", option: "Mobile Wallet Reversal / Nagad", time: "5 working days" },
  { method: "DBBL Nexus (Online Banking)", option: "Card Payment Reversal (Nexus)", time: "7 working days" },
  { method: "bKash", option: "Mobile Wallet Reversal / bKash", time: "5 working days" },
  { method: "Cash on Delivery (COD)", option: "Bank Deposit / Eylace Refund Voucher", time: "5 working days / 1 working day" },
  { method: "Eylace Voucher", option: "Refund Voucher", time: "1 working day" },
];

const refundModes = [
  { mode: "Bank Deposit", desc: "The bank account details provided must be correct. The account must be active and should hold some balance." },
  { mode: "Debit / Credit Card", desc: "If the refunded amount is not reflecting in your card statement after the refund is completed and you have received a notification, please contact your personal bank." },
  { mode: "bKash / Rocket / Nagad", desc: "The amount will be refunded to the same mobile account details which you inserted at the time of payment." },
];

const validReasons = [
  "Delivered product is damaged (physically destroyed or broken) / defective (e.g. unable to switch on)",
  "Delivered product is incomplete (has missing items and/or accessories)",
  "Delivered product is incorrect (wrong product/size/colour, fake item, or expired)",
  "Delivered product does not match product description or picture (not as advertised)",
  "Delivered product does not fit (size is unsuitable)",
];

const returnConditions = [
  "The product must be unused, unworn, unwashed and without any flaws. Fashion products can be tried on to see if they fit and will still be considered unworn.",
  "The product must include the original tags, user manuals, warranty cards, freebies, invoice and accessories.",
  "The product must be returned in the original and undamaged manufacturer's packaging/box. If the product was delivered in Eylace packaging, the same packaging should be returned. Do not put tape or stickers directly on the manufacturer's packaging/box.",
];

const ReturnsRefunds = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <RotateCcw className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Returns & Refunds Policy</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto">
              Easy returns, fast refunds. Your satisfaction is our priority. Return requests must be raised within 14 days from the date of delivery.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 space-y-12">

          {/* ── Issuance of Refunds ── */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Issuance of Refunds</h2>
            <Card>
              <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
                <p>1. The processing time of your refund depends on the type of refund and the payment method you used.</p>
                <p>2. The refund period / process starts when Eylace has processed your refund according to your refund type.</p>
                <p>3. The refund amount covers the item price and shipping fee for your returned product.</p>
              </CardContent>
            </Card>
          </section>

          {/* ── Refund Types ── */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Refund Types</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: RotateCcw, title: "Refund from Returns", desc: "Refund is processed once your item is returned to the warehouse and QC is completed successfully." },
                { icon: PackageOpen, title: "Refunds from Cancelled Orders", desc: "Refund is automatically triggered once cancellation is successfully processed." },
                { icon: Truck, title: "Refunds from Failed Deliveries", desc: "Refund process starts when the item has reached the seller. This may take more time depending on shipping area." },
              ].map((t) => (
                <Card key={t.title}>
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                      <t.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{t.title}</h3>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ── Refund Timeline Table ── */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Refund Timeline by Payment Method</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Payment Method</TableHead>
                      <TableHead className="font-semibold text-foreground">Refund Option</TableHead>
                      <TableHead className="font-semibold text-foreground">Refund Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundTimeline.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-foreground">{r.method}</TableCell>
                        <TableCell className="text-muted-foreground">{r.option}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.time}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-2 italic">* Maximum refund timeline excludes weekends and public holidays.</p>
          </section>

          {/* ── Modes of Refund ── */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Modes of Refund</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {refundModes.map((m) => (
                <Card key={m.mode}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{m.mode}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{m.desc}</CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ── Returns Policy ── */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Returns Policy</h2>
            <Card>
              <CardContent className="p-6 space-y-4 text-sm text-muted-foreground">
                <p>
                  If your product is damaged, defective, incorrect or incomplete at the time of delivery, please raise a return request on the Eylace app or website.
                  <strong className="text-foreground"> Return request must be raised within 14 days from the date of delivery.</strong>
                </p>
                <p>
                  For electronic appliances & mobile phones related issues after usage or after the return policy period, please check if the product is covered under seller warranty or brand warranty.
                </p>
                <p>For selected categories, we accept a change of mind. Please refer to the category-specific section below.</p>
              </CardContent>
            </Card>
          </section>

          {/* ── Valid Reasons ── */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Valid Reasons to Return an Item</h2>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {validReasons.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* ── Conditions for Returns ── */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Conditions for Returns</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                {returnConditions.map((c, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{i + 1}</span>
                    <span className="text-muted-foreground">{c}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="mt-4 space-y-3">
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4 flex gap-3 text-sm">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> Indicate the Order Number and Return Tracking Number on your return package. While handing over your package to a Drop-Off station or Pickup Agent, please collect the Eylace Return Acknowledgment paper and keep it for future reference.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 flex gap-3 text-sm">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    If your return request has been rejected, the item will be delivered back to you between 6-8 days. Item will be sent to scrap after three (3) failed delivery attempts and no refund will be given.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Category-specific: Fashion ── */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Category-Specific Return Policy</h2>
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="fashion" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Shirt className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Clothing, Apparel, Sunglasses, Shoes & Accessories</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                  <p>
                    <Badge variant="outline" className="mr-2">Change of mind</Badge>
                    Applicable for return and refund.
                  </p>
                  <p>
                    If the item received is damaged, defective, incorrect, or incomplete, a refund will be issued based on Eylace's assessment. Items must be unworn, unwashed, and unaltered with their tags intact. Any items found used will be rejected and returned back to customers.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Conditions</p>
                    <ul className="space-y-2">
                      <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Product must be unused, unworn, unwashed and without flaws. Trying on for fit is considered unworn.</li>
                      <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Must include original tags, user manual, warranty cards, freebies and accessories.</li>
                      <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Must be returned in original undamaged manufacturer packaging. Do not put tape or stickers on the manufacturer's box.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* CTA */}
          <div className="text-center bg-muted rounded-2xl p-8">
            <h3 className="text-xl font-bold text-foreground mb-2">Need more help?</h3>
            <p className="text-muted-foreground mb-4">Our support team is ready to assist you with any return or refund queries</p>
            <Link to="/help">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Contact Support</Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReturnsRefunds;
