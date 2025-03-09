import CheckoutForm from './CheckoutForm';

export default function PaymentElementComp(): JSX.Element {
  return (
    // eslint-disable-next-line tailwindcss/no-custom-classname
    <div className="page-container">
      <CheckoutForm uiMode="embedded" />
    </div>
  );
}
