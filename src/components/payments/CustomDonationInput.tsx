import { Input } from '@/components/ui/input';
import { formatAmountForDisplay } from '@/utils/stripe-helpers';

export type CustomDonationInputProps = {
  name: string;
  min: number;
  max: number;
  step: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value: number;
  className?: string;
  currency: string;
};

export function CustomDonationInput({
  name,
  min,
  max,
  step,
  onChange,
  value,
  className,
  currency,
}: CustomDonationInputProps) {
  return (
    <label>
      <span id="donation-range-label">
        Custom donation amount (
        {formatAmountForDisplay(min, currency)}
        -
        {formatAmountForDisplay(max, currency)}
        ):
      </span>
      <Input
        type="range"
        aria-labelledby="donation-range-label"
        name={name}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        value={value}
        className={className}
      >
      </Input>
    </label>
  );
}
