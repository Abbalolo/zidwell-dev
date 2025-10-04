import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { useUserContextData } from "@/app/context/userData";

interface ProfileData {
  // firstName: string;
  // lastName: string;
  // email: string;
  // phone: string;
  dateOfBirth: string;
}

interface ProfileStepProps {
  data: ProfileData;
  onUpdate: (data: Partial<ProfileData>) => void;
  onNext: () => void;
}

export const ProfileStep = ({ data, onUpdate, onNext }: ProfileStepProps) => {
   console.log("from profile", data)
  const [errors, setErrors] = useState<Partial<ProfileData>>({});
const {userData, setUserData} = useUserContextData()
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    onUpdate({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

    const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };


  const validateForm = () => {
    const newErrors: Partial<ProfileData> = {};

    // if (!data.firstName.trim()) newErrors.firstName = "First name is required";
    // if (!data.lastName.trim()) newErrors.lastName = "Last name is required";
    // if (!data.email.trim()) newErrors.email = "Email is required";
    // else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "Email is invalid";
    // if (!data.phone.trim()) newErrors.phone = "Phone number is required";

      if (!data.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else if (calculateAge(data.dateOfBirth) < 18) {
      newErrors.dateOfBirth = "You must be at least 18 years old";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  useEffect(() => {
  const stored = localStorage.getItem("userData");
  if (stored && !userData) {
    setUserData(JSON.parse(stored));
  }
}, []);

 

  return (
    <div className="space-y-6">
      
      {/* <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Personal Information</h2>
        <p className="text-muted-foreground">
          Please provide your personal details to get started
        </p>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            placeholder="John"
            disabled
            value={userData?.firstName}
            // onChange={(e) => handleInputChange("firstName", e.target.value)}
            // className={errors.firstName ? "border-destructive" : ""}
          />
          {/* {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName}</p>
          )} */}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            placeholder="Doe"
             disabled
            value={userData?.lastName}
            // onChange={(e) => handleInputChange("lastName", e.target.value)}
            // className={errors.lastName ? "border-destructive" : ""}
          />
          {/* {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName}</p>
          )} */}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
               disabled
              // className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
              className={`pl-10 `}
              value={userData?.email}
              // onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>
          {/* {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )} */}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /> 
            <Input
              id="phone"
              type="tel"
              placeholder="+234 (091) 123-4567"
               disabled
               className={`pl-10 `}
              // className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
              value={userData?.phone}
              // onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>
          {/* {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )} */}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="dateOfBirth"
              type="date"
              className={`pl-10 ${errors.dateOfBirth ? "border-destructive" : ""}`}
              value={data.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            />
          </div>
         {errors.dateOfBirth && (
            <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button onClick={handleNext} className="bg-[#C29307] hover:opacity-100 transition-smooth">
          Continue
        </Button>
      </div>
    </div>
  );
};