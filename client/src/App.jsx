import React from 'react'
import {Route,Routes} from 'react-router-dom'
import Login from './pages/Login'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import Chatbox from './pages/Chatbox'
import Connections from './pages/Connections'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import Createpost from './pages/Createpost'
import {useUser,useAuth} from '@clerk/clerk-react'
import Layout from './pages/Layout'
import {Toaster} from 'react-hot-toast'
import { useEffect } from 'react'
const App = () => { 
   const {user} = useUser()
   const {getToken} = useAuth()

   useEffect(()=>{
        if (user) {
          getToken().then((token)=>console.log(token))
        }
   },[user])
  return (
    <>
    <Toaster/>
      <Routes>
        <Route path="/" element={!user ? <Login/> : <Layout/>} >
            <Route index element={<Feed/>} />
            <Route path='messages' element={<Messages/>} />
            <Route path='messages/:userId' element={<Chatbox/>} />
            <Route path='connections' element={<Connections/>} />
            <Route path='discover' element={<Discover/>} />
            <Route path='profile' element={<Profile/>} />
            <Route path='profile/:profileId' element={<Profile/>} />
            <Route path='create-post' element={<Createpost/>} />
        </Route>
      </Routes>
    </>
  )
}

export default App