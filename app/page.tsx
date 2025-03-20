import React from 'react'
import BgImage from '@/components/BgImage'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import ScrollingLogos from '@/components/ScrollingLogos'
import CreatorsSection from '@/components/CreatorsSection'
import ComparisonSection from '@/components/ComparisonSection'
import Footer from '@/components/Footer'

const page = () => {
  return (
    <div className='relative h-screen bg-[#010C0A] pt-6 px-2 sm:px-4 md:px-6 overflow-x-hidden'>
      <BgImage />
      <div className='relative items-center z-10'>
      <Navbar />
      </div>
        
      <div className='relative items-center  pb-20'>
        <Hero />
      </div>
      {/* ✅ Scrolling Logos Positioned Below Hero */}
      <div className='relative mt-12 sm:mt-16 md:mt-20 lg:mt-24 pb-32'>
        <ScrollingLogos />
      </div>
      <div>
        <CreatorsSection />
      </div>
      <div>
        <ComparisonSection />
      </div>
      <div className='w-full'>
        <Footer />
      </div>
    </div>
  )
}

export default page