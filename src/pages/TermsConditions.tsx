import { Layout } from '@/components/layout/Layout';
import { FileText } from 'lucide-react';
import { SeoHead } from '@/components/seo/SeoHead';


const sections = [
  { title: '1. Acceptance of Terms', content: 'By accessing or using Eylace, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our platform. These terms apply to all users, including browsers, customers, sellers, and contributors.' },
  { title: '2. Account Registration', content: 'You must provide accurate, complete, and current information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to create an account. Eylace reserves the right to suspend accounts that violate these terms.' },
  { title: '3. Orders & Payments', content: 'All orders are subject to product availability and payment confirmation. Prices are displayed in BDT and may change without notice. We accept various payment methods including bKash, Nagad, credit/debit cards, and cash on delivery. Order cancellation is possible before shipment.' },
  { title: '4. Shipping & Delivery', content: 'Delivery times are estimates and may vary based on location and availability. We are not responsible for delays caused by force majeure events. Risk of loss passes to you upon delivery. Please inspect packages upon receipt and report any damage within 24 hours.' },
  { title: '5. Returns & Refunds', content: 'Products may be returned within 7 days of delivery if they are defective, damaged, or not as described. Refunds are processed within 5-10 business days after receiving the returned item. Some products (perishables, intimate items, customized goods) are non-returnable. See our Returns Policy for full details.' },
  { title: '6. Seller Responsibilities', content: 'Sellers must provide accurate product descriptions and images. Sellers are responsible for product quality, timely shipping, and customer queries. Eylace charges a commission on each sale as per the seller agreement. Violation of seller policies may result in account suspension.' },
  { title: '7. Intellectual Property', content: 'All content on Eylace — including logos, text, graphics, and software — is the property of Eylace or its licensors. You may not copy, reproduce, or distribute any content without written permission. User-generated content (reviews, images) grants Eylace a non-exclusive license to display it on the platform.' },
  { title: '8. Limitation of Liability', content: 'Eylace acts as a marketplace connecting buyers and sellers. We are not the seller of products listed by third-party sellers. Our liability is limited to the amount paid for the specific transaction in dispute. We are not liable for indirect, incidental, or consequential damages.' },
  { title: '9. Dispute Resolution', content: 'Any disputes shall first be attempted to be resolved through our customer support. If unresolved, disputes will be submitted to mediation under Bangladeshi law. Courts in Dhaka, Bangladesh shall have exclusive jurisdiction over any legal proceedings.' },
  { title: '10. Changes to Terms', content: 'Eylace reserves the right to modify these terms at any time. Changes will be posted on this page with an updated date. Continued use after modifications constitutes acceptance. We encourage you to review these terms periodically.' },
];

const TermsConditions = () => (
  <Layout>
    <section className="bg-primary text-primary-foreground py-16">
      <div className="container-main text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-accent" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
        <p className="text-lg text-primary-foreground/80">Last updated: March 1, 2026</p>
      </div>
    </section>

    <section className="container-main py-12 max-w-3xl">
      <p className="text-muted-foreground mb-8">
        Please read these Terms and Conditions carefully before using the Eylace platform. These terms govern your use of our website and services.
      </p>
      <div className="space-y-8">
        {sections.map(s => (
          <div key={s.title}>
            <h2 className="text-lg font-bold text-foreground mb-2">{s.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground"><strong className="text-foreground">Questions?</strong> Contact us at <a href="mailto:legal@eylace.com" className="text-accent hover:underline">legal@eylace.com</a></p>
      </div>
    </section>
  </Layout>
);

export default TermsConditions;
