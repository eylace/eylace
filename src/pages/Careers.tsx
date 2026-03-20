import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Heart, GraduationCap, Coffee, MapPin, Clock } from 'lucide-react';

const perks = [
  { icon: Heart, title: 'Health Insurance', desc: 'Comprehensive medical coverage for you and your family' },
  { icon: GraduationCap, title: 'Learning Budget', desc: 'Annual budget for courses, conferences & books' },
  { icon: Coffee, title: 'Flexible Hours', desc: 'Work when you are most productive' },
  { icon: Briefcase, title: 'Career Growth', desc: 'Clear promotion paths and mentorship programs' },
];

const jobs = [
  { title: 'Senior Frontend Developer', dept: 'Engineering', type: 'Full-time', location: 'Dhaka' },
  { title: 'Product Manager', dept: 'Product', type: 'Full-time', location: 'Dhaka' },
  { title: 'UX/UI Designer', dept: 'Design', type: 'Full-time', location: 'Remote' },
  { title: 'Customer Success Lead', dept: 'Support', type: 'Full-time', location: 'Dhaka' },
  { title: 'Digital Marketing Specialist', dept: 'Marketing', type: 'Full-time', location: 'Dhaka' },
  { title: 'Data Analyst', dept: 'Data', type: 'Contract', location: 'Remote' },
];

const Careers = () => (
  <Layout>
    <section className="bg-primary text-primary-foreground py-16">
      <div className="container-main text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
        <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">Build the future of e-commerce in Bangladesh with us.</p>
      </div>
    </section>

    {/* Perks */}
    <section className="container-main py-12">
      <h2 className="text-2xl font-bold text-foreground text-center mb-8">Why Work at Eylace?</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {perks.map(({ icon: Icon, title, desc }) => (
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

    {/* Open Positions */}
    <section className="bg-muted/50 py-12">
      <div className="container-main">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">Open Positions</h2>
        <div className="space-y-4 max-w-3xl mx-auto">
          {jobs.map((job) => (
            <Card key={job.title}>
              <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{job.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="secondary">{job.dept}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{job.type}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                  </div>
                </div>
                <Button size="sm">Apply Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="container-main py-12 text-center">
      <h2 className="text-2xl font-bold text-foreground mb-3">Don't See Your Role?</h2>
      <p className="text-muted-foreground mb-6 max-w-lg mx-auto">We're always looking for talented people. Send us your resume and we'll keep you in mind.</p>
      <Button size="lg" variant="accent">Send Your Resume</Button>
    </section>
  </Layout>
);

export default Careers;
