import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, Shield, BarChart3, Target, Settings } from 'lucide-react';

const cookieTypes = [
  { icon: Shield, title: 'Essential Cookies', desc: 'Required for the website to function properly. They enable basic features like page navigation, secure login, and cart functionality. These cannot be disabled.', always: true },
  { icon: BarChart3, title: 'Analytics Cookies', desc: 'Help us understand how visitors interact with our website by collecting anonymous usage data. This helps us improve our platform and user experience.', always: false },
  { icon: Target, title: 'Marketing Cookies', desc: 'Used to track visitors across websites to display relevant advertisements. They help us measure the effectiveness of our marketing campaigns.', always: false },
  { icon: Settings, title: 'Preference Cookies', desc: 'Remember your settings and preferences, such as language, currency, and delivery location, so you do not have to set them each time you visit.', always: false },
];

const CookiePolicy = () => (
  <Layout>
    <section className="bg-primary text-primary-foreground py-16">
      <div className="container-main text-center">
        <Cookie className="h-12 w-12 mx-auto mb-4 text-accent" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-lg text-primary-foreground/80">Last updated: March 1, 2026</p>
      </div>
    </section>

    <section className="container-main py-12 max-w-3xl">
      <p className="text-muted-foreground mb-8">
        This Cookie Policy explains how Eylace uses cookies and similar tracking technologies when you visit our website.
        Cookies are small text files stored on your device that help us provide a better experience.
      </p>

      <h2 className="text-xl font-bold text-foreground mb-6">Types of Cookies We Use</h2>
      <div className="space-y-4 mb-10">
        {cookieTypes.map(({ icon: Icon, title, desc, always }) => (
          <Card key={title}>
            <CardContent className="pt-6 flex gap-4">
              <div className="p-3 bg-accent/10 rounded-lg h-fit"><Icon className="h-5 w-5 text-accent" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  {always && <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">Always Active</span>}
                </div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">How to Manage Cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Most web browsers allow you to control cookies through their settings. You can typically find these settings in the "Options" or "Preferences" menu of your browser. You can set your browser to block or alert you about cookies, but some parts of the site may not work properly if you do so.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">Third-Party Cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Some cookies are placed by third-party services that appear on our pages. We use services like Google Analytics for traffic analysis and payment gateways for secure transactions. These third parties have their own privacy policies governing how they use your data.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">Updates to This Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
          </p>
        </div>
      </div>

      <div className="mt-10 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground"><strong className="text-foreground">Questions?</strong> Contact us at <a href="mailto:privacy@eylace.com" className="text-accent hover:underline">privacy@eylace.com</a></p>
      </div>
    </section>
  </Layout>
);

export default CookiePolicy;
