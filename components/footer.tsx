import Image from "next/image";

export function Footer() {
  return (
    <footer className="flex flex-col gap-4 items-center justify-center py-8 mt-auto border-t border-[rgba(0,0,0,0.06)]">
      <div className="flex gap-6 flex-wrap items-center justify-center text-sm text-[#00150d]/50">
        <a
          className="flex items-center gap-2 hover:text-[#00150d] transition-colors"
          href="https://github.com/Crossmint/virtual-cards-quickstart"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={14} height={14} />
          View code
        </a>
        <a
          className="flex items-center gap-2 hover:text-[#00150d] transition-colors"
          href="https://www.crossmint.com/quickstarts"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={14} height={14} />
          See all quickstarts
        </a>
        <a
          className="flex items-center gap-2 hover:text-[#00150d] transition-colors"
          href="https://crossmint.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={14} height={14} />
          Go to crossmint.com →
        </a>
      </div>
      <Image
        src="/crossmint-leaf.svg"
        alt="Powered by Crossmint"
        priority
        width={120}
        height={79}
      />
    </footer>
  );
}
