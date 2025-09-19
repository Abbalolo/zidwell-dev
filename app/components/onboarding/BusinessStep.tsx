import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Building,
  Briefcase,
  Globe,
  MapPin,
  FileText,
  Hash,
  ArrowLeft,
  ArrowRight,
  SkipForward,
} from "lucide-react";
import { Textarea } from "../ui/textarea";

interface BusinessData {
  businessName: string;
  role: string;
  businessAddress: string;
  businessCategory: string;
  businessDescription: string;
  taxId: string;
  registrationNumber: string;
}

interface BusinessStepProps {
  data: BusinessData;
  onUpdate: (data: Partial<BusinessData>) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const industries = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "E-commerce",
  "Manufacturing",
  "Consulting",
  "Education",
  "Real Estate",
  "Marketing & Advertising",
  "Other",
];

export const BusinessStep = ({
  data,
  onUpdate,
  onNext,
  onPrev,
  onSkip,
}: BusinessStepProps) => {
  const handleInputChange = (field: keyof BusinessData, value: string) => {
    onUpdate({ [field]: value });
  };

  const isFormComplete =
    data.businessName &&
    data.role &&
    data.businessCategory &&
    data.businessAddress &&
    data.businessDescription &&
    data.registrationNumber &&
    data.taxId;

  return (
    <div className="">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Business Information</h2>
        <p className="text-muted-foreground">
          Tell us about your business (optional – you can skip this step)
        </p>
      </div>

      <div className=" grid md:grid-cols-2 gap-3">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="businessName"
              placeholder="Acme Corporation"
              className="pl-10"
              value={data.businessName}
              onChange={(e) =>
                handleInputChange("businessName", e.target.value)
              }
            />
          </div>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Your Role</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="role"
              placeholder="CEO, Developer, Manager, etc."
              className="pl-10"
              value={data.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
            />
          </div>
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={data.businessCategory}
            onValueChange={(value) =>
              handleInputChange("businessCategory", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Business Address */}
        <div className="space-y-2">
          <Label htmlFor="businessAddress">Business Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="businessAddress"
              placeholder="123 Main Street, Lagos"
              className="pl-10"
              value={data.businessAddress}
              onChange={(e) =>
                handleInputChange("businessAddress", e.target.value)
              }
            />
          </div>
        </div>

       

        {/* Registration Number */}
        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="registrationNumber"
              placeholder="CAC123456"
              className="pl-10"
              maxLength={8}
              value={data.registrationNumber}
              onChange={(e) =>
                handleInputChange("registrationNumber", e.target.value)
              }
            />
          </div>
        </div>

        {/* Tax ID */}
        <div className="space-y-2">
          <Label htmlFor="taxId">Tax Identification Number</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="taxId"
              placeholder="TIN123456"
              className="pl-10"
              value={data.taxId}
              maxLength={8}
              onChange={(e) => handleInputChange("taxId", e.target.value)}
            />
          </div>
        </div>

        {/* Website (Optional) */}
        {/* <div className="space-y-2">
          <Label htmlFor="website">Company Website (Optional)</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="website"
              placeholder="https://example.com"
              className="pl-10"
              value={data.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
            />
          </div>
        </div> */}
      </div>

       {/* Business Description */}
        <div className="space-y-2">
          <Label htmlFor="businessDescription">Business Description</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="businessDescription"
              placeholder="Briefly describe your business"
              className="pl-10"
              value={data.businessDescription}
              onChange={(e) =>
                handleInputChange("businessDescription", e.target.value)
              }
            />
          </div>
        </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button
          variant="outline"
          onClick={onPrev}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip for now
          </Button>

          {isFormComplete && (
            <Button
              onClick={onNext}
             className="bg-[#C29307] hover:opacity-100 transition-smooth"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
