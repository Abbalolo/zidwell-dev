"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import logo from "/public/logo.png";
import mobileBg from "../../../public/zidwell-bg-mobile.jpg";
import ZidwellWelcomeModal from "@/app/components/ZidwellWelcome";
import Carousel from "@/app/components/Carousel";
import image1 from "../../../public/zid-pic/image1.jpg";
import image2 from "../../../public/zid-pic/image2.jpg";
import image3 from "../../../public/zid-pic/image3.jpg";
import image4 from "../../../public/zid-pic/image4.jpg";
import image5 from "../../../public/zid-pic/image5.jpg";
import image6 from "../../../public/zid-pic/image6.jpg";
import image8 from "../../../public/zid-pic/image8.jpg";
import image9 from "../../../public/zid-pic/image9.jpg";
import image10 from "../../../public/zid-pic/image10.jpg";
import image11 from "../../../public/zid-pic/image11.jpg";
import image12 from "../../../public/zid-pic/image12.jpg";
import image13 from "../../../public/zid-pic/image13.jpg";
import image14 from "../../../public/zid-pic/image14.jpg";
import image15 from "../../../public/zid-pic/image15.jpg";
import image16 from "../../../public/zid-pic/image16.jpg";
import image17 from "../../../public/zid-pic/image17.jpg";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    pin: "",
    bvn: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const stepHeaders: any = {
    1: {
      title: "Let’s get to know you!",
      subtitle:
        "Nigerians everywhere are using Zidwell to run their business… Welcome onboard",
    },
    2: {
      title: "A few more details",
      subtitle: "We need your phone number, BVN, and a transaction PIN.",
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

  const images = [
    image1,
    image2,
    image3,
    image4,
    image5,
    image6,
    image8,
    image9,
    image10,
    image11,
    image12,
    image13,
    image14,
    image15,
    image16,
    image17,
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      pin,
      bvn,
    } = formData;

    if (!firstName) newErrors.firstName = "Please enter your first name.";
    if (!lastName) newErrors.lastName = "Please enter your last name.";
    if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email))
      newErrors.email = "Invalid email.";
    if (!phone || phone.length !== 11)
      newErrors.phone = "Phone number must be 11 digits.";
    if (!password) newErrors.password = "Please enter a password.";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    if (!pin || pin.length < 4)
      newErrors.pin = "PIN must be at least 4 digits.";
    if (!bvn || bvn.length !== 11) newErrors.bvn = "BVN must be 11 digits.";
    if (!acceptTerms) newErrors.terms = "You must accept the terms.";

    return newErrors;
  };

  const sendVerification = async (email: string) => {
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Verification failed");
    } catch (err) {
      console.error("Verification error:", err);
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
    const { firstName, lastName, email, password, phone, bvn, pin } = formData;

    try {
      await sendVerification(email);

      const paybetaData = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
        pin,
        bvn,
      };

      const response = await axios.post(
        "/api/paybeta-auth-register",
        paybetaData
      );

      // console.log("✅ Paybeta response:", response.data);

      Swal.fire({
        title: "Check your email to verify your account",
        text: "Please verify your email to access the app",
        icon: "success",
      });
      // setShowModal(true);
      router.push("/auth/login");
    } catch (error: any) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );

      Swal.fire({
        icon: "error",
        title: "Oops...",
        text:
          error.response?.data?.error ||
          "An error occurred during sign-up. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:flex lg:justify-between bg-gray-50 min-h-screen fade-in">
      <div
        className="lg:w-[50%] flex justify-center px-6 py-8 fade-in bg-cover bg-center min-h-screen"
        style={
          isMobile
            ? {
                backgroundImage: `url(${mobileBg.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
      >
        <form
          data-aos="fade-down"
          onSubmit={handleSubmit}
          className="space-y-4 flex flex-col justify-center  w-full  p-6 md:border md:border-gray-200 rounded-lg md:shadow-md bg-white"
        >
          <div className="mb-8 text-center">
            {/* Logo and Brand */}
            <div className="flex items-center justify-center mb-2">
              <Image
                src={logo}
                alt="Zidwell Logo"
                width={32}
                height={32}
                className=" w-20 object-contain"
              />
              <h1 className="font-bold text-lg">Zidwell</h1>
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
                value={formData.email}
                onChange={handleChange}
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
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}

              <Label htmlFor="pin">Transaction PIN</Label>
              <Input
                id="pin"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
              />
              {errors.pin && (
                <p className="text-sm text-red-500">{errors.pin}</p>
              )}

              <Label htmlFor="bvn">BVN</Label>
              <Input
                id="bvn"
                name="bvn"
                value={formData.bvn}
                onChange={handleChange}
              />
              {errors.bvn && (
                <p className="text-sm text-red-500">{errors.bvn}</p>
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
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
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
              <Button type="button" onClick={nextStep}>
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

      <Carousel slides={images} autoSlide />
    </div>
  );
}
