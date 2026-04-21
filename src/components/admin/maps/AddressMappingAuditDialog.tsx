import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, Loader2, MapPinCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportToCSV } from '@/lib/csvExport';
import { BD_DISTRICT_LIST } from '@/data/bdDistrictCoords';

export interface AddressMappingAuditRow {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  status: string;
  addressText: string;
  issue: 'review' | 'unmatched';
  issueLabel: string;
  sourceField: string | null;
  suggestedDistrict: string | null;
  matchedAlias: string | null;
}

interface AddressMappingAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: AddressMappingAuditRow[];
  language: string;
  savingOrderId: string | null;
  onSaveFix: (orderId: string, district: string) => Promise<void>;
}

export const AddressMappingAuditDialog = ({
  open,
  onOpenChange,
  rows,
  language,
  savingOrderId,
  onSaveFix,
}: AddressMappingAuditDialogProps) => {
  const [selectedDistricts, setSelectedDistricts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setSelectedDistricts(Object.fromEntries(rows.map((row) => [row.id, row.suggestedDistrict || ''])));
  }, [open, rows]);

  const reviewCount = useMemo(() => rows.filter((row) => row.issue === 'review').length, [rows]);
  const unmatchedCount = useMemo(() => rows.filter((row) => row.issue === 'unmatched').length, [rows]);

  const labels = language === 'bn'
    ? {
        title: 'Address mapping audit',
        description: 'যেসব অর্ডারে জেলার তথ্য ফ্রি-ফর্ম বা অনুপস্থিত আছে সেগুলো এখানে রিভিউ/ফিক্স করতে পারবেন।',
        empty: 'সব অর্ডারের জেলা ঠিকভাবে ম্যাপ হয়েছে।',
        export: 'CSV Export',
        fix: 'Fix district',
        saving: 'Saving...',
        order: 'অর্ডার',
        customer: 'কাস্টমার',
        status: 'স্ট্যাটাস',
        address: 'ঠিকানা',
        detected: 'Detected',
        needsReview: 'Review',
        unmatched: 'Unmatched',
        chooseDistrict: 'জেলা সিলেক্ট করুন',
      }
    : {
        title: 'Address mapping audit',
        description: 'Review orders where district detection came from messy free-form text or could not be matched clearly.',
        empty: 'All orders are mapped cleanly to a district.',
        export: 'Export CSV',
        fix: 'Fix district',
        saving: 'Saving...',
        order: 'Order',
        customer: 'Customer',
        status: 'Status',
        address: 'Address',
        detected: 'Detected',
        needsReview: 'Review',
        unmatched: 'Unmatched',
        chooseDistrict: 'Choose district',
      };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPinCheck className="h-5 w-5 text-primary" />
            {labels.title}
          </DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-border bg-background text-foreground">
            <AlertTriangle className="h-3 w-3 text-warning" />
            {labels.needsReview}: {reviewCount}
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-border bg-background text-foreground">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            {labels.unmatched}: {unmatchedCount}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={() => exportToCSV(rows, [
              { key: 'orderNumber', label: 'Order Number' },
              { key: 'customerName', label: 'Customer' },
              { key: 'phone', label: 'Phone' },
              { key: 'status', label: 'Status' },
              { key: 'issue', label: 'Issue Type' },
              { key: 'sourceField', label: 'Detected From' },
              { key: 'suggestedDistrict', label: 'Suggested District' },
              { key: 'addressText', label: 'Address' },
            ], 'address-mapping-audit')}
            disabled={rows.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            {labels.export}
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-md border border-dashed border-border bg-muted/10 text-sm text-muted-foreground">
            {labels.empty}
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-1">
            {rows.map((row) => {
              const selectedDistrict = selectedDistricts[row.id] || '';

              return (
                <div key={row.id} className="rounded-md border border-border bg-muted/10 p-3">
                  <div className="grid gap-3 lg:grid-cols-[1.3fr_0.9fr_0.9fr_1.6fr_1fr]">
                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">{labels.order}</div>
                      <div className="text-sm font-semibold text-foreground">{row.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">{row.customerName} {row.phone ? `• ${row.phone}` : ''}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">{labels.status}</div>
                      <div className="text-sm font-medium capitalize text-foreground">{row.status || '—'}</div>
                      <Badge variant="outline" className="border-border bg-background text-foreground">{row.issueLabel}</Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">{labels.detected}</div>
                      <div className="text-sm font-medium text-foreground">{row.suggestedDistrict || '—'}</div>
                      <div className="text-[11px] text-muted-foreground">{row.sourceField || '—'}{row.matchedAlias ? ` • ${row.matchedAlias}` : ''}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">{labels.address}</div>
                      <div className="text-xs leading-5 text-foreground">{row.addressText || '—'}</div>
                    </div>

                    <div className="space-y-2">
                      <Select value={selectedDistrict} onValueChange={(value) => setSelectedDistricts((prev) => ({ ...prev, [row.id]: value }))}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={labels.chooseDistrict} />
                        </SelectTrigger>
                        <SelectContent>
                          {BD_DISTRICT_LIST.map((district) => (
                            <SelectItem key={district.name} value={district.name}>
                              {language === 'bn' ? district.nameBn : district.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() => onSaveFix(row.id, selectedDistrict)}
                        disabled={!selectedDistrict || savingOrderId === row.id}
                      >
                        {savingOrderId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPinCheck className="h-3.5 w-3.5" />}
                        {savingOrderId === row.id ? labels.saving : labels.fix}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};