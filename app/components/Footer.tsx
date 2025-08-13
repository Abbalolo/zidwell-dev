import { Github, Twitter, Linkedin, Mail, Code } from "lucide-react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer data-aos="fade-down" className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center">
              <Image
                src="/logo.png"
                alt="Zidwell Logo"
                className="w-10 h-10 md:w-14 md:h-14 mr-2"
                width={500}
                height={500}
              />
              <h1 className="font-bold text-3xl">Zidwell</h1>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Easily and securely pay for everything from cable TV, airtime, and
              electricity to data bundles. Plus, access AI-powered accounting
              tools and generate professional invoices in minutes.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Bill Payment</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/dashboard/services/buy-cable-tv"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Cable TV{" "}
                </a>
              </li>
              <li>
                <a
                  href="/dashboard/services/buy-airtime"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Buy Airtime{" "}
                </a>
              </li>
              <li>
                <a
                  href="/dashboard/services/buy-data"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Buy Data Bundle{" "}
                </a>
              </li>
              <li>
                <a
                  href="/dashboard/services/buy-power"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Power Payment{" "}
                </a>
              </li>
              <li>
                <a
                  href="/dashboard/services/ai-accountant"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  AI Accountant
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>

            <div className="flex flex-col gap-2 ">
              <a
                href="#"
                className="hover:text-white text-gray-400 transition-colors"
              >
                Help center
              </a>
              <a
                href="#"
                className="hover:text-white text-gray-400 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="hover:text-white text-gray-400 transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex  justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Zidwell. All rights reserved.
            </p>

            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Linkedin className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
