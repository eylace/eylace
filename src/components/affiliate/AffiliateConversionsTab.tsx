import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface Props {
  conversions: any[];
}

const statusColor = (s: string) => {
  switch (s) {
    case 'approved': case 'paid': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
};

export const AffiliateConversionsTab = ({ conversions }: Props) => {
  if (!conversions.length) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 text-center text-muted-foreground">
          No conversions yet. Share your referral link to start earning!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Order Total</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversions.map(c => (
              <TableRow key={c.id}>
                <TableCell className="text-xs">{format(new Date(c.created_at), 'MMM dd, yyyy')}</TableCell>
                <TableCell>৳{c.order_total?.toFixed(2)}</TableCell>
                <TableCell className="font-medium text-accent">৳{c.commission_amount?.toFixed(2)}</TableCell>
                <TableCell><Badge className={statusColor(c.status)}>{c.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
