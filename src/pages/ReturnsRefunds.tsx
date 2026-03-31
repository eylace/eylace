import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { RotateCcw, Clock, ShieldCheck, CreditCard, PackageOpen, Truck, CheckCircle, FileText, AlertTriangle, Tag, Shirt, Ban, Info, MapPin, Banknote, Smartphone, CreditCard as CardIcon, Receipt, ShoppingBag, Footprints, Glasses, Watch } from "lucide-react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const refundTimeline = [
  { method: "Debit / Credit Card", type: "Card Reversal", time: "7–10 working days" },
  { method: "EMI (Installment)", type: "Card Reversal", time: "7–10 working days" },
  { method: "bKash", type: "Mobile Wallet", time: "3–5 working days" },
  { method: "Nagad", type: "Mobile Wallet", time: "3–5 working days" },
  { method: "Rocket (DBBL)", type: "Mobile Wallet", time: "5–7 working days" },
  { method: "DBBL Nexus", type: "Card Reversal", time: "5–7 working days" },
  { method: "Cash on Delivery (COD)", type: "Bank Transfer", time: "3–5 working days" },
  { method: "Eylace Refund Voucher", type: "Store Credit", time: "1 working day" },
];

const ReturnsRefunds = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <RotateCcw className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Eylace Return & Refund Policy</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto">
              At Eylace, we aim to ensure a smooth and transparent refund experience. Return requests must be submitted within <strong>14 days</strong> from the delivery date.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 space-y-12">

          {/* 1. Refund Processing Overview */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</span>
              Refund Processing Overview
            </h2>
            <Card>
              <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
                <p>Refund processing time depends on the type of refund and the payment method used.</p>
                <p>The refund process begins once the request is approved and processed by Eylace.</p>
                <p className="font-medium text-foreground">Refunds cover:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Product price</li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Applicable shipping charges</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* 2. Types of Refunds */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">2</span>
              Types of Refunds
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: RotateCcw, title: "Refund from Returns",
                  items: ["Product is received at our warehouse", "Quality Check (QC) is successfully completed"],
                  label: "Initiated after:"
                },
                {
                  icon: PackageOpen, title: "Refund from Cancelled Orders",
                  items: ["Automatically initiated once the cancellation is confirmed"],
                  label: "Process:"
                },
                {
                  icon: Truck, title: "Refund from Failed Deliveries",
                  items: ["Process starts after the product is returned to the seller", "Delivery return time may vary depending on location within Bangladesh"],
                  label: "Process:"
                },
              ].map((t) => (
                <Card key={t.title}>
                  <CardContent className="p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                      <t.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-center">{t.title}</h3>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.label}</p>
                    <ul className="space-y-2">
                      {t.items.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* 3. Refund Timeline */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">3</span>
              Refund Timeline by Payment Method
            </h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Payment Method</TableHead>
                      <TableHead className="font-semibold text-foreground">Refund Type</TableHead>
                      <TableHead className="font-semibold text-foreground">Estimated Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundTimeline.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-foreground">{r.method}</TableCell>
                        <TableCell className="text-muted-foreground">{r.type}</TableCell>
                        <TableCell><Badge variant="secondary">{r.time}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-2 italic">* Timelines exclude weekends and public holidays in Bangladesh.</p>
          </section>

          {/* 4. Refund Methods */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">4</span>
              Refund Methods
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Bank Transfer (COD Orders)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Customers must provide accurate bank details.</p>
                  <p>Account must be active and valid.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Card Refund</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Refunded to the original debit/credit card.</p>
                  <p>If not received after confirmation, contact your bank.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Mobile Wallet</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>bKash / Nagad / Rocket</p>
                  <p>Refund will be sent to the same wallet used during payment.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 5. Return Policy */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">5</span>
              Return Policy
            </h2>

            {/* 5.1 Return Window */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Return Window
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Return requests must be submitted within <strong className="text-foreground">14 days</strong> from the delivery date.
              </CardContent>
            </Card>

            {/* 5.2 Valid Reasons */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Valid Reasons for Return</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Damaged or broken upon delivery",
                    "Defective or not functioning",
                    "Incomplete (missing parts or accessories)",
                    "Incorrect item, size, or color",
                    "Not as described or shown on the website",
                    "Not suitable in size (for applicable categories)",
                  ].map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 5.3 Warranty */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Warranty Cases
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                After the return period, customers should claim via seller or brand warranty (if applicable).
              </CardContent>
            </Card>
          </section>

          {/* 6. Return Conditions */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">6</span>
              Return Conditions
            </h2>
            <Card>
              <CardContent className="p-6 space-y-5">
                <div>
                  <p className="font-semibold text-foreground text-sm mb-2">Product must be:</p>
                  <ul className="space-y-2 ml-2">
                    {["Unused", "Unworn", "Unwashed", "Without damage"].map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm mb-2">Must include:</p>
                  <ul className="space-y-2 ml-2">
                    {["Original tags", "Accessories", "User manuals", "Warranty cards", "Invoice"].map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm mb-2">Packaging:</p>
                  <ul className="space-y-2 ml-2">
                    {["Must be in original condition", "Manufacturer box must not be damaged"].map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4 flex gap-3 text-sm">
                    <Ban className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Do NOT</strong> apply tape or stickers directly on the product box.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </section>

          {/* 7. Return Instructions */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">7</span>
              Important Return Instructions
            </h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="font-semibold text-foreground text-sm mb-2">Clearly mention on the package:</p>
                  <ul className="space-y-2 ml-2">
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Order Number
                    </li>
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Return Tracking Number
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm mb-2">When handing over the product:</p>
                  <ul className="space-y-2 ml-2">
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <Receipt className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Collect the <strong className="text-foreground">Return Acknowledgement Receipt</strong>
                    </li>
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Keep it for future reference
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 8. Rejected Returns */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">8</span>
              Rejected Returns Policy
            </h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="font-semibold text-foreground text-sm mb-2">Returns may be rejected if:</p>
                  <ul className="space-y-2 ml-2 text-sm text-muted-foreground">
                    <li className="flex gap-2"><Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> Product shows signs of use</li>
                    <li className="flex gap-2"><Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> Missing accessories or packaging</li>
                    <li className="flex gap-2"><Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> Does not meet return conditions</li>
                  </ul>
                </div>
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
                    <p>If rejected, product will be returned within <strong className="text-foreground">6–8 working days</strong>.</p>
                  </CardContent>
                </Card>
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4 flex gap-3 text-sm">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      After <strong className="text-foreground">3 failed delivery attempts</strong>, the product may be disposed of and <strong className="text-foreground">no refund will be issued</strong>.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </section>

          {/* 9. Category-Specific: Fashion */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">9</span>
              Category-Specific Policy (Fashion & Lifestyle)
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="fashion" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Shirt className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Clothing, Footwear, Sunglasses & Accessories</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                  <p>
                    <Badge variant="outline" className="mr-2">Change of mind</Badge>
                    Allowed — applicable for return and refund.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Items must be:</p>
                    <ul className="space-y-2">
                      <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Unused</li>
                      <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Unwashed</li>
                      <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Unaltered</li>
                      <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> With original tags intact</li>
                    </ul>
                  </div>
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-3 text-sm text-muted-foreground">
                      Used or damaged items will <strong className="text-foreground">not be accepted</strong> and will be returned to the customer.
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* 10. Important Notes */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">10</span>
              Important Notes
            </h2>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    Refund timelines may vary depending on banking systems in Bangladesh.
                  </li>
                  <li className="flex gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    Delays may occur due to remote delivery locations.
                  </li>
                  <li className="flex gap-3">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    Public holidays may affect processing time.
                  </li>
                  <li className="flex gap-3">
                    <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    Payment gateway processing time may cause additional delays.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <div className="text-center bg-muted rounded-2xl p-8">
            <h3 className="text-xl font-bold text-foreground mb-2">Need more help?</h3>
            <p className="text-muted-foreground mb-4">Our support team is ready to assist you with any return or refund queries.</p>
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
