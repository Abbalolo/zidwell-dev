import { X } from "lucide-react";
import React from "react";

function AdditionalInfoModal({setShowModal} : any) {
  return (
    <div
      data-aos="fade-down"
      className="flex justify-between items-center border border-red-400 rounded-md  py-5 px-5 b bg-red-50 shadow md:w-[60%]"
    >
      <div className="flex items-center text-sm gap-3 font-semibold">
        Complete your information to access transaction
        <span onClick={() => setShowModal(true)} className="cursor-pointer text-red-400 hover:underline">click here</span>
      </div>
     
    </div>
  );
}

export default AdditionalInfoModal;
