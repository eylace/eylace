import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, DollarSign, Clock, Shield, CheckCircle } from 'lucide-react';

const benefits = [
  { icon: DollarSign, title: 'Competitive Pay', desc: 'Earn up to ৳25,000/month with flexible working hours and weekly payments.' },
  { icon: Clock, title: 'Flexible Schedule', desc: 'Choose your own hours — deliver when it suits you best.' },
  { icon: Shield, title: 'Insurance Coverage', desc: 'Accident and health insurance provided for all active delivery partners.' },
  { icon: Truck, title: 'Vehicle Support', desc: 'Fuel allowance and vehicle maintenance support for eligible partners.' },
];

const steps = [
  { num: '1', title: 'Apply Online', desc: 'Fill out the application form with your details and vehicle information.' },
  { num: '2', title: 'Verification', desc: 'We verify your documents and run a quick background check.' },
  { num: '3', title: 'Training', desc: 'Complete a short onboarding session to learn our delivery process.' },
  { num: '4', title: 'Start Delivering', desc: 'Get your first delivery assignment and start earning!' },
];

const DeliveryPartner = () => (
  <Layout>
    <section className="bg-primary text-primary-foreground py-16">
      <div className="container-main text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Become a Delivery Partner</h1>
        <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">Join Bangladesh's fastest-growing delivery network and earn on your own schedule.</p>
        <Button size="lg" variant="accent" className="mt-6">Apply Now</Button>
      </div>
    </section>

    <section className="container-main py-12">
      <h2 className="text-2xl font-bold text-foreground text-center mb-8">Why Partner With Us?</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="text-center">
            <CardContent className="pt-6">
              <Icon className="h-8 w-8 mx-auto mb-3 text-accent" />
              <p className="font-semibold text-foreground mb-1">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    <section className="bg-muted/50 py-12">
      <div className="container-main">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {steps.map(s => (
            <div key={s.num} className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-lg font-bold mx-auto mb-3">{s.num}</div>
              <p className="font-semibold text-foreground mb-1">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="container-main py-12">
      <h2 className="text-2xl font-bold text-foreground text-center mb-6">Requirements</h2>
      <div className="max-w-lg mx-auto space-y-3">
        {['Must be 18 years or older', 'Valid NID card', 'Own a bicycle, motorcycle, or van', 'Smartphone with internet access', 'Knowledge of local routes'].map(r => (
          <div key={r} className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
            <p className="text-sm text-foreground">{r}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Button size="lg" variant="accent">Start Your Application</Button>
      </div>
    </section>
  </Layout>
);

export default DeliveryPartner;
