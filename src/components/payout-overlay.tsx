'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PayoutOverlay({ project, onClose, onPayout }: { project: any;onClose: any;onPayout: any }) {
  const [payoutMethod, setPayoutMethod] = useState('bank');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // In a real application, you would collect and validate all the form data here
    onPayout(project);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Request Payout for
            {project.title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Payout Amount</Label>
            <Input id="amount" name="amount" type="number" value={project.raised} readOnly />
          </div>
          <div>
            <Label htmlFor="payoutMethod">Payout Method</Label>
            <Select onValueChange={setPayoutMethod} defaultValue={payoutMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select payout method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="mobile">Mobile Money</SelectItem>
                <SelectItem value="wave">Wave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {payoutMethod === 'bank' && (
            <>
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input id="accountName" name="accountName" required />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" name="accountNumber" required />
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" name="bankName" required />
              </div>
              <div>
                <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
                <Input id="swiftCode" name="swiftCode" required />
              </div>
            </>
          )}
          {payoutMethod === 'mobile' && (
            <>
              <div>
                <Label htmlFor="mobileProvider">Mobile Money Provider</Label>
                <Input id="mobileProvider" name="mobileProvider" required />
              </div>
              <div>
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input id="mobileNumber" name="mobileNumber" type="tel" required />
              </div>
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input id="accountName" name="accountName" required />
              </div>
            </>
          )}
          {payoutMethod === 'wave' && (
            <>
              <div>
                <Label htmlFor="waveNumber">Wave Account Number</Label>
                <Input id="waveNumber" name="waveNumber" type="tel" required />
              </div>
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input id="accountName" name="accountName" required />
              </div>
            </>
          )}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Request Payout</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
