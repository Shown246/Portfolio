export type SkillSize = 'lg' | 'md' | 'sm';
export type Skill = { name: string; size: SkillSize };

export const devSkills: Skill[] = [
  { name: 'React', size: 'lg' },
  { name: 'Next.js', size: 'lg' },
  { name: 'TypeScript', size: 'lg' },
  { name: 'Python', size: 'lg' },
  { name: 'Express.js', size: 'lg' },
  { name: 'Node.js', size: 'lg' },
  { name: 'PostgreSQL', size: 'lg' },
  { name: 'MongoDB', size: 'lg' },
  // { name: 'Docker', size: 'md' },
  { name: 'REST APIs', size: 'lg' },
  { name: 'FastAPI', size: 'lg' },
  { name: 'Tailwind', size: 'lg' },
  { name: 'HTML/CSS', size: 'md' },
  { name: 'Git', size: 'md' },
];

export const aiSkills: Skill[] = [
  { name: 'PyTorch', size: 'lg' },
  // { name: 'LangChain', size: 'lg' },
  { name: 'RAG', size: 'lg' },
  { name: 'Fine-tuning', size: 'lg' },
  { name: 'NLP', size: 'lg' },
  { name: 'Computer Vision', size: 'lg' },
  { name: 'LLMs', size: 'lg' },
  { name: 'Prompt Engineering', size: 'lg' },
  { name: 'Vector DBs', size: 'lg' },
  { name: 'Transformers', size: 'lg' },
];
