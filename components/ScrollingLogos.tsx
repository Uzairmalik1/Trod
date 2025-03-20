"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const logos = [
  "/logos/elevenLabs.png",
  "/logos/google.png",
  "/logos/greens.png",
  "/logos/openai.png",
  "/logos/undp.png",
  "/logos/zetasoft.png",
];

const ScrollingLogos = () => {
  return (
    <div className="w-full overflow-hidden ">
      <motion.div
        className="flex space-x-20 items-center w-max"
        animate={{ x: ["0%", "-100%"] }}
        transition={{ repeat: Infinity, duration: 90, ease: "linear" }}
      >
        {/* Duplicating logos for seamless effect */}
        {[...logos, ...logos, ...logos].map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt="Platform Logo"
            className="w-[100px] "
          />
        ))}
      </motion.div>
    </div>
  );
};

export default ScrollingLogos;
