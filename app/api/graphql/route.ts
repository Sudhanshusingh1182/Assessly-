import { serverClient } from "@/lib/server/serverClient";
import { gql } from "@apollo/client";
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST , OPTIONS, GET, PUT, DELETE", 
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(request: NextRequest){
    const {query, variables} = await request.json();
    
    variables.created_at = new Date().toISOString(); // Generate ISO 8601 formatted date-time string

    //console.log("Updated Variables with created_at:", variables);

   // console.log("DEBUG 1",query);
   // console.log("DEBUG 2",variables);
    
    try {
        
        let result;
        const parsedQuery = gql`${query}`;
      //  console.log("PARSED QUERY >>>>", parsedQuery);
        
        if(query.trim().startsWith('mutation')){
            // Handle mutations
            result = await serverClient.mutate({
                mutation: parsedQuery,
                variables
            });
        } else {
            //Handles queries
            result = await serverClient.query({
                query: parsedQuery ,
                variables
            })
        }

      //  console.log("RESULT >>>>", result);
        
        
        const data = result.data;
       // console.log("DATA >>>>", data);

        return NextResponse.json({
            data,
        },{
            headers: corsHeaders,
        })
        

    } catch (error) {
        console.log(error);
        return NextResponse.json(error,{
            status: 500,
        })
        
    }
}