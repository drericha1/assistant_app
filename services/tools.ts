import { FunctionDeclaration, Type } from "@google/genai";

// 1. Tool Definitions for Gemini
export const toolsDef: FunctionDeclaration[] = [
  {
    name: 'updateBackgroundColor',
    description: 'Update the background color of the application UI to a specific mood or theme color.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        color: {
          type: Type.STRING,
          description: 'A valid CSS color string (hex, rgb, or name) or a mood like "calm", "energetic".',
        },
      },
      required: ['color'],
    },
  },
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
    setBackground: (c: string) => void,
    searchHistory: (q: string) => string 
  }
): Promise<any> => {
  console.log(`[Tool Exec] ${name}`, args);

  switch (name) {
    case 'updateBackgroundColor':
      let color = args.color;
      if (color === 'calm') color = '#374151'; // gray-700
      if (color === 'energetic') color = '#7f1d1d'; // red-900
      if (color === 'happy') color = '#d97706'; // amber-600
      context.setBackground(color);
      return { success: true, colorApplied: color };

    case 'getCurrentTime':
      return { time: new Date().toLocaleTimeString() };

    case 'searchHistory':
      const results = context.searchHistory(args.query);
      return { results };

    default:
      return { error: `Function ${name} not found` };
  }
};