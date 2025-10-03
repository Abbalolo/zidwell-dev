"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { toast } from "@/components/ui/use-toast";

function AddUser() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const isNameValid = !!name;
    const isEmailValid =
      !!email && /^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email);
    const isPhoneValid = phone.length === 11;
    const isBirthDateValid = !!birthDate;
    const isPasswordValid = !!password;

    setIsFormValid(
      isNameValid &&
        isEmailValid &&
        isPhoneValid &&
        isBirthDateValid &&
        isPasswordValid
    );
  }, [name, email, phone, birthDate, password]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/addUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, phone, birthDate }),
      });
      const result = await response.json();

      if (response.ok) {
        console.log(result.message);
        setIsOpen(false);
        // Reset form fields
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setBirthDate("");
        toast({
          title: result.message
        })
      } else {
        console.error(result.message || "Failed to add user.");
        toast({
          variant: "destructive",
          title: result.message
        })
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        variant: "destructive",
        title: "error adding user",
      })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    {/* Dialog Trigger */}
    <Button onClick={() => setIsOpen(true)}>+ Add</Button>

    {/* Dialog */}
    {isOpen && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)} // Close dialog on overlay click
        ></div>

        <div className="relative bg-white dark:bg-gray-800 rounded-lg w-[90%] max-w-md p-6 shadow-lg">
          <h2 className="text-lg font-semibold">Create new user account</h2>
          <form
            onSubmit={handleAddUser}
            className="flex flex-col gap-4 pt-5 w-full"
          >
            {/* Name Field */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="name">Name</label>
              <input
                className="dark:border-slate-700 p-2 w-full outline-none border border-gray-300 rounded-md bg-transparent focus:border-black"
                type="text"
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email Field */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="email">Email</label>
              <input
                className="dark:border-slate-700 p-2 w-full outline-none border border-gray-300 rounded-md bg-transparent focus:border-black"
                type="email"
                id="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Phone Number Field */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="phone">Phone Number</label>
              <input
                className="dark:border-slate-700 p-2 w-full outline-none border border-gray-300 rounded-md bg-transparent focus:border-black"
                type="number"
                id="phone"
                placeholder="09133615893"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Date of Birth Field */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="birth">Date of Birth</label>
              <input
                type="date"
                id="birth"
                className="dark:border-slate-700 p-2 w-full outline-none border border-gray-300 rounded-md bg-transparent focus:border-black"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="password">Password</label>
              <div className="dark:border-slate-700 flex w-full items-center justify-between border border-gray-300 rounded-md">
                <input
                  className="outline-none p-2 bg-transparent w-full"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="m-2"
                >
                  {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-5">
              <Button
                className={`w-full ${
                  isFormValid ? "bg-black text-white" : "opacity-50"
                }`}
                type="submit"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? "Loading..." : "Sign Up"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}

export default AddUser;
