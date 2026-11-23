export type Project = {
  id: string;
  title: string;
  short: string;
  description: string;
  tech: string[];
  liveUrl: string;
  repositories?: { label: string; url: string }[];
  gradient: string; // tailwind classes for thumbnail
};

export const projects: Project[] = [
  {
    id: 'quote-hub',
    title: 'Quote-Hub',
    short: 'A quote sharing social media platform with personalized feeds and repost features.',
    description: 'A full-stack quote-sharing platform with email and Google sign-in, personalized feeds, fuzzy search, bookmarks, and moderation. The API spans 40+ REST endpoints across 13 modules, with Redis caching that reduced feed response time by 45%, cursor pagination, and BullMQ background processing backed by a transactional outbox. Validated with 600+ Vitest/Supertest tests and k6 load tests simulating 500 concurrent users.',
    tech: ['Next.js', 'TypeScript', 'Express', 'PostgreSQL', 'Redis', 'BullMQ'],
    liveUrl: 'https://quote-hub-web.vercel.app',
    repositories: [
      { label: 'Frontend', url: 'https://github.com/Shown246/quote-hub-web' },
      { label: 'Backend', url: 'https://github.com/Shown246/quote-hub-api' },
    ],
    gradient: 'from-[#1a0a14] via-[#2a0a18] to-[#0a0a0f]',
  },
  {
    id: 'food-hub',
    title: 'Food-Hub',
    short: 'A food ordering platform that brings food lovers and local kitchens together.',
    description: 'A full-stack food ordering platform for discovering meals, managing a cart, placing orders, tracking order status, and reviewing delivered meals. Providers manage menus and orders, while admins oversee users, categories, and orders. Powered by 43 documented REST endpoints with session authentication, role checks, rate limiting, and a PostgreSQL schema managed with Prisma migrations and idempotent seeds. Validated with 150+ unit, integration, and API contract tests; query caching reduced average page load time by 35%.',
    tech: ['Next.js', 'TypeScript', 'Express', 'PostgreSQL', 'Prisma'],
    liveUrl: 'https://food-hub-client-bice.vercel.app',
    repositories: [
      { label: 'Frontend', url: 'https://github.com/Shown246/Food-Hub-client' },
      { label: 'Backend', url: 'https://github.com/Shown246/Food-Hub-backend' },
    ],
    gradient: 'from-[#1a120a] via-[#2a1a0f] to-[#0a0a0f]',
  },
  {
    id: 'skill-bridge',
    title: 'Skill-Bridge',
    short: 'A tutoring marketplace where students can discover and book sessions with verified tutors.',
    description: 'A full-stack tutoring marketplace where students discover verified tutors, book sessions, and leave reviews after completed lessons. Tutors manage profiles and availability, while admins approve tutors and manage platform access. Prisma transactions and PostgreSQL row-level locking prevent double bookings, with zero conflicts across 100+ simulated parallel requests. Includes role-based access, booking audit trails, layered rate limiting, and UTC-based scheduling, with booking concurrency and role isolation tested using Jest/Supertest at 90% code coverage.',
    tech: ['Next.js', 'TypeScript', 'Express', 'PostgreSQL', 'Prisma'],
    liveUrl: 'https://skill-bridge-client-three-ashy.vercel.app',
    repositories: [
      { label: 'Frontend', url: 'https://github.com/Shown246/Skill-Bridge-client' },
      { label: 'Backend', url: 'https://github.com/Shown246/Skill-Bridge-backend' },
    ],
    gradient: 'from-[#0f0a1a] via-[#1a0f2a] to-[#0a0a0f]',
  },
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
