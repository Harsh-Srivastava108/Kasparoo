import "./globals.css";

export const metadata = {
  title: "AI Representation Optimizer | Kasparro",
  description:
    "Discover how AI shopping agents perceive your Shopify store. Get a detailed audit with prioritized improvements to boost your AI readiness and visibility.",
  keywords: "AI readiness, Shopify audit, AI representation, ecommerce optimization, structured data",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-effects" />
        <div className="bg-grid" />
        {children}
      </body>
    </html>
  );
}
