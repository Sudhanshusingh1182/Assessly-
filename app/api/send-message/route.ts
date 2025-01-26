// import { INSERT_MESSAGE } from "@/graphql/mutations/mutations";
// import { GET_CHATBOT_BY_ID, GET_MESSAGES_BY_CHAT_SESSION_ID } from "@/graphql/queries/queries";
// import { serverClient } from "@/lib/server/serverClient";
// import { GetChatbotByIdResponse, MessagesByChatSessionIdResponse } from "@/types/types";
// import { NextRequest, NextResponse } from "next/server";
// import OpenAI from "openai"
// import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// export async function POST (req: NextRequest){
//      const {chat_session_id, chatbot_id, content, name} = await req.json();

//      console.log(`
//         Received message from chat sessions ${chat_session_id}: ${content} {chatbot: ${chatbot_id}}
//         `);
     
//         try {
//             //step 1 : Fetch chatbot characteristics
//             const {data} = await serverClient.query<GetChatbotByIdResponse>({
//                 query: GET_CHATBOT_BY_ID,
//                 variables: {id: chatbot_id},
//             })

//             const chatbot = data.chatbots;

//             if(!chatbot){
//                 return NextResponse.json({error:"Chatbot not found"},{status:404});

//             }

//             //Step-2 : fetch previous messages
//             const {data:messagesData} =
//             await serverClient.query<MessagesByChatSessionIdResponse>({
//                 query: GET_MESSAGES_BY_CHAT_SESSION_ID,
//                 variables: {chat_session_id},
//                 fetchPolicy: "no-cache"
//             });

//             const previousMessages = messagesData.chat_sessions.messages;
            
//             const formattedPreviousMessages : ChatCompletionMessageParam[] = 
//              previousMessages.map((message) => ({
//                 role: message.sender === "ai" ? "system" : "user",
//                 name: message.sender === "ai" ? "system" : name,
//                 content: message.content,
//              }));

//              //combine characteristics into a system prompt
//              const systemPrompt = chatbot.chatbot_characteristics
//               .map((c)=>c.content)
//               .join(" + ")

//               console.log(systemPrompt);

//               const messages: ChatCompletionMessageParam[]= [
//                  {
//                     role: "system",
//                     name: "system",
//                     content: `You are a helpful assistant talking to ${name}. If a generic question is asked which is not relevant or in
//                      the same scope or domain as the points mentioned in the key information section, kindly inform the user they're 
//                      allowed to search for the specified content.Use Emoji's where possible. Here is some key information that you need 
//                      to be aware of ,these are elements you may be asked about : ${systemPrompt} `
//                  },
//                  ...formattedPreviousMessages,
//                  {
//                     role: "user",
//                     name: name,
//                     content: content,
//                  }
//               ]

//               //step-3 : Send the message to OpenAI's completions API
//               const openaiResponse = await openai.chat.completions.create({
//                 messages: messages,
//                 model:"gpt-4o"
//               });

//               const aiResponse = openaiResponse?.choices?.[0]?.message?.content?.trim();

//               if(!aiResponse){
//                 return NextResponse.json(
//                     { error: "Failed to generate AI response"},
//                     {status:500}
//                 );
//               }

//               //step-4 : Save the user's message in the database
//               await serverClient.mutate({
//                 mutation: INSERT_MESSAGE,
//                 variables: {chat_session_id,content,sender: "user"}
//               });

//               //Step-5 : Save the AI's response in the database
//               const aiMessageResult = await serverClient.mutate({
//                 mutation: INSERT_MESSAGE,
//                 variables: {chat_session_id, content:aiResponse, sender: "ai"},
//               });

//               //Step-6 : Return the AI's response to the Client
//               return NextResponse.json({
//                 id: aiMessageResult.data.insertMessages.id,
//                 content: aiResponse,
//               });
              
            
//         } catch (error) {
//             console.error("Error sending message:",error);
//             return NextResponse.json({error},{status:500});
            
//         }
// }


//For GeminiAI

import { INSERT_MESSAGE } from "@/graphql/mutations/mutations";
import { GET_CHATBOT_BY_ID, GET_MESSAGES_BY_CHAT_SESSION_ID } from "@/graphql/queries/queries";
import { serverClient } from "@/lib/server/serverClient";
import { GetChatbotByIdResponse, MessagesByChatSessionIdResponse } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};


export async function POST(req: NextRequest) {
  const { chat_session_id, chatbot_id, content, name } = await req.json();

  // console.log(`
  //   Received message from chat session ${chat_session_id}: "${content}" {chatbot: ${chatbot_id}}
  // `);

  try {
    // Step 1: Fetch chatbot characteristics
    const { data } = await serverClient.query<GetChatbotByIdResponse>({
      query: GET_CHATBOT_BY_ID,
      variables: { id: chatbot_id },
    });

    const chatbot = data.chatbots;

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Step 2: Fetch previous messages
    const { data: messagesData } = await serverClient.query<MessagesByChatSessionIdResponse>({
      query: GET_MESSAGES_BY_CHAT_SESSION_ID,
      variables: { chat_session_id },
      fetchPolicy: "no-cache",
    });

    const previousMessages = messagesData.chat_sessions.messages;

   // console.log("Previous messages: ", previousMessages);
    

    const formattedPreviousMessages = previousMessages.map((message) => ({
      role: message.sender === "ai" ? "model" : "user",
      name: message.sender === "ai" ? "model" : name,
      content: message.content,
    }));

   // console.log("Formatted previous messages: ", formattedPreviousMessages);

    // Combine characteristics into a system prompt
    const systemPrompt = chatbot.chatbot_characteristics
      .map((c) => c.content)
      .join(" + ");
    
    //The chatbot knows these things and can answer questions about them as well.  

   // console.log("System prompt is : ", systemPrompt);

    const messages = [
      {
        role: "user",
        name,
        content,
      },
      //  ...formattedPreviousMessages,
      {
        role: "model",
        name: "system",
        content: `First of all ,remember one thing , you never have to reply using Colons(:).  You are a helpful assistant talking to ${name}. If a generic question is asked that is not relevant or in the same scope as the points mentioned in the key information section, kindly inform the user that they're allowed to search for the specified content. Use emojis where possible. Here is some key information you need to be aware of: ${systemPrompt}`,
      }
      
    ];

   // console.log("Messages sent to AI : ", messages);

    // Step 3: Send the message to Gemini AI
    const chatSession = model.startChat({
      generationConfig  ,
      history: messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content}],
      })),
    });

    const result = await chatSession.sendMessage(content);

    const aiResponse = result?.response?.text() || "No response received from Gemini AI.";
    
    // console.log("AI Response is : ", aiResponse);

    const aiResponseJSON = JSON.parse(aiResponse.toString());

    let responseText = "";
    for (let key in aiResponseJSON) {
      responseText = aiResponseJSON[key];
      break; // Exit the loop after retrieving the value
    }

  //  console.log("Extracted AI response:", responseText);
        

    if (!aiResponse) {
      return NextResponse.json(
        { error: "Failed to generate AI response" },
        { status: 500 }
      );
    }

    // Step 4: Save the user's message in the database
    await serverClient.mutate({
      mutation: INSERT_MESSAGE,
      variables: { chat_session_id, content, sender: "user", created_at: new Date().toISOString() },
    });

    // Step 5: Save the AI's response in the database
    const aiMessageResult = await serverClient.mutate({
      mutation: INSERT_MESSAGE,
      variables: { chat_session_id, content: responseText, sender: "ai" , created_at: new Date().toISOString()},
    });

    // console.log("AI Message Mutation Result: ", aiMessageResult);


    // Step 6: Return the AI's response to the client
    return NextResponse.json({
      id: aiMessageResult.data.insertMessages.id,
      content: responseText,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
