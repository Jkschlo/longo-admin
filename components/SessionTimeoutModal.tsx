"use client";

import { AlertCircle, Clock } from "lucide-react";

interface SessionTimeoutModalProps {
  visible: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutModal({
  visible,
  timeRemaining,
  onExtend,
  onLogout,
}: SessionTimeoutModalProps) {
  if (!visible) return null;

  // Calculate time directly from prop to ensure accuracy
  const totalSeconds = Math.max(0, Math.ceil(timeRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const displaySeconds = totalSeconds % 60;
  const formattedTime = `${minutes}:${displaySeconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Session Timeout Warning
              </h2>
              <p className="text-sm text-gray-500">
                Your session is about to expire
              </p>
            </div>
          </div>

          {/* Message */}
          <p className="text-gray-700 mb-6">
            You&apos;ve been inactive for a while. Your session will expire in{" "}
            <span className="font-semibold text-[#0A2C57]">{formattedTime}</span>{" "}
            for security reasons. Would you like to continue your session?
          </p>

          {/* Countdown Display */}
          <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-2xl font-mono font-bold text-[#0A2C57]">
              {formattedTime}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onExtend}
              className="flex-1 px-4 py-2.5 bg-[#0A2C57] text-white rounded-lg font-medium hover:bg-[#0a1f3f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A2C57] focus:ring-offset-2"
            >
              Continue Session
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

