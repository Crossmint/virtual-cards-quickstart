export function PoweredByCrossmint() {
  return (
    <a
      href="https://docs.crossmint.com/solutions/ai-agents/agent-wallets/overview"
      target="_blank"
      rel="noreferrer"
      aria-label="Powered by Crossmint"
      className="inline-block transition-opacity hover:opacity-80"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/powered-by-crossmint.svg"
        alt="Powered by Crossmint"
        className="h-8 w-auto"
      />
    </a>
  );
}
