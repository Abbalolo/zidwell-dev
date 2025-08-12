"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "../ui/button";

interface ContractsPreviewProps {
  isOpen: boolean;
  contract: {
    contract_title?: string;
    contract_text?: string;
    description?: string;
  } | null;
  onClose: () => void;
}

const ContractsPreview: React.FC<ContractsPreviewProps> = ({
  isOpen,
  contract,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !contract) return null;
  console.log("Contract Preview:", contract);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-lg overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {contract.contract_title || "Untitled Contract"}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        <p className="whitespace-pre-line text-sm text-gray-700">
          {contract.contract_text ||
            contract.description ||
            "No content available."}
        </p>
      </div>
    </div>
  );
};

export default ContractsPreview;
