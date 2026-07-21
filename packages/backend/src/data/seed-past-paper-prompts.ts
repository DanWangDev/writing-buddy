import type { Prompt, PromptGenre, PromptDifficulty } from '@writing-buddy/shared'

type SeedPrompt = Omit<Prompt, 'id' | 'createdAt'>

/**
 * Writing prompts inspired by real 11+ past paper topics from:
 * - CSSE (Essex) — story continuation, recount, diary entry
 * - GL Assessment (Bexley, Kent, Medway, Bucks) — narrative or descriptive
 * - Latymer Upper, St Paul's Girls', The Perse, Emanuel, Alleyn's
 * - Bancroft's School, Merchant Taylors'
 *
 * These are adapted to fit Writing Buddy's manga-inspired tone while
 * staying true to the types of tasks that appear in real exams.
 */
export const seedPastPaperPrompts: readonly SeedPrompt[] = [
  // ── Continue the Story (sentence starters) ──

  {
    title: 'The Cardboard Box',
    body: '"Outside my front door, someone had left a large cardboard box." Continue the story. What is inside the box? Who left it there? What happens when you open it?',
    genre: 'mystery' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['mystery', 'suspense', 'discovery'],
  },
  {
    title: 'The Spiral Staircase',
    body: '"Pushing the door, his hand shook uncontrollably as he watched the ground open up to reveal a spiral staircase winding down to the unknown." Continue the story. Where does the staircase lead? What waits at the bottom?',
    genre: 'adventure' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['adventure', 'courage', 'underground'],
  },
  {
    title: 'The Secret in the Attic',
    body: '"The moment I stepped into the old attic, I knew I had uncovered a hidden secret." Continue the story. What did you find? Why was it hidden? How does discovering it change things?',
    genre: 'mystery' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['discovery', 'family', 'secrets'],
  },
  {
    title: 'Midnight in the Garden',
    body: '"As the clock struck midnight, I heard a strange noise coming from the garden." Continue the story. What is making the noise? What do you see when you investigate?',
    genre: 'fantasy' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['night', 'garden', 'mystery'],
  },
  {
    title: 'The Lift',
    body: '"The lift pinged and the door opened. I could not believe my eyes." Continue the story. What is on the other side of the lift doors? Is it somewhere you recognise, or somewhere impossible?',
    genre: 'sci-fi' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['surprise', 'travel', 'imagination'],
  },
  {
    title: 'Something in the Sand',
    body: '"The spade hit something metal." You are digging on the beach when your spade strikes something hard. Continue the story. What have you found? Who does it belong to?',
    genre: 'adventure' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['beach', 'treasure', 'discovery'],
  },

  // ── Story Titles ──

  {
    title: 'Taught a Lesson!',
    body: 'Write a story with the title "Taught a Lesson!" about a character who learns something important the hard way. Show how their attitude or behaviour changes by the end.',
    genre: 'adventure' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['growth', 'consequences', 'learning'],
  },
  {
    title: 'Alone',
    body: 'Write a story with the title "Alone." Your character finds themselves completely on their own — maybe lost, left behind, or the last person awake. Describe their thoughts, feelings, and what happens next.',
    genre: 'descriptive' as PromptGenre,
    difficulty: 'challenge' as PromptDifficulty,
    wordCountTarget: 400,
    tags: ['emotion', 'survival', 'isolation'],
  },
  {
    title: 'The Storm',
    body: 'Write a story with the title "The Storm." Describe the weather as it builds, the moment it strikes, and its effects on the people and place. Use all five senses to make the reader feel like they are right there.',
    genre: 'descriptive' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['weather', 'senses', 'drama'],
  },
  {
    title: 'A Cry in the Woods',
    body: 'Write a story with the title "A Cry in the Woods." While walking through a forest, you hear a cry for help. Describe what you discover, how you respond, and the consequences of your actions.',
    genre: 'adventure' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['forest', 'bravery', 'rescue'],
  },
  {
    title: 'The Old House',
    body: 'Write a story with the title "The Old House." Describe a character approaching and entering a house that has been abandoned for years. What do they find inside? Build atmosphere and suspense.',
    genre: 'mystery' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['setting', 'atmosphere', 'exploration'],
  },

  // ── Diary Entries & Letters ──

  {
    title: 'A Martian\'s First Day on Earth',
    body: 'Imagine you are a Martian landing on planet Earth for the very first time. Write a diary entry about your first day. What surprises you most about humans? What do you find strange, wonderful, or confusing?',
    genre: 'sci-fi' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['aliens', 'diary', 'perspective'],
  },
  {
    title: 'A Walk in the Dark',
    body: 'Think of a time you had to walk somewhere in the dark. Write a letter to a friend describing what you saw, what you heard, and how you felt during that journey.',
    genre: 'descriptive' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['senses', 'fear', 'letter'],
  },
  {
    title: 'Letter to My Future Self',
    body: 'Write a letter to your future self, to be opened in exactly ten years. What do you hope has happened by then? What questions do you want to ask your older self? What do you not want to forget about who you are right now?',
    genre: 'persuasive' as PromptGenre,
    difficulty: 'challenge' as PromptDifficulty,
    wordCountTarget: 400,
    tags: ['reflection', 'future', 'personal'],
  },
  {
    title: 'The Present I Didn\'t Want',
    body: 'Write a thank-you letter for a present you really did not want. You must be polite and grateful, but your true feelings keep creeping in between the lines. Make it funny!',
    genre: 'humor' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['comedy', 'politeness', 'letter'],
  },

  // ── Descriptions ──

  {
    title: 'Someone I Will Never Forget',
    body: 'Describe someone you will never forget. It could be a family member, a friend, a teacher, or even a stranger you met once. Use specific details — what they look like, how they speak, and why they left such a strong impression on you.',
    genre: 'descriptive' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['people', 'memories', 'description'],
  },
  {
    title: 'The Empty School',
    body: 'Imagine it is very early in the morning and you are all alone in your school before anyone else arrives. Describe what you see, hear, and feel. How does the familiar become strange when nobody else is there?',
    genre: 'descriptive' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['school', 'atmosphere', 'observation'],
  },
  {
    title: 'A Very Cold Place',
    body: 'Describe a visit to the coldest place you can imagine. Use sensory details to make the reader shiver — what do you see, hear, touch, taste, and smell? How does the cold affect your body and your mood?',
    genre: 'descriptive' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['weather', 'senses', 'setting'],
  },
  {
    title: 'My Perfect Garden',
    body: 'Describe your idea of a perfect garden. It can be real or imaginary. What grows there? Who visits? What sounds and smells fill the air? Make it so vivid that the reader feels like they are walking through it.',
    genre: 'descriptive' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['nature', 'imagination', 'beauty'],
  },

  // ── Experience & Emotion ──

  {
    title: 'Something That Scared Me',
    body: 'Write about a time when you had to do something that scared you. Describe what happened, step by step. How did your body feel? What thoughts raced through your mind? How did you find the courage to keep going?',
    genre: 'adventure' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['courage', 'fear', 'personal'],
  },
  {
    title: 'When I Learned My Lesson',
    body: 'Write about a time when you did something wrong but learned an important lesson from it. Be honest about what happened, how others reacted, and what you understood differently afterwards.',
    genre: 'adventure' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['mistakes', 'growth', 'honesty'],
  },
  {
    title: 'My Most Memorable Journey',
    body: 'Write about your most memorable holiday or trip. Describe the journey, the destination, and a specific moment that stands out in your memory. Use vivid details to bring the experience to life.',
    genre: 'descriptive' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['travel', 'memories', 'adventure'],
  },

  // ── Persuasive & Non-Fiction ──

  {
    title: 'Should Kids Have Smartphones?',
    body: 'Do you think children should have access to smartphones? Write a balanced magazine article outlining reasons both for and against. Give examples and finish with your own considered opinion.',
    genre: 'persuasive' as PromptGenre,
    difficulty: 'challenge' as PromptDifficulty,
    wordCountTarget: 400,
    tags: ['technology', 'debate', 'opinion'],
  },
  {
    title: 'No More School Uniform!',
    body: 'Write a persuasive letter to your headteacher arguing that school uniform should be abolished. Give at least three strong reasons, address the counter-arguments, and end with a powerful conclusion.',
    genre: 'persuasive' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['school', 'argument', 'change'],
  },
  {
    title: 'Clean Up Our Streets',
    body: 'Write a persuasive letter to your local councillor about litter in your area. Describe the problem vividly, explain why it matters, and propose at least two practical solutions. Make them feel the urgency!',
    genre: 'persuasive' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['environment', 'community', 'solutions'],
  },
  {
    title: 'Instructions for a Martian',
    body: 'Write clear, step-by-step instructions for how to make a piece of toast with jam — but the instructions are for a Martian who has never seen a kitchen before. Be precise! Every tiny step matters.',
    genre: 'humor' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 200,
    tags: ['instructions', 'comedy', 'precision'],
  },

  // ── Imaginative / Unusual ──

  {
    title: 'The Day Time Stopped',
    body: 'Write a story in which time suddenly stops. You are the only person who can still move. Describe what you see — frozen cars, silent streets, birds suspended mid-flight — and what you decide to do with this strange power.',
    genre: 'sci-fi' as PromptGenre,
    difficulty: 'challenge' as PromptDifficulty,
    wordCountTarget: 400,
    tags: ['time', 'power', 'imagination'],
  },
  {
    title: 'The Unusual Machine',
    body: 'Write a story which features an unusual method of transport. It could be a flying bicycle, a teleporting bathtub, or a train that travels through dreams. Describe your first journey on it.',
    genre: 'fantasy' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['invention', 'travel', 'creativity'],
  },
  {
    title: 'The Door That Wasn\'t There Before',
    body: 'You find a door at school you have never seen before. Through the keyhole, you glimpse something impossible. Write about whether you open the door, and what happens if you do.',
    genre: 'fantasy' as PromptGenre,
    difficulty: 'standard' as PromptDifficulty,
    wordCountTarget: 300,
    tags: ['school', 'portal', 'curiosity'],
  },
  {
    title: 'The Magical Ring',
    body: 'Write a story about a magical ring that gives you everything you want — until one day it gives you something you definitely did not ask for. What goes wrong, and how do you deal with the consequences?',
    genre: 'fantasy' as PromptGenre,
    difficulty: 'challenge' as PromptDifficulty,
    wordCountTarget: 400,
    tags: ['magic', 'wishes', 'consequences'],
  },
  {
    title: 'Pulled Into the Screen',
    body: 'You are watching your favourite film when suddenly you get pulled into the screen — you are now inside the movie! Write about what happens, who you meet, and whether you can ever get back out.',
    genre: 'fantasy' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['movies', 'adventure', 'imagination'],
  },
  {
    title: 'The Mysterious Object',
    body: 'Write a story about discovering a mysterious object. Describe the object in detail — what it looks like, how it feels, any sounds or lights it makes — and reveal its secret by the end of your story.',
    genre: 'mystery' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['discovery', 'description', 'secrets'],
  },
  {
    title: 'A Monster at My Party',
    body: 'Write a story about a monster that appears at your birthday party. But this is not a scary monster — it is the most unexpected party guest ever. What does it look like? How does it behave? What chaos or joy does it bring?',
    genre: 'humor' as PromptGenre,
    difficulty: 'beginner' as PromptDifficulty,
    wordCountTarget: 250,
    tags: ['monsters', 'celebration', 'comedy'],
  },
] as const
