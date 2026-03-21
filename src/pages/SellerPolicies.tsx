import { Layout } from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const policies = [
  {
    id: 'commission',
    title: 'Commission Structure',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li><strong>Standard Commission:</strong> A 5-15% commission applies on each product sold, varying by category.</li>
        <li><strong>Electronics:</strong> 5-8%</li>
        <li><strong>Fashion & Clothing:</strong> 10-15%</li>
        <li><strong>Grocery:</strong> 3-5%</li>
        <li><strong>Beauty & Health:</strong> 8-12%</li>
        <li>Premium seller packages enjoy lower commission rates.</li>
      </ul>
    `,
  },
  {
    id: 'returns',
    title: 'Return & Refund Policy',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li>Buyers can submit a return request within 7 days of receiving the product.</li>
        <li>Full refund is provided for defective, wrong, or damaged products.</li>
        <li>Return shipping cost is the seller's responsibility (if the product is defective).</li>
        <li>Refund process is completed within 3-7 business days.</li>
        <li>Digital products and personalized items are non-returnable.</li>
      </ul>
    `,
  },
  {
    id: 'shipping',
    title: 'Shipping Guidelines',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li>Products must be shipped within 24-48 hours of order confirmation.</li>
        <li>Providing a tracking number for all products is mandatory.</li>
        <li>Discounted rates are available when using Eylace's partner couriers.</li>
        <li>Separate shipping charges apply for heavy and oversized products.</li>
        <li>Sellers can offer free shipping at their own expense.</li>
      </ul>
    `,
  },
  {
    id: 'listing',
    title: 'Product Listing Rules',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li>Accurate product descriptions, specifications, and pricing must be provided.</li>
        <li>Upload a minimum of 1 and maximum of 8 high-quality images.</li>
        <li>Counterfeit, illegal, or prohibited products cannot be listed.</li>
        <li>Pricing must be consistent with market rates.</li>
        <li>Product titles should be clear and search-friendly.</li>
      </ul>
    `,
  },
  {
    id: 'payment',
    title: 'Payment Terms',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li>Payment cycle: Every 7 days (weekly payout).</li>
        <li>Supported payment methods: bKash, Nagad, Bank Transfer.</li>
        <li>Minimum payout amount: ৳500.</li>
        <li>Return/refund amounts will be deducted from the next payout.</li>
        <li>Payout requests can be made from the seller dashboard.</li>
      </ul>
    `,
  },
  {
    id: 'suspension',
    title: 'Account Suspension Policy',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li>Selling counterfeit products may result in immediate account suspension.</li>
        <li>Consistently negative reviews (average below 2 stars) will trigger a warning.</li>
        <li>Delivery delays exceeding 72 hours will incur penalties.</li>
        <li>Account may be suspended after 3 warnings.</li>
        <li>Appeal process: Contact seller support within 15 days of suspension.</li>
      </ul>
    `,
  },
];

const SellerPolicies = () => {
  return (
    <Layout>
      <div className="container-main py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Seller Policies</h1>
        <p className="text-muted-foreground mb-8">
          Terms and conditions applicable for selling on Eylace. Please read all policies carefully.
        </p>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {policies.map((p) => (
            <AccordionItem key={p.id} value={p.id} className="border rounded-lg px-4">
              <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline">
                {p.title}
              </AccordionTrigger>
              <AccordionContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: p.content }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Layout>
  );
};

export default SellerPolicies;
