import CheckoutForm from './CheckoutForm';

export default function PaymentElementComp(): JSX.Element {
  return (
    // eslint-disable-next-line tailwindcss/no-custom-classname
    <div className="page-container">
      <h1>Donate with Elements</h1>
      <p>Donate to our project 💖</p>
      <CheckoutForm />
    </div>
  );
}
