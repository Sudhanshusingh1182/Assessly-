import client from "@/graphql/apolloClient";
import { INSERT_CHAT_SESSION, INSERT_GUEST, INSERT_MESSAGE } from "@/graphql/mutations/mutations";
import { gql } from "@apollo/client";


async function startNewChat (
    guestName: string,
    guestEmail: string,
    chatbotId: number
 ){
    try {
       //1. Create a new guest entry
       const guestResult = await client.mutate({
         mutation: INSERT_GUEST,
         variables: {
            name : guestName, 
            email: guestEmail, 
            created_at :new Date().toISOString().replace('T', ' ').slice(0, -1)},
       });

       const guestId = guestResult.data.insertGuests.id;
       
       //2. Initialise a new chat session
       const chatSessionResult = await client.mutate({
        mutation: INSERT_CHAT_SESSION,
        variables: {
            chatbot_id: chatbotId, 
            guest_id: guestId, 
            created_at :new Date().toISOString().replace('T', ' ').slice(0, -1)
           },
       });

       const chatSessionId = chatSessionResult.data.insertChat_sessions.id;
       
       //3. Insert initial message 
       await client.mutate({
        mutation: INSERT_MESSAGE,
        variables: {
            chat_session_id: chatSessionId,
            sender: "ai",
            created_at :new Date().toISOString().replace('T', ' ').slice(0, -1),
            content: `Welcome ${guestName}! \n How can I assist you today? 😃`,
            
        }
       });

      // console.log("New chat session started successfully");
       return chatSessionId;
       


    } catch (error) {
        console.error("Error starting new chat session",error);
        
    }

}

export default startNewChat;