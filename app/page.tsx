import CallPanel from './CallPanel';

export default function Page() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-xl flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Talk to our AI assistant</h1>
        <p className="mt-2 opacity-70">Enter your number and our AI will call you in seconds.</p>
      </div>
      <CallPanel />
    </main>
  );
}