'use client';

import HomeHeader from '@/components/HomeHeader';
import { motion } from 'framer-motion';
import { CheckCircle, PlayCircle, Video } from 'lucide-react';
import { useState } from 'react';

const Pricing = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const plans = [
        {
            icon: PlayCircle,
            name: 'Subtitles PRO',
            price: { monthly: 15, yearly: 12 },
            description: 'Add professional quality subtitles to your shorts, very quickly',
            features: [
                '100 subtitled Shorts / month',
                '1 min 30 max',
                '300 MB / video',
                'Import music and sound effects',
                'B-roll: Embed scenes in your videos',
                'Import your own images',
                'Video faceless: 4 per week',
            ],
        },
        {
            icon: Video,
            name: 'Advanced',
            price: { monthly: 23, yearly: 18 },
            description: 'Your shorts from long-from videos in just a few clicks',
            features: [
                'Everything in Subtitles PRO',
                '30 Shorts from long videos / month',
                'Auto-Crop to vertical format (9:16)',
                'AI Selection of the best moments',
                '2 min max',
                '1GB and 2 hours / long video',
                'Import long video by local file or YouTube link',
                'Video faceless: 10 per week',
            ],
        },
        {
            icon: Video,
            name: 'Expert',
            price: { monthly: 47, yearly: 38 },
            description: 'Create, plan, publish and save incredible amounts of time',
            features: [
                'Everything in Advanced',
                '100 Shorts from long videos / month',
                '3 min max',
                'Program & Publish to all platforms',
                'Analyze content performance',
                'Video faceless: 30 per week',
            ],
        },
    ];

    return (
        <>
            <HomeHeader pageName='Pricing' />
            <main className="p-10 w-full flex flex-col bg-bgWhite items-center">
                <h1 className="text-xl font-bold text-darkBrown mb-2">Pricing</h1>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center text-4xl font-bold text-darkBrown"
                >
                    What&apos;s the price of <span className="text-yellow">going viral?</span>
                </motion.h2>
                <p className="text-center text-base text-grayLight mt-2">
                    Whatever it is, Editur pays for itself. We&apos;re in the business of multiplying your income.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 px-3 py-2 border bg-lightGray shadow-md rounded-full">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-full font-semibold ${billingCycle === 'monthly' ? 'bg-yellow text-black' : 'bg-bgWhite text-grayLight hover:bg-yellow/85'} transition`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-full font-semibold ${billingCycle === 'yearly' ? 'bg-yellow text-black' : 'bg-bgWhite text-grayLight hover:bg-yellow/85'} transition`}
                    >
                        Yearly (-20%)
                    </button>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-8 w-full">
                    {plans.map((plan, index) => {
                        const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                                className="bg-lightGray shadow-md rounded-2xl border p-6 w-[20rem]"
                            >
                                <div className="flex flex-col">
                                    <plan.icon size={50} className="bg-[#2F2D35] text-white p-1  rounded-full" />
                                    <h3 className="text-xl font-bold mt-4">{plan.name}</h3>
                                    <p className="text-grayLight text-sm mt-2">{plan.description}</p>
                                </div>
                                <hr className="my-4 border-gray-300" />

                                <div className="">
                                    <span className="text-5xl font-bold text-grayDark">${price}</span>
                                    <span className="text-grayLight"> / month</span>
                                </div>
                                <button className="mt-4 bg-[#2F2D35] text-white text-lg  w-full py-3  rounded-full font-semibold hover:bg-[#28262d] transition">Get started</button>
                                <p className='text-center text-sm mt-2 text-grayLight'>Cancel anytime</p>
                                <hr className="my-4 border-gray-300" />
                                <ul className="mt-5 text-grayDark space-y-2 text-base">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex mb-4">
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                                                <path d="M11.667 4L5.25 10.417 2.334 7.5" stroke="#181818" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        );
                    })}

                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mt-12 bg-lightGray shadow-md rounded-2xl border p-6 w-full"
                >
                    <h3 className="text-xl font-bold text-grayDark mb-4">Entreprise Plan
                        ( + 100 Shorts / month )</h3>
                    <p className="text-grayLight mb-4">Need more than 100 videos per month? Contact us to give your organization the exact control, and support you need.</p>
                    <button className="bg-[#28262D] text-white py-2 px-3 rounded-full shadow-lg font-medium hover:bg-[#1d1c20] transition">Let&apos;s talk</button>
                    <hr className="my-4 border-gray-300" />
                    <div className='flex justify-evenly'>
                        <p className='flex gap-1 items-center text-grayLight'>
                            <CheckCircle />
                            Custom Shorts / month</p>
                        <p className='flex gap-1 items-center text-grayLight'>
                            <CheckCircle />
                            Entreprise-level support
                        </p>
                        <p className='flex gap-1 items-center text-grayLight'>
                            <CheckCircle />
                            Payment via invoice
                        </p>
                    </div>
                </motion.div>
            </main>
        </>
    );
};

export default Pricing;
