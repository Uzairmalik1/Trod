"use client"
import React, { useRef, useState } from "react";
import { FaBars, FaChevronDown, FaTimes } from "react-icons/fa";
import { IoVideocamOutline, IoTextOutline } from "react-icons/io5";
import { MdAutoFixHigh, MdTranslate, MdOutlineEdit } from "react-icons/md";
import { BsScissors, BsCameraReels } from "react-icons/bs";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const dropdownList = [
    {
      icon: <BsScissors size={22} />,
      title: "Turn long video to short(s)",
      description: "AI auto-extracts key moments from long videos to create engaging short clips.",
      link: "/"
    },
    {
      icon: <MdAutoFixHigh size={22} />,
      title: "Create Faceless videos",
      description: "Generate professional videos without showing your face. AI creates the images.",
      link: "/"
    },
    {
      icon: <BsCameraReels size={22} />,
      title: "Auto B-roll",
      description: "Elevate your videos with relevant B-roll footage, automatically selected by AI.",
      link: "/"
    },
    {
      icon: <IoTextOutline size={22} />,
      title: "Add subtitles with AI",
      description: "AI adds subtitles automatically. Edit them with different styles.",
      link: "/"
    },
    {
      icon: <MdOutlineEdit size={22} />,
      title: "Clip maker",
      description: "Create sharable clips from long videos for TikTok, YouTube, and more.",
      link: "/"
    },
    {
      icon: <MdTranslate size={22} />,
      title: "Translate subtitles",
      description: "AI translates your subtitles for international reach.",
      link: "/"
    }
  ]

  // Function to handle mouse enter
  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  // Function to handle mouse leave with a delay
  const handleMouseLeave = () => {
    setTimeout(() => {
      if (dropdownRef.current && !dropdownRef.current.matches(":hover")) {
        setIsOpen(false);
      }
    }, 200);
  };

  return (
    <nav className="flex justify-center items-center w-full py-[1.7rem] mt-4 md:mt-2 sm:mt-4">
      <div className="flex items-center justify-between w-[22rem] sm:w-[30rem] md:w-[56rem] max-w-[56rem] px-1 py-1 rounded-full bg-[#14061f] shadow-lg">
        {/* Logo */}
        <Link href={"/"} className="flex items-center gap-2 pl-4">
          <Image src={"/trod_white.png"} alt="logo" className="text-white" width={100} height={60} />
          {/* <h1 className="text-white text-lg font-semibold">Editur</h1> */}
        </Link>

        {/* Nav Links */}
        <ul className="hidden md:flex items-center gap-6 text-white text-sm">
          <li className="flex items-center gap-1 cursor-pointer hover:bg-gray-100/25 rounded-lg p-2 px-3 font-medium text-base" 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}>
            Our Product <FaChevronDown size={12} />
          </li>
          <Link href={"/pricing"} className="cursor-pointer font-medium text-base hover:bg-gray-100/25 rounded-lg p-2 px-3">Pricing</Link>
          <Link href={"/affiliates"} className="cursor-pointer font-medium text-base hover:bg-gray-100/25 rounded-lg p-2 px-3">Affiliates</Link>
          <Link href={"/guides"} className="cursor-pointer font-medium text-base hover:bg-gray-100/25 rounded-lg p-2 px-3">Guides</Link>

        </ul>

        {/* CTA Button */}
        <div className="hidden md:flex items-center gap-2">
          <Link href={"/login"} className="cursor-pointer text-white font-medium text-base hover:bg-gray-100/25 rounded-lg p-2 px-3">Log in</Link>
          <Link href={"sign-up"} className="bg-purple-600 text-white font-bold px-6 py-3 rounded-full shadow-md hover:bg-purple-400">
            Try for free
          </Link>
        </div>

        {/* ✅ Mobile Menu Toggle */}
      <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-white text-2xl pr-4">
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

       {/* ✅ Mobile Menu */}
       {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-24 w-[22rem] sm:w-[30rem] max-w-[30rem] bg-[#1F0936] py-8 flex flex-col items-center rounded-lg shadow-md z-50"
        >
          <ul className="flex flex-col items-center gap-6 text-white text-lg">
            <li className="flex items-center gap-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
              Our Product <FaChevronDown size={14} />
            </li>
            <Link href={"/pricing"}>Pricing</Link>
            <Link href={"/affiliates"}>Affiliates</Link>
            <Link href={"/guides"}>Guides</Link>
            <Link href={"/login"}>Log in</Link>
          </ul>
          <Link
            href={"/sign-up"}
            className="mt-6 bg-gradient-to-r from-yellow-200 to-[#ffb800e6] text-black font-bold px-6 py-3 rounded-full shadow-md"
          >
            Try for free
          </Link>
        </motion.div>
      )}

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-40 md:top-24 mt-1 w-[22rem] sm:w-[30rem] md:w-[56rem] bg-[#1F0936] border border-[#7725C4] shadow-lg rounded-xl p-5 text-white z-50"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={handleMouseLeave}
          >
            <h3 className="text-xl text-gray-100 mb-4 border-b-2 border-gray-800/80 pb-2">
              Tools to help you go viral in no time.
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4 border-b-2 border-gray-800/80 pb-2">
              {dropdownList.map((list, index) => (
                <FeatureItem
                key={index}
                icon={list.icon}
                title={list.title}
                description={list.description}
                link={list.link}
              />
              ))}

            </div>
            <div className="mt-4 flex items-center justify-between">
              <button className="bg-gradient-to-r from-yellow-200 to-[#ffb800e6] hover:bg-[#ffb800e6] text-black font-bold px-4 py-2 rounded-full">
                View all features
              </button>
              <div className="flex gap-6 text-sm">
                <Link href="#" className="text-gray-400 hover:text-white">
                  Changelog <span className="bg-red-500 text-xs px-2 py-1 rounded-full">10</span>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white">
                  Roadmap
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};


// ✅ Define TypeScript Props for FeatureItem
interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, link }) => (
  <Link href={link} className="flex items-start gap-3 cursor-pointer py-4 px-5 hover:bg-gray-300/20 rounded-xl">
    <div className="text-gray-400 p-2 border border-blue-800 bg-[#170627] rounded-lg">{icon}</div>
    <div>
      <h4 className="text-lg font-medium pb-2 text-blue-500/75">{title}</h4>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  </Link>
);

export default Navbar;
