"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const words = ["TikTok", "Instagram", "Reels", "Shorts"];
const typingSpeed = 100; // Speed for typing effect (in ms)
const deleteSpeed = 50; // Speed for deleting effect (in ms)
const delayBetweenWords = 1000; // Delay before starting next word

const Hero = () => {
    const [text, setText] = useState("");
    const [wordIndex, setWordIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [letterIndex, setLetterIndex] = useState(0);

    useEffect(() => {
        const currentWord = words[wordIndex];

        if (isDeleting) {
            if (letterIndex > 0) {
                setTimeout(() => {
                    setText(currentWord.substring(0, letterIndex - 1));
                    setLetterIndex(letterIndex - 1);
                }, deleteSpeed);
            } else {
                setIsDeleting(false);
                setWordIndex((prev) => (prev + 1) % words.length);
            }
        } else {
            if (letterIndex < currentWord.length) {
                setTimeout(() => {
                    setText(currentWord.substring(0, letterIndex + 1));
                    setLetterIndex(letterIndex + 1);
                }, typingSpeed);
            } else {
                setTimeout(() => setIsDeleting(true), delayBetweenWords);
            }
        }
    }, [text, isDeleting, wordIndex]);

    return (
        <section className="relative flex flex-col  items-center min-h-screen text-center text-white px-6">
            {/* Animated Text */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="mt-8 max-w-2xl text-left ml-0 md:ml-[-250px] sm:ml-[-250px]"
            >
                <img src="/auto.svg" alt="" />
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative text-[23px] sm:text-[38px] md:text-[43px]  font-bold leading-tight max-w-2xl"
            >
                Turn Long Videos Into Viral{" "}
                <span className="text-[#FFD700]">💰</span> Money-Making{" "}
                <span className="text-[#FFD700]">📈</span> <span className="block sm:inline-block">
                    {text}
                    <motion.span
                        className="inline-block w-[7px] h-[26px] sm:h-[30px] md:h-[45px] bg-white ml-1"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                </span>

            </motion.h1>

            {/* Subheading */}
            <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="mt-4 text-2xl font-medium text-gray-300 max-w-2xl"
            >
                It&apos;s like having a personal video editor. Cut, Edit, & Post on{" "}
                <span className="font-bold text-white">10+ social platforms</span> with{" "}
                <span className="font-bold text-white">22 other features</span> that make
                you money while you sleep.
            </motion.p>

            {/* CTA Button */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="mt-8"
            >
                <Link href={"/sign-up"} className="flex items-center gap-2 bg-yellow px-6 py-3 rounded-2xl text-black font-medium shadow-lg hover:bg-yellow-500">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white rounded-full">
                            <Image src="/logo.png" width={24} height={24} alt="Trod.ai" />
                        </div>
                        <div className="flex flex-col justify-start items-start">
                            <span className="font-semibold">Editur AI</span>
                            <span className="font-light text-sm">Online, 24/7</span>
                        </div>

                    </div>
                    <span className="bg-white px-2 py-3 rounded-xl text-sm font-medium">
                        Start earning. Get video in 1 min
                    </span>
                </Link>
            </motion.div>

            {/* Trusted Creators Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="mt-6 flex flex-col items-center"
            >
                <div className="flex gap-2">
                    <div className="flex -space-x-3">
                        <Image src="/azeem.jpg" width={45} height={45} className="rounded-full" alt="User 1" />
                        <Image src="/azeeem.jpg" width={45} height={45} className="rounded-full" alt="User 2" />
                        <Image src="/hasnain.jpg" width={45} height={45} className="rounded-full" alt="User 3" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-gray-300 text-sm font-semibold tracking-widest">Trusted by</p>
                        <p className="font-semibold text-lg text-gray-400">100k+ <span className="text-gray-100">Creators</span></p>
                    </div>
                </div>

                <p className="text-gray-400 text-sm mt-2">Try for free. No credit card required.</p>
            </motion.div>
            {/* ✅ Centered Video with Rounded Borders and Autoplay */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="mt-12 flex justify-center"
            >
                <video
                    src="/video.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-[93%] max-w-[1500px] rounded-3xl shadow-lg border-8 border-gray-700/60"
                ></video>
            </motion.div>
        </section>
    );
};

export default Hero;
