export default function GlobalNotFound() {
  return (
    <html>
      <body className="flex h-screen items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
          <a href="/" className="text-blue-600 underline">Go Home</a>
        </div>
      </body>
    </html>
  );
}