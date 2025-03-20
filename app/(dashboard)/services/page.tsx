import HomeHeader from '@/components/HomeHeader'
import React from 'react'

const page = () => {
    return (
        <div>
            <HomeHeader pageName='Services' />
            <main className='p-10 w-full'>
                <h1 className='text-3xl'>this is the Services page</h1>
            </main>
        </div>
    )
}

export default page