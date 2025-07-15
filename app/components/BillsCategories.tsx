import React from "react";
import BillProviderCard from "./BillsProviders";

interface BillCategorySectionProps {
  title: string;
  link?: string;

  icon: React.ReactNode;
  providers: any[];
}

const BillCategorySection: React.FC<BillCategorySectionProps> = ({
  title,
  link,
  icon,
  providers,
}) => {
  return (
    <div className="mb-12 ">
      <div  className="flex items-center gap-2 mb-6">
        {icon}
        <h2 id={link} className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider, index) => (
          <BillProviderCard key={index} provider={provider} />
        ))}
      </div>
    </div>
  );
};

export default BillCategorySection;
