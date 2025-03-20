"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const beforeItems = [
  "Hours to days spent editing long videos",
  "requires dedicated video editors costing $3000+",
  "Manual scripting, voiceovers, and image sourcing",
  "Spend hours on manual captioning and formatting",
  "Manual translation needed for each language",
  "Manual uploading to each platform",
];

const afterItems = [
  "Generate auto-edited videos in minutes",
  "AI will work 24/7 for you at only $19",
  "AI-generated stories, voiceovers, and images",
  "Auto-captions with 20+ styles and multi-language support",
  "Auto-translate captions into 30+ languages instantly",
  "Schedule and publish on almost all platforms automatically",
];

const ComparisonSection = () => {
  return (
    <section className=" text-white py-16 px-4 sm:px-12 text-center">
      {/* Heading */}
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-3xl sm:text-5xl font-bold"
      >
        It used to take either effort, <br /> or cost a salary to have shorts like these made
      </motion.h2>

      {/* Subheading */}
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto"
      >
        Used to. With <span className="text-yellow-400 font-bold">Editur</span>, no more: our happy customers have called Editur their "secret weapon."
      </motion.p>

      {/* Comparison Table */}
      <div className="mt-10 flex flex-col lg:flex-row justify-center items-center gap-10">
        {/* Before Section */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="w-full max-w-md bg-gray-900 p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-xl font-semibold text-red-400 mb-4">Without Editur</h3>
          <div className="flex flex-col gap-4">
            {beforeItems.map((item, index) => (
              <motion.div 
                key={index} 
                className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg shadow-md"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-red-500 text-2xl">✖</span>
                <p className="text-sm text-gray-300">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* After Section */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-full max-w-md bg-gray-900 p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-xl font-semibold text-green-400 mb-4">With Editor</h3>
          <div className="flex flex-col gap-4">
            {afterItems.map((item, index) => (
              <motion.div 
                key={index} 
                className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg shadow-md"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-green-400 text-2xl">✔</span>
                <p className="text-sm text-gray-300">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
