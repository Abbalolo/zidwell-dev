// const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//   e.preventDefault();
//   const validationErrors = validateForm();
//   if (Object.keys(validationErrors).length > 0) {
//     setErrors(validationErrors);
//     return;
//   }

//   setLoading(true);
//   const { firstName, lastName, email, password, phone } = formData;

//   try {
//     const userCred = await createUserWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     const user = userCred.user;

//     // await sendEmailVerification(user, {
//     //   url: "http://localhost:3000//auth/authentication-action",
//     //   handleCodeInApp: true,
//     // });

//     await sendVerification(email);

//     await updateProfile(user, { displayName: `${firstName} ${lastName}` });

//     // await setDoc(doc(db, "users", user.uid), {
//     //   uid: user.uid,
//     //   email: user.email,
//     //   firstName: firstName.trim(),
//     //   lastName: lastName.trim(),
//     //   phone: phone.trim(),
//     //   zidCoin: 30,
//     //   subscription: "inActive",
//     //   emailVerified: false,
//     //   createdAt: new Date().toISOString(),
//     // });

//     console.log({ title: "Please verify your email to access the app." });
//     Swal.fire({
//       title: "Check your email to verify your account",
//       text: "Please verify your email to access the app",
//       icon: "success",
//     });
//     router.push("/auth/login");
//   } catch (error: any) {
//     if (error.code === "auth/email-already-in-use") {
//       Swal.fire({
//         title: "Oops?",
//         text: "Email is already in use.",
//         icon: "warning",
//       });
//       console.log({
//         variant: "destructive",
//         title: "Email is already in use.",
//       });
//     } else {
//       Swal.fire({
//         icon: "error",
//         title: "Oops...",
//         text: "An error occurred during sign-up.",
//       });
//       console.log({
//         variant: "destructive",
//         title: "An error occurred during sign-up.",
//       });
//     }
//   } finally {
//     setLoading(false);
//   }
// };

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//   event.preventDefault();
//   const newErrors: { [key: string]: string } = {};

//   if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
//     newErrors.email = "Please enter a valid email address";
//   }
//   if (!password) {
//     newErrors.password = "Please enter a password";
//   }

//   if (Object.keys(newErrors).length > 0) {
//     setErrors(newErrors);
//     return;
//   }

//   setLoading(true);
//   try {
//     const userCredential = await signInWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     const user = userCredential.user;

//     if (!user.emailVerified) {
//       await sendEmailVerification(user);
//       Swal.fire({
//         icon: "error",
//         title: "Oops...",
//         text: "Something went wrong!",
//         footer:
//           "You need to verify your email to log in. A verification email has been sent.",
//       });
//       setErrors({
//         email:
//           "You need to verify your email to log in. A verification email has been sent.",
//       });
//       setShowVerifyButton(true);
//       await signOut(auth);
//       return;
//     }

//     const userRef = doc(db, "users", user.uid);
//     // const admin = await checkAdminStatus();

//     // if (admin) {
//     //   Cookies.set("isAdmin", "true");
//     // }

//     await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });

//     setIsLogin(true);
//     setErrors({});
//     Swal.fire({
//       title: "Success!",
//       icon: "success",

//     });
//     router.push(redirectTo);
//     // Cookies.set("authToken", idToken, { path: "/", expires: 1 });
//   } catch (error: any) {
//     console.error(error.message);

//     // Firebase error codes: https://firebase.google.com/docs/auth/admin/errors
//     if (error.code === "auth/invalid-login-credentials") {
//       setErrors({ password: "Invalid email or password" });
//       Swal.fire({
//         icon: "error",
//         title: "Oops...",
//         text: "Invalid email or password",

//       });
//     } else {
//       setErrors({ password: "An unexpected error occurred" });
//       Swal.fire({
//         icon: "error",
//         title: "Oops...",
//         text: "Something went wrong!",
//         footer: "Please try again later.",
//       });
//     }
//   } finally {
//     setLoading(false);
//   }
// };
"use client";
import Swal from "sweetalert2";
import { useState, FormEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "/public/logo.png";
import { useRouter } from "next/navigation";
import mobileBg from "../../../public/zidwell-bg-mobile.jpg";
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
import { useUserContextData } from "@/app/context/userData";
import axios from "axios";
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

const Page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
 const [currentStep, setCurrentStep] = useState(1);
  

  const { login } = useUserContextData(); 
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
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Please enter a password";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });

      setErrors({});
      Swal.fire({
        title: "Login Successful!",
        icon: "success",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error.message);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message || "Something went wrong!",
        footer: "Please try again later.",
      });
      setErrors({ password: error.message || "Login error" });
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Image
              src={logo}
              alt="Zidwell Logo"
              width={32}
                height={32}
                className=" w-20 object-contain"
            />
            <h1 className="font-bold text-lg">Zidwell</h1>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your Zidwell account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                />
                <Label htmlFor="remember" className="text-sm">
                  Remember me
                </Label>
              </div>
              <Link
                href="/auth/password-reset"
                className="text-sm text-primary hover:text-primary/80"
              >
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              className="bg-[#C29307] w-full"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      </div>
       <Carousel slides={images} autoSlide />
     
    </div>
  );
};

export default Page;
