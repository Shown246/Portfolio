export type Project = {
  id: string;
  title: string;
  short: string;
  description: string;
  tech: string[];
  liveUrl: string;
  gradient: string; // tailwind classes for thumbnail
};

export const projects: Project[] = [
  {  id: 'honest-hour',
     title: 'Honest Hour', 
     short: 'Honest hour is a time boxing productivity web application.', 
     description: "Honest hour is a time boxing productivity web application. It is based on apopular productivity technique, time boxing,where users can commit a specific time of theday to a task they want to complete. The application represents the 24 hours into half hourtime boxes. For example, one's goal is to do atask from 9.30 to 11, he can just box that time inthe app. And user can monitor his productivity onthe dashboard. Additionally, there's a Todofeature available for just in case.", 
     tech: ['React.js'], 
     liveUrl: 'https://honest-hour.vercel.app/', gradient: 'from-[#1a0a14] via-[#2a0a18] to-[#0a0a0f]' 
  },


  { id: 'chat-app', 
    title: 'Realtime AI Chat', 
    short: 'Streaming multi-model chat with tool use.', 
    description: 'A chat application supporting streaming responses across OpenAI, Anthropic, and local models, with tool calling and conversation memory.', tech: ['Next.js', 'Express.js', 'TypeScript', 'Prisma-PostgreSQL'], 
    liveUrl: '#', gradient: 'from-[#0f0a1a] via-[#1a0f2a] to-[#0a0a0f]' 
  },
  
  
  { id: 'cv-demo', 
    title: 'Music Downloader', 
    short: 'Download songs from Youtube and Spotify with a single click.', 
    description: 'A simple Windows app for saving audio from Spotify searches and supported YouTube links. You can use one search box for: Spotify songs, albums, playlists, and text searches. YouTube videos, Shorts, shortened links, and playlists. MP3 downloads from YouTube', 
    tech: ['Next.js', 'Express.js', 'TypeScript', 'Prisma-PostgreSQL'], 
    liveUrl: '#', gradient: 'from-[#0a141a] via-[#0f1a28] to-[#0a0a0f]' 
  },
];
