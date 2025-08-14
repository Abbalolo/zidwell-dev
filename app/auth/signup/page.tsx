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

import { Eye, EyeOff } from "lucide-react";
import logo from "@/public/logo.png";

import Carousel from "@/app/components/Carousel";

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
  const [showPin, setShowPin] = useState(false);
  const [showBvn, setShowBvn] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [isMobile, setIsMobile] = useState(false);

  const images = [
    "/zid-pic/image1.jpg",
    "/zid-pic/image2.jpg",
    "/zid-pic/image3.jpg",
    "/zid-pic/image4.jpg",
    "/zid-pic/image5.jpg",
    "/zid-pic/image6.jpg",
    "/zid-pic/image8.jpg",
    "/zid-pic/image9.jpg",
    "/zid-pic/image10.jpg",
    "/zid-pic/image11.jpg",
    "/zid-pic/image12.jpg",
    "/zid-pic/image13.jpg",
    "/zid-pic/image14.jpg",
    "/zid-pic/image15.jpg",
    "/zid-pic/image16.jpg",
    "/zid-pic/image17.jpg",
  ];
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

  const saveUserToSupabase = async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    walletId: string;
    bankAccountName: string;
    bankAccountNumber: string;
  }) => {
    try {
      const response = await axios.post("/api/save-user-db", userData);

      if (response.status === 200) {
        console.log("✅ User saved to Supabase");
      } else {
        console.error("❌ Supabase saving failed:", response.data.error);
      }
    } catch (error: any) {
      console.error("❌ API error:", error.response?.data || error.message);
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
      // await sendVerification(email);

      const paybetaData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone:phone.trim(),
        password,
        pin:pin.trim(),
        bvn:bvn.trim(),
      };

      console.log("data",paybetaData)

      const response = await axios.post(
        "/api/paybeta-auth-register",
        paybetaData
      );

      const userData: any = {
        email: response.data.emailAddress,
        first_name: response.data.firstName,
        last_name: response.data.lastName,
        phone: phone,
        walletId: response.data.walletId,
        bank_account_name: response.data.bankAccountName,
        bank_name: response.data.bankName,
        bank_account_number: response.data.bankAccountNumber,
      };

      // ✅ Save user data to Supabase (optional)
      await saveUserToSupabase(userData);

      console.log("✅ Paybeta response:", response.data);

      Swal.fire({
        title: "Successfully register account",
        icon: "success",
      });
      // setShowModal(true);
      router.push("/auth/login");
    } catch (error: any) {
      console.error("Registration error:", error.response?.data);

      if (error.response?.data.details?.errors.email) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.response?.data.details?.errors.email,
        });
      } else if (error.response?.data.details?.errors.bvn) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.response?.data.details?.errors.bvn,
        });
      } else if (error.response?.data.details?.errors.phone) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.response?.data.details?.errors.phone,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:flex lg:justify-between bg-gray-50 fade-in">
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
                 autoComplete="off"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}


              <Label htmlFor="pin">Transaction PIN</Label>
              <div className="relative">
                <Input
                  id="pin"
                  name="pin"
                  type={showPin ? "text" : "password"}
                  value={formData.pin}
                  onChange={handleChange}
                   autoComplete="off"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.pin && (
                <p className="text-sm text-red-500">{errors.pin}</p>
              )}

               <Label htmlFor="bvn">BVN</Label>
              <div className="relative">
                <Input
                  id="bvn"
                  name="bvn"
                  type={showBvn ? "text" : "password"}
                  value={formData.bvn}
                  onChange={handleChange}
                   autoComplete="off"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowBvn(!showBvn)}
                >
                  {showBvn ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
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
                   autoComplete="off"
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
              <Button type="button" className="bg-[#C29307]" onClick={nextStep}>
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
