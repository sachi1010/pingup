import React, { useEffect, useState } from 'react'
import { assets, dummyPostsData } from '../assets/assets'
import Loading from '../components/Loading'
import Storiesbar from '../components/Storiesbar'
import PostCard from '../components/PostCard'
import Recentmessage from '../components/Recentmessage'

const Feed = () => {


  const [feeds,setFeeds] = useState([])
  const [loading, setLoading] = useState(true)


  const fetchfeeds = async () =>{
    setFeeds(dummyPostsData)
    setLoading(false)
  }

  useEffect(()=>{
    fetchfeeds()
  },[])

  return !loading ? (
    <div className='h-full overflow-y-scroll no scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8'>
        {/* stories and post list */}
        <div>
          <Storiesbar/>
          <div className='p-4 space-y-6'>
              {feeds.map((post) => (
                <PostCard key={post._id} post={post}/>
              ))}
          </div>
        </div>

        {/* right sidebar */}
        <div className='max-xl:hidden sticky top-0'>
            <div className='max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow'>
              <h3 className='text-slate-800 font-semibold'>Sponsored</h3>
              <img src={assets.sponsored_img} alt="" className='w-75 h-50 rounded-md'/>
              <p className='text-slate-600'>Email marketing</p>
             <p className='text-slate-400'>Reach your audience with targeted email campaigns that drive results.</p>

            </div>
            <Recentmessage/>
        </div>
    </div>
  ) : <Loading/>
}

export default Feed