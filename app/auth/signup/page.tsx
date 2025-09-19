import Carousel from "@/app/components/Carousel";
import RegisterForm from "@/app/components/RegisterForm";
import { Suspense } from "react";

export default function RegisterPage() {


  return (
    <div className="lg:flex lg:justify-between bg-gray-50 fade-in">
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterForm />
      </Suspense>

      <Carousel />
    </div>
  );
}
