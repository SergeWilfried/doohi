import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const Donate = ({
  amountRaised,
  goal,
  daysLeft = 52,
  donations = 984,
}) => {
  // Calculate progress percentage
  const progressPercentage = (amountRaised / goal) * 100;
  
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
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
            <Button variant="outline" className="border-emerald-600 hover:bg-emerald-50">$100</Button>
            <Button variant="outline" className="border-gray-300 hover:bg-gray-50">$500</Button>
            <Button variant="outline" className="border-gray-300 hover:bg-gray-50">$1,000</Button>
            <Button variant="outline" className="border-gray-300 hover:bg-gray-50">Other</Button>
          </div>
          
          {/* Donation Action Buttons */}
          <div className="space-y-3">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-6">
              Give $100 now
            </Button>
            <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50 font-medium py-6">
              Give $100 monthly
            </Button>
          </div>
          
          {/* Select Another Program Link */}
          <div className="text-center">
            <a href="#" className="text-gray-100 hover:underline font-medium">
              Select another program
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Donate;

