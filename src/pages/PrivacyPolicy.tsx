import { Layout } from '@/components/layout/Layout';
import { Shield } from 'lucide-react';
import { SeoHead } from '@/components/seo/SeoHead';


const sections = [
  { title: '1. Information We Collect', content: 'We collect personal information you provide when creating an account, placing orders, or contacting support. This includes your name, email address, phone number, shipping address, and payment details. We also automatically collect usage data such as IP address, browser type, pages visited, and device information.' },
  { title: '2. How We Use Your Information', content: 'Your information is used to process orders, provide customer support, personalize your shopping experience, send order updates and promotional communications (with your consent), prevent fraud, and improve our platform. We do not sell your personal data to third parties.' },
  { title: '3. Information Sharing', content: 'We share your information only with: delivery partners (to fulfill orders), payment processors (to process transactions), sellers (order details needed for fulfillment), and law enforcement (when legally required). All third parties are bound by confidentiality agreements.' },
  { title: '4. Data Security', content: 'We use industry-standard encryption (SSL/TLS) to protect your data during transmission. Payment information is processed through PCI-DSS compliant payment gateways. We regularly audit our security practices and maintain strict access controls to protect your information.' },
  { title: '5. Cookies & Tracking', content: 'We use cookies and similar technologies to remember your preferences, analyze site traffic, and personalize content. You can manage cookie preferences through your browser settings. See our Cookie Policy for more details.' },
  { title: '6. Your Rights', content: 'You have the right to: access your personal data, correct inaccurate information, request deletion of your data, opt out of marketing communications, and withdraw consent at any time. Contact us at privacy@eylace.com to exercise these rights.' },
  { title: '7. Data Retention', content: 'We retain your personal data for as long as your account is active or as needed to provide services. Order records are kept for 5 years for legal and accounting purposes. You can request account deletion at any time.' },
  { title: '8. Updates to This Policy', content: 'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on our platform. Continued use after changes constitutes acceptance of the updated policy.' },
];

const PrivacyPolicy = () => (
  <Layout>
    <SeoHead
      title="Privacy Policy — Eylace"
      description="How Eylace collects, uses, shares and protects your personal data, plus your rights over your information and how to exercise them."
      path="/privacy"
    />
    <section className="bg-primary text-primary-foreground py-16">

      <div className="container-main text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-accent" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-lg text-primary-foreground/80">Last updated: March 1, 2026</p>
      </div>
    </section>

    <section className="container-main py-12 max-w-3xl">
      <p className="text-muted-foreground mb-8">
        At Eylace, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our platform.
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
        <p className="text-sm text-muted-foreground"><strong className="text-foreground">Questions?</strong> Contact our privacy team at <a href="mailto:privacy@eylace.com" className="text-accent hover:underline">privacy@eylace.com</a></p>
      </div>
    </section>
  </Layout>
);

export default PrivacyPolicy;
