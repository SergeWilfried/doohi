'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createCheckoutSession } from '@/app/actions/stripe';
import { CURRENCY } from '@/utils/StripeConfig';

interface DonateProps {
  amountRaised: number;
  goal: number;
  daysLeft?: number;
  donations?: number;
}

const Donate: React.FC<DonateProps> = ({
  amountRaised,
  goal,
  daysLeft = 52,
  donations = 984,
}: DonateProps) => {
  // Calculate progress percentage
  const progressPercentage = (amountRaised / goal) * 100;
  
  // State management
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [processingButton, setProcessingButton] = useState<'oneTime' | 'monthly' | null>(null);
  
  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle donation amount selection
  const handleAmountSelect = (amount: number): void => {
    setSelectedAmount(amount);
  };

  // Handle payment submission
  const handlePayment = async (monthly: boolean): Promise<void> => {
    try {
      setLoading(true);
      setProcessingButton(monthly ? 'monthly' : 'oneTime');
      
      // Create FormData object with donation information
      const formData = new FormData();
      formData.append('uiMode', 'hosted');
      formData.append('customDonation', selectedAmount.toString());
      formData.append('currency', CURRENCY);
      formData.append('isRecurring', monthly ? 'true' : 'false');
      
      // Process checkout session
      const { url } = await createCheckoutSession(formData);
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.assign(url as string);
      } else {
        throw new Error('No redirect URL returned from checkout session creation');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('There was an error processing your donation. Please try again.');
    } finally {
      setLoading(false);
      setProcessingButton(null);
    }
  };

  // Handle custom amount input
  const handleCustomAmount = (): void => {
    const amount = prompt('Enter custom amount (USD):');
    if (amount) {
      const numAmount = parseInt(amount.replace(/[^0-9]/g, ''));
      if (!isNaN(numAmount) && numAmount > 0) {
        setSelectedAmount(numAmount);
      }
    }
  };

  return (
    <Card className="w-full max-w-md border rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header - Amount Raised */}
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              {formatCurrency(amountRaised)} <span className="text-lg font-normal text-gray-500">raised of {formatCurrency(goal)} goal</span>
            </h2>
          </div>
          
          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-4 bg-gray-100" />
          
          {/* Stats */}
          <div className="flex items-center justify-center text-sm">
            <span>{daysLeft} days left</span>
            <span className="mx-2">•</span>
            <span>{donations} donations</span>
          </div>
          
          {/* Donation Amount Options */}
          <div className="grid grid-cols-4 gap-2">
            <Button 
              variant="outline" 
              className={selectedAmount === 100 ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:bg-gray-50"}
              onClick={() => handleAmountSelect(100)}
              disabled={loading}
            >
              $100
            </Button>
            <Button 
              variant="outline" 
              className={selectedAmount === 500 ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:bg-gray-50"}
              onClick={() => handleAmountSelect(500)}
              disabled={loading}
            >
              $500
            </Button>
            <Button 
              variant="outline" 
              className={selectedAmount === 1000 ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:bg-gray-50"}
              onClick={() => handleAmountSelect(1000)}
              disabled={loading}
            >
              $1,000
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-300 hover:bg-gray-50"
              onClick={handleCustomAmount}
              disabled={loading}
            >
              Other
            </Button>
          </div>
          
          {/* Donation Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-6"
              onClick={() => handlePayment(false)}
              disabled={loading}
            >
              {processingButton === 'oneTime' ? "Processing..." : `Give ${formatCurrency(selectedAmount)} now`}
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-gray-300 hover:bg-gray-50 font-medium py-6"
              onClick={() => handlePayment(true)}
              disabled={loading}
            >
              {processingButton === 'monthly' ? "Processing..." : `Give ${formatCurrency(selectedAmount)} monthly`}
            </Button>
          </div>
          
          {/* Select Another Program Link */}
          <div className="text-center">
            <a href="#" className="text-gray-500 hover:underline font-medium">
              Select another program
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Donate;
