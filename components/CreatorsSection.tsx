"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const features = [
  "Making $1,000s/mo from shorts",
  "Making more views, subscribers, etc",
  "With little to no extra effort",
];

const CreatorsSection = () => {
  return (
    <section className=" text-white py-16 px-4 sm:px-12 text-center">
      {/* Heading */}
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-2xl sm:text-5xl font-bold"
      >
        Here's the thing: <br />
        <span className="text-[#f5f5f5]">these creators are making shorts</span>
      </motion.h2>

      {/* Subheading */}
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="mt-4 text-2xl text-gray-300"
      >
        You could be like them. All these creators are:
      </motion.p>

      {/* Features */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-base sm:text-lg text-gray-400"
          >
            ✅ {feature}
          </motion.div>
        ))}
      </div>
      
      <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="mt-20 flex justify-center"
            >
                <video
                    src="/creaters.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-[93%] max-w-[1500px] "
                ></video>
            </motion.div>
      

      

    </section>
  );
};

export default CreatorsSection;
