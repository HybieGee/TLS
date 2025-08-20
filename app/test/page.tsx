import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-mono text-black mb-4">
          🎨 Test Page Works!
        </h1>
        <p className="text-lg font-mono text-gray-700 mb-8">
          The Living Sketchbook is coming together on Cloudflare Pages
        </p>
        <div className="space-x-4">
          <Link href="/" className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono">
            ← Back to Gallery
          </Link>
          <Link href="/create" className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono">
            Create →
          </Link>
        </div>
      </div>
    </div>
  );
}