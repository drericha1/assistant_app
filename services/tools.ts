import { FunctionDeclaration, Type } from "@google/genai";

// 1. Tool Definitions for Gemini
export const toolsDef: FunctionDeclaration[] = [
  {
    name: 'getCurrentTime',
    description: 'Get the current date and time of the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        // Adding a dummy property to satisfy "Type.OBJECT cannot be empty" rule if strictly enforced
        includeTimezone: { type: Type.BOOLEAN, description: 'Whether to include the timezone in the response.' }
      },
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
  },
  {
    name: 'checkCalendar',
    description: 'Check the user\'s calendar for events on a specific date.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: 'The date to check (YYYY-MM-DD). If unspecified, defaults to today.' },
      },
    },
  },
  {
    name: 'scheduleEvent',
    description: 'Schedule a new event on the user\'s calendar.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'The title or description of the event.' },
        date: { type: Type.STRING, description: 'The date of the event (YYYY-MM-DD).' },
        time: { type: Type.STRING, description: 'The time of the event (e.g., "14:00" or "2 PM").' },
      },
      required: ['title', 'date', 'time'],
    },
  },
  {
    name: 'listEmails',
    description: 'List or search emails in the user\'s inbox.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Optional search query for sender or subject.' },
      },
    },
  },
  {
    name: 'sendEmail',
    description: 'Send an email to a specific recipient.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING, description: 'The recipient\'s email address.' },
        subject: { type: Type.STRING, description: 'The subject line of the email.' },
        body: { type: Type.STRING, description: 'The main content/body of the email.' },
      },
      required: ['to', 'subject', 'body'],
    },
  }
];

// 2. Client-side execution logic
export const executeTool = async (
  name: string, 
  args: any, 
  context: { 
    searchHistory: (q: string) => string;
    calendar: {
      listEvents: (date?: string) => any[];
      addEvent: (title: string, date: string, time: string) => string;
    };
    email: {
      listEmails: (query?: string) => any[];
      sendEmail: (to: string, subject: string, body: string) => string;
    }
  }
): Promise<any> => {
  console.log(`[Tool Exec] ${name}`, args);

  switch (name) {
    case 'getCurrentTime':
      return { 
        datetime: new Date().toLocaleString(),
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      };

    case 'searchHistory':
      const results = context.searchHistory(args.query);
      return { results };

    case 'checkCalendar':
      const events = context.calendar.listEvents(args.date);
      return { 
        date: args.date || "today",
        events: events.length > 0 ? events : "No events found." 
      };

    case 'scheduleEvent':
      const confirmation = context.calendar.addEvent(args.title, args.date, args.time);
      return { result: confirmation };

    case 'listEmails':
      const emails = context.email.listEmails(args.query);
      return { emails: emails.length > 0 ? emails : "No emails found matching your query." };

    case 'sendEmail':
      const sentStatus = context.email.sendEmail(args.to, args.subject, args.body);
      return { result: sentStatus };

    default:
      return { error: `Function ${name} not found` };
  }
};