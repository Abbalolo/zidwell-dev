import Link from "next/link";
import React from "react";

interface ZidwellWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ZidwellWelcomeModal: React.FC<ZidwellWelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✖
        </button>

        <h2 className="text-2xl font-bold text-center text-green-700 mb-2">
          ✅ You're In — Almost!
        </h2>
        <p className="text-center text-sm text-gray-600 mb-4">
          Thanks for signing up with <span className="font-semibold">Zidwell Finance</span> 🥳🎉
        </p>

        <div className="text-sm text-gray-700 space-y-4">
          <p>
            Your account has been created and is now pending approval by our compliance team.
          </p>
          <p>
            Zidwell is an exclusive club. We verify every business before we let them in to reduce fraud and keep the platform secure for everyone.
          </p>
          <p>
            Once your account is approved, you’ll receive an email with a link to log in and start using our financial tools.
          </p>
          <p>
            📬 Until then, sit tight — you’re one step closer to managing your business finances better.
          </p>
          <p className="text-gray-500 text-sm">
            For inquiries, send an email to <a href="mailto:zidewell@gmail.com" className="text-blue-600 underline">zidewell@gmail.com</a>
          </p>

          <Link href="/" className="text-blue-600 underline">Back to landing page</Link>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400 italic">
          Zidwell — helping businesses grow faster.
        </div>
      </div>
    </div>
  );
};

export default ZidwellWelcomeModal;
