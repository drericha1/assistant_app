import { FunctionDeclaration, Type } from "@google/genai";

// 1. Tool Definitions for Gemini
export const toolsDef: FunctionDeclaration[] = [
  {
    name: 'getCurrentTime',
    description: 'Get the current local time of the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'searchHistory',
    description: 'Search through the user\'s past conversation history for a specific topic or keyword.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'The topic or keyword to search for.' },
      },
      required: ['query'],
    },
  }
];

// 2. Client-side execution logic
export const executeTool = async (
  name: string, 
  args: any, 
  context: { 
    searchHistory: (q: string) => string 
  }
): Promise<any> => {
  console.log(`[Tool Exec] ${name}`, args);

  switch (name) {
    case 'getCurrentTime':
      return { time: new Date().toLocaleTimeString() };

    case 'searchHistory':
      const results = context.searchHistory(args.query);
      return { results };

    default:
      return { error: `Function ${name} not found` };
  }
};