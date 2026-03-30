import { useState } from "react";

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
      const textarea = document.createElement("textarea");
      textarea.value = deployUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="bg-[#0f0f14] rounded-2xl p-8 w-full max-w-lg text-center border border-[#2a2a3a] shadow-xl">
        <h2 className="text-2xl font-semibold mb-3 text-white">
          🚀 Your project is live!
        </h2>

        <p className="text-base text-gray-300 mb-6">
          <span className="font-mono text-lg">{repoName}</span> deployed
          successfully.
        </p>

        <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg mb-6">
          <span className="flex-1 text-sm font-mono truncate text-white">
            {deployUrl}
          </span>

          <button
            onClick={handleCopy}
            className="text-sm px-3 py-1 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:bg-[#222]"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-[#1a1a1a] text-white border border-[#2a2a2a] text-base"
          >
            Close
          </button>

          <a
            href={deployUrl}
            target="_blank"
            className="flex-1 py-3 rounded-lg text-center text-white text-base bg-gradient-to-r from-indigo-500 to-cyan-500"
          >
            Visit →
          </a>
        </div>
      </div>
    </div>
  );
}
