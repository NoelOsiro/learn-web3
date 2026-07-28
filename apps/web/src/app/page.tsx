export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Cashflow</h1>
        <p className="text-lg text-muted-foreground">
          Agricultural Management Platform
        </p>
        <div className="mt-8 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">Getting Started</h2>
          <p className="text-muted-foreground">
            Your production-ready MVP foundation is set up. Configure your environment variables to connect to Supabase.
          </p>
        </div>
      </div>
    </main>
  );
}
