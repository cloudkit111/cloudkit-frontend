import { useState } from 'react';

type Props = {
  repoName: string;
  deployUrl: string;
  onClose: () => void;
};

export default function SuccessModal({ repoName, deployUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deployUrl);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = deployUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-[#1d1d1f]/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-lg text-center border border-[#e5e5e7] shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
        style={{
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
        }}
      >
        <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-3 text-[#1d1d1f]">
          🚀 Your project is live!
        </h2>

        <p className="text-base text-[#6e6e73] mb-6">
          <span className="font-mono text-lg text-[#1d1d1f]">{repoName}</span> deployed
          successfully.
        </p>

        <div className="flex items-center gap-3 bg-[#f5f5f7] border border-[#e5e5e7] p-3 rounded-lg mb-6">
          <span className="flex-1 text-sm font-mono truncate text-[#1d1d1f] text-left">
            {deployUrl}
          </span>

          <button
            onClick={handleCopy}
            className="text-[13px] font-medium px-3 py-1.5 rounded-full bg-white border border-[#e5e5e7] text-[#1d1d1f] transition-all duration-150 hover:bg-[#ececee] hover:border-[#c2c2c7]"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-[#f5f5f7] text-[#1d1d1f] border border-[#e5e5e7] text-[15px] font-medium transition-all duration-150 hover:bg-[#ececee]"
          >
            Close
          </button>

          <a
            href={deployUrl}
            target="_blank"
            className="flex-1 py-3 rounded-full text-center text-white text-[15px] font-medium bg-[#0071e3] transition-all duration-150 hover:bg-[#0077ed] active:scale-[0.97]"
          >
            Visit →
          </a>
        </div>
      </div>
    </div>
  );
}