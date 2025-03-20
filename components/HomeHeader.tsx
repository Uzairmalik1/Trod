import { GalleryThumbnails, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import ThemeToggle from './ThemeToggle'

const HomeHeader = ({pageName}: {pageName: string}) => {
  return (
    <header className="flex justify-between items-center bg-lightGray px-10 py-4 shadow-md z-10">
        <h6 className="text-lg font-medium ml-9 md:ml-0">{pageName}</h6>
        <div className="flex items-center gap-4">
          <Link href="/home/thumbnailtest" target="_blank" className="bg-bgWhite dark:text-white text-black px-2 py-1 rounded-md border border-slate-400/50 items-center gap-2 hidden sm:flex">
            <GalleryThumbnails size={20}/>
            Try ThumbnailTest
          </Link>
          <Link href="/help" className="text-gray-500 dark:text-gray-100 hover:text-gray-700">
            <HelpCircle size={24} />
          </Link>
          <ThemeToggle/>
        </div>
      </header>
  )
}

export default HomeHeader