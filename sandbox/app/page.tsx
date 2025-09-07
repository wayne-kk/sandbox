export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-background flex flex-col gap-12">
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Sandbox Project
        </h1>
        <p className="text-lg text-center text-gray-600 mb-8">
          This is a pre-built Next.js + shadcn/ui project template for v0-sandbox.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <ul className="space-y-2 text-sm">
            <li>• Edit this page in <code>app/page.tsx</code></li>
            <li>• Add new pages in the <code>app/</code> directory</li>
            <li>• Use shadcn/ui components from <code>components/ui/</code></li>
            <li>• Customize styles in <code>app/globals.css</code></li>
            <li>• Install packages with <code>npm install</code></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
