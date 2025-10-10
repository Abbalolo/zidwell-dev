"use client";

import { Label } from "./ui/label";

interface FileUploadProps {
  label: string;
  multiple?: boolean;
  accept?: string;
  onChange: (files: FileList | null) => void;
}

export default function FileUpload({
  label,
  multiple = false,
  accept,
  onChange,
}: FileUploadProps) {
  return (
    <div className="space-y-2">
      <Label className="">{label}</Label>

      <div className="w-full">
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={(e) => onChange(e.target.files)}
          className="block w-full text-sm  border border-gray-300 rounded-lg cursor-pointer bg-white file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-300 file:hover:text-white  hover:file:bg-gray-500"
        />
      </div>
    </div>
  );
}
