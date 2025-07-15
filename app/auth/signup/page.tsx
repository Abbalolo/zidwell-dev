"use client";
import Swal from 'sweetalert2'
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import logo from "/public/zidwell-logo.png";
import { auth, db } from "@/app/firebase/firebaseAuth";


export default function page() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const { firstName, lastName, email, phone, password, confirmPassword } = formData;

    if (!firstName) newErrors.firstName = "Please enter your first name.";
    if (!lastName) newErrors.lastName = "Please enter your last name.";
    if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) newErrors.email = "Invalid email.";
    if (!phone || phone.length !== 11) newErrors.phone = "Phone number must be 11 digits.";
    if (!password) newErrors.password = "Please enter a password.";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    if (!acceptTerms) newErrors.terms = "You must accept the terms.";

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const { firstName, lastName, email, password, phone } = formData;

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await sendEmailVerification(user, {
        url: "http://localhost:3000//auth/authentication-action",
        handleCodeInApp: true,
      });

      await updateProfile(user, { displayName: `${firstName} ${lastName}` });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        zidCoin: 30,
        subscription: "inActive",
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });

      console.log({ title: "Please verify your email to access the app." });
        Swal.fire({
  title: "Check your email to verify your account",
  text: "Please verify your email to access the app",
  icon: "success"
});
      router.push("/auth/login");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        Swal.fire({
  title: "Oops?",
  text: "Email is already in use.",
  icon: "warning"
});
        console.log({ variant: "destructive", title: "Email is already in use." });
      } else {
        Swal.fire({
icon: "error",
  title: "Oops...",
  text: "An error occurred during sign-up.",
});
        console.log({ variant: "destructive", title: "An error occurred during sign-up." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8 fade-in">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Image src={logo} alt="Zidwell Logo" width={32} height={32} className="mr-2" />
            <h1 className="font-bold text-lg">Zidwell</h1>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join Zidwell to start paying your bills easily</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
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
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="terms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
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
            {errors.terms && <p className="text-sm text-red-500">{errors.terms}</p>}
            <Button type="submit" className="w-full bg-[#C29307]" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
