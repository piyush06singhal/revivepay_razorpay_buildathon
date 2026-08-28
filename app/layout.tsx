import './globals.css';

export const metadata = {
  title: 'RevivePay — AI Agent for Revenue Recovery (Razorpay Buildathon 2026)',
  description: 'Autonomous AI Agent for recovering revenue from failed payments, abandoned checkouts, and overdue invoices.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
