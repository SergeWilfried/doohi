import arcjet, {
  detectBot,
  shield,
  slidingWindow,
  validateEmail,
} from "@arcjet/next";
import { NextResponse } from "next/server";
import { Env } from "@/libs/Env";

const aj = arcjet({
  key: Env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
  characteristics: ["ip.src"], // Track requests by IP
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots. See https://arcjet.com/bot-list
      allow: [],
    }),
    validateEmail({
      mode: "LIVE",
      // Strict email validation to block disposable, invalid, free, and domains
      // with no valid MX records. Free emails include GMail, Hotmail, Yahoo,
      // etc, so you may wish to remove this rule
      block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS", "FREE"],
    }),
    // It would be unusual for a form to be submitted more than 5 times in 10
    // minutes from the same IP address
    slidingWindow({
      mode: "LIVE",
      interval: "10m", // counts requests over a 10 minute sliding window
      max: 5, // allows 5 submissions within the window
    }),
  ],
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, amount } = body;
    console.warn(amount);

    const decision = await aj.protect(request, { email });

    // Evaluate the various Arcjet checks
    if (decision.isDenied()) {
      if (decision.reason.isBot()) {
        console.error("Bot detected", decision);
        return NextResponse.json(
          { success: false, message: "Forbidden" },
          { status: 403 },
        );
      } else if (decision.reason.isRateLimit()) {
        console.error("Rate limit exceeded", decision);
        return NextResponse.json(
          { success: false, message: "Please try again in a few minutes" },
          { status: 429 },
        );
      } else if (decision.reason.isEmail()) {
        console.error("Invalid email", decision);
        return NextResponse.json(
          { success: false, message: "Invalid email address" },
          { status: 400 },
        );
      } else {
        console.error("Request denied", decision);
        return NextResponse.json(
          { success: false, message: "Forbidden" },
          { status: 403 },
        );
      }
    }

    // Arcjet Pro plan verifies the authenticity of common bots using IP data.
    // Verification isn't always possible, so we recommend checking the decision
    // separately.
    // https://docs.arcjet.com/bot-protection/reference#bot-verification

    if (decision.reason.isBot() && decision.reason.isSpoofed()) {
      console.log("Detected spoofed bot", decision.reason.spoofed);
      // Return a 403 or similar response
       return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    // Base Arcjet rules all passed, but we can do further inspection based on
    // our knowledge of our customers

    // Check if the IP address is from a hosting provider
    if (decision.ip.hasASN() && decision.ip.asnType === "hosting") {
      // The network this IP belongs to is a hosting provider, which makes it
      // more likely to be a VPN, proxy, or other suspicious network.
      console.error("Hosting provider detected", decision);
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    if (
      decision.ip.isHosting() ||
      decision.ip.isVpn() ||
      decision.ip.isProxy() ||
      decision.ip.isRelay()
    ) {
      // The IP is from a hosting provider, VPN, or proxy. We can check the name
      // of the service and customize the response
      if (decision.ip.hasService()) {
        if (decision.ip.service !== "Apple Private Relay") {
          // We trust Apple Private Relay because it requires an active iCloud
          // subscription, so deny all other VPNs
          console.error("VPN detected", decision);
          return NextResponse.json(
            { success: false, message: "Forbidden" },
            { status: 403 },
          );
        } else {
          // Apple Private Relay is allowed
          console.info("Apple Private Relay detected", decision);
        }
      } else {
        // The service name is not available, but we still think it's a VPN
        console.error("VPN detected", decision);
        return NextResponse.json(
          { success: false, message: "Forbidden" },
          { status: 403 },
        );
      }
    }

    // Only allow users from the US and UK
    if (
      decision.ip.hasCountry() &&
      !["US", "GB"].includes(decision.ip.country)
    ) {
      console.error("Country not allowed", decision);
      return NextResponse.json(
        { success: false, message: "This service is only available in the US and UK" },
        { status: 403 },
      );
    }

    console.info("Arcjet checks passed", decision.id);

    // This is where you would generate the checkout link. Return it to the form
    // component to redirect the user to the payment page. See
    // https://docs.stripe.com/checkout/quickstart?lang=node&client=next for an
    // example with Stripe Checkout

    return NextResponse.json({
      success: true,
      paymentLink: "https://www.example.com",
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
