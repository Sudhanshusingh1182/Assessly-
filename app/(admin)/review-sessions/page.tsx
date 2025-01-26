import ChatBotSessions from '@/components/ChatBotSessions';
import { GET_USER_CHATBOTS } from '@/graphql/queries/queries';
import { serverClient } from '@/lib/server/serverClient';
import {Chatbot, GetUserChatbotsResponse, GetuserChatbotsVariables } from '@/types/types';
import { auth } from '@clerk/nextjs/server'
import React from 'react'

 async function ReviewSessions() {
  
   const {userId}= await auth();

   if(!userId) return;
   
   const {data: {chatbotsByUser} }= 
      await serverClient.query<GetUserChatbotsResponse , GetuserChatbotsVariables>({
        query: GET_USER_CHATBOTS,
        variables: {
            userId,
        }
      });

      const sortedchatbotsByUser: Chatbot[] = chatbotsByUser.map((chatbot)=> ({
        ...chatbot,
        chat_sessions: [...chatbot.chat_sessions].sort(
            (a,b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        )
      }))

      
   
  return (
    <div className='flex-1 px-10' >
        <h1 className='text-xl lg:text-3xl font-semibold mt-10 ' >Chat Sessions</h1>
        <h2 className='mb-5'>
            Review all the chat sessions the chat bots have had with your customers.
        </h2>

        <ChatBotSessions chatbots={sortedchatbotsByUser} />

    </div>
  )
}

export default ReviewSessions