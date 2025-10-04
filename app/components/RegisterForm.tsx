"use client";
import React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

import { Eye, EyeOff } from "lucide-react";
import logo from "@/public/logo.png";

import supabase from "@/app/supabase/supabase";

function RegisterForm() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  console.log(referralCode);

  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showBvn, setShowBvn] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize(); // Initial check
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Navigation handlers
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleNextStep = () => {
    const errors = validateCurrentStep();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return; // don’t go to next step if errors exist
    }
    setErrors({}); // clear errors if none
    nextStep();
  };

  const validateCurrentStep = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    const { firstName, lastName, email, phone, password, confirmPassword } =
      formData;

    if (currentStep === 1) {
      if (!firstName) newErrors.firstName = "Please enter your first name.";
      if (!lastName) newErrors.lastName = "Please enter your last name.";
      if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email))
        newErrors.email = "Invalid email.";
    }

    if (currentStep === 2) {
      if (!phone || phone.length !== 11)
        newErrors.phone = "Phone number must be 11 digits.";
    }

    if (currentStep === 3) {
      if (!password) newErrors.password = "Please enter a password.";
      if (password !== confirmPassword)
        newErrors.confirmPassword = "Passwords do not match.";
    }

    if (currentStep === 4) {
      if (!acceptTerms) newErrors.terms = "You must accept the terms.";
    }

    return newErrors;
  };

  const stepHeaders: any = {
    1: {
      title: "Let’s get to know you!",
      subtitle:
        "Nigerians everywhere are using Zidwell to run their business… Welcome onboard",
    },
    2: {
      title: "A few more details",
      subtitle: "We need your phone number",
    },
    3: {
      title: "Secure your account",
      subtitle: "Set up your password for a safe experience.",
    },
    4: {
      title: "Final step!",
      subtitle: "Accept our terms and you’re good to go 🚀",
    },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const { firstName, lastName, email, phone, password, confirmPassword } =
      formData;

    if (!firstName) newErrors.firstName = "Please enter your first name.";
    if (!lastName) newErrors.lastName = "Please enter your last name.";
    if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email))
      newErrors.email = "Invalid email.";
    if (!phone || phone.length !== 11)
      newErrors.phone = "Phone number must be 11 digits.";
    if (!password) newErrors.password = "Please enter a password.";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    if (!acceptTerms) newErrors.terms = "You must accept the terms.";

    return newErrors;
  };

  const saveToDatabase = async (userData: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    referred_by?: string;
  }) => {
    try {
      const res = await fetch("/api/save-pending-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();
      console.log("saveToDatabase response:", data);
      if (!res.ok) {
        // Stop execution by throwing
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    } catch (err: any) {
      console.error("saveToDatabase error:", err.message);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const { firstName, lastName, phone, email, password } = formData;

    try {
      // 1. Sign up user with Supabase Auth
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm-email`,
          },
        });

      if (signUpError) {
        Swal.fire({
          icon: "error",
          title: "Auth Error",
          text:
            signUpError.message === "Failed to fetch"
              ? "Network error, please try again later."
              : signUpError.message,
        });
        return;
      }

      const supabaseUserId = signUpData.user?.id;
      if (!supabaseUserId)
        throw new Error("User ID not returned from Supabase signup");

      // 2. Save user to your DB
      const userData = {
        id: supabaseUserId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        referred_by: referralCode || undefined,
      };

      await saveToDatabase(userData);

      Swal.fire({
        title: "Account Created!",
        text: "Please check your email and verify your account.",
        icon: "success",
      });

      router.push("/auth/login");
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: error.message || "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="lg:w-[50%] min-h-screen md:h-full flex justify-center  items-center px-6 md:py-8 fade-in bg-cover bg-center"
      style={
        isMobile
          ? {
              backgroundImage: `url("/zidwell-bg-mobile.jpg")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      <form
        data-aos="fade-down"
        onSubmit={handleSubmit}
        className="space-y-2 flex flex-col justify-center  w-full  p-6 md:border rounded-lg md:shadow-md bg-gray-50"
      >
        <div className="mb-8 text-center">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center mb-2">
            <Image
              src={logo}
              alt="Zidwell Logo"
              width={32}
              height={32}
              className="w-20 object-contain"
            />
            {/* <h1 className="font-bold text-lg">Zidwell</h1> */}
          </div>

          {/* Step Header */}
          <h2 className="md:text-2xl text-xl font font-semibold">
            {stepHeaders[currentStep].title}
          </h2>
          <p className=" text-gray-500 mt-1">
            {stepHeaders[currentStep].subtitle}
          </p>
        </div>
        {currentStep === 1 && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  autoComplete="off"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  autoComplete="off"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              autoComplete="off"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </>
        )}

        {currentStep === 2 && (
          <>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08*********"
              maxLength={11}
              autoComplete="off"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </>
        )}

        {currentStep === 3 && (
          <>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="*******"
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}

            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="*******"
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </>
        )}

        {currentStep === 4 && (
          <>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-primary underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-500">{errors.terms}</p>
            )}
          </>
        )}

        <div className="flex justify-between pt-4">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
          )}
          {currentStep < 4 ? (
            <Button
              type="button"
              className="bg-[#C29307]"
              onClick={handleNextStep}
            >
              Next
            </Button>
          ) : (
            <Button type="submit" className="bg-[#C29307]" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          )}
        </div>

        <div className="w-full md:text-end text-center">
          <Link
            href="/auth/login"
            className="text-sm hover:text-blue-500 hover:underline"
          >
            Login instead
          </Link>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm;
