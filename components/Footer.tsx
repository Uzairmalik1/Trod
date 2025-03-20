"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaTiktok, FaTwitter, FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { BsChatSquareText } from "react-icons/bs";

const Footer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className=" text-white py-16 px-4">
        <br />
      {/* Footer Wrapper */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Section */}
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4 ">
            <Image src="/logo.png" alt="Logo" width={30} height={30} />
            <span className="text-base font-semibold tracking-widest hover:text-gray-300">Editur</span>
          </Link>
          <p className="text-gray-300 max-w-sm">
            AI Shorts creator: automatically and instantly create viral shorts, with the power of AI. 0 skills required!
          </p>

          {/* Social Media Icons */}
          <div className="flex gap-4 mt-4">
            <Link href="https://www.tiktok.com/@trod.ai" target="_blank">
              <FaTiktok className="text-2xl hover:text-gray-400" />
            </Link>
            <Link href="https://x.com/trod_ai" target="_blank">
              <FaTwitter className="text-2xl hover:text-gray-400" />
            </Link>
            <Link href="https://www.instagram.com/trod.ai/" target="_blank">
              <FaInstagram className="text-2xl hover:text-gray-400" />
            </Link>
            <Link href="https://www.youtube.com/@Trod_AI" target="_blank">
              <FaYoutube className="text-2xl hover:text-gray-400" />
            </Link>
            <Link href="https://www.linkedin.com/company/trod-ai/" target="_blank">
              <FaLinkedin className="text-2xl hover:text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Right Section */}
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <h4 className="text-lg font-semibold mb-1">Company</h4>
            <Link href="/" className="inline-block text-gray-400 hover:text-white">Home</Link>
            <Link href="/pricing" className="inline-block text-gray-400 hover:text-white">Pricing</Link>
            <Link href="/affiliate" className="inline-block text-gray-400 hover:text-white">Affiliate Program</Link>
            <Link href="/guides" className="inline-block text-gray-400 hover:text-white">Guides</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-lg font-semibold mb-2">Product</h4>
            <Link href="/pricing" className="inline-block text-gray-400 hover:text-white">Pricing</Link>
            <Link href="/features" className="inline-block text-gray-400 hover:text-white">Features</Link>
            <Link href="/roadmap" className="inline-block text-gray-400 hover:text-white">Roadmap</Link>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-12 border-t border-gray-700 pt-6 text-gray-400 text-sm flex flex-col md:flex-row justify-between">
        <p>© 2025 Editur, All rights reserved.</p>
        <p>Need help? Call us: <Link href="tel:+123456789" className="text-yellow-400">+1 234  455 664</Link></p>
      </div>

      {/* Support Modal Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-yellow-400 text-black p-4 rounded-full shadow-lg hover:bg-yellow-500 transition-all"
      >
        <BsChatSquareText className="text-2xl" />
      </button>

      {/* Support & Feedback Modal */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-gray-900 p-6 rounded-lg max-w-lg w-full text-white relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <IoMdClose className="text-2xl" />
            </button>
            <h3 className="text-xl font-semibold mb-4">Support & Feedback</h3>
            <p className="text-gray-300 mb-4">
              You can expect a response from our 💛 lovely team 💛 within the next <strong>2 to 12 hours</strong>,
              but usually we're quicker than that!
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/contact" className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700">
                Contact Us
              </Link>
              <Link href="/roadmap" className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700">
                Submit Feedback or Suggestions
              </Link>
              <Link href="/report" className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700">
                Report a Bug or Technical Issue
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default Footer;
