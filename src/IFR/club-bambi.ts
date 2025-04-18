import { createTheme, DEFAULT_THEME, MantineColor, mergeMantineTheme } from '@mantine/core';
import { createContext } from 'react';

export type CollapseContext = { 
  statePanelOpened: boolean, 
  toggleStatePanel: () => void, 
  openStatePanel: () => void,
  closeStatePanel: () => void, 
}
export const PageContext = createContext<CollapseContext | null>(null);

const themeOverride = createTheme({
  primaryColor: "violet",
  defaultGradient: {
    from: 'blue',
    to: 'violet',
    deg: 45,
  },
  other: {
    gradients: {
      'club-bambi': { from: 'violet', to: 'grape', deg: 135 },
    },
    hexcodes: {
      
    }
  },
  defaultRadius: "md",
  autoContrast: true,
});

export const theme = mergeMantineTheme(DEFAULT_THEME, themeOverride)


export const Uniform = [
  'Collar',
  'Panties & Bra',
  'Stockings',
  'Dress or Skirt & Top',
  'High Heels',
  'Intimates Shaved',
  'Jewelry & Accessories',
  'Blonde or Pink Wig',
  'Make-up',
  'Painted or Fake Nails',
  'Completely Shaved',
  'Corset',
]

export interface Client {
  name: string;
  attributes: Attribute[]
}

export type Attribute = 'Rough' | 'Kinky' | 'Sadistic' | 'Insatiable' | 'Breeder' | 'Cosplay' | 'Trainer'
export const ROUGH = 'Rough'
export const KINKY = 'Kinky'
export const SADISTIC = 'Sadistic'
export const INSATIABLE = 'Insatiable'
export const BREEDER = 'Breeder'
export const COSPLAY = 'Cosplay'
export const TRAINER = 'Trainer'

export interface AttributeDetail {
  color: MantineColor;
  description: string;
}

export const Attributes: { [attribute in Attribute]: AttributeDetail } = {
  [ROUGH]: {
    color: 'red.7',
    description: 'Enjoys inflicting pain and slapping you around a bit. Makes punishment tasks more difficult. Do red text.'
  },
  [KINKY]: {
    color: 'green.6',
    description: 'Enjoys engaging in kinks and using BDSM gear. Increases chance of being put in bondage. Do green text.'
  },
  [SADISTIC]: {
    color: 'orange.6',
    description: 'Takes joy in causing shame and degrading you. Makes humiliation tasks more difficult. Do orange text'
  },
  [INSATIABLE]: {
    color: 'grape.6',
    description: 'Wants to fuck you relentlessly with no end in sight. They become harder to satisfy. Add 30BPM to anal/oral tasks and do purple text.'
  },
  [BREEDER]: {
    color: 'cyan.4',
    description: 'Has a seemingless endless supply of Cum, tries to impregnate you with huge loads. Double all cum amounts and do light blue text.'
  },
  [COSPLAY]: {
    color: 'yellow.3',
    description: 'Has high standards when it comes to Bambis being in uniform. More likely to add uniform pieces or make you dress up in an outfit. Do yellow text.'
  },
  [TRAINER]: {
    color: 'indigo.7',
    description: 'Wants to condition you into becoming Bambi completely. Listen to Bambi Sleep files while doing tasks. Do dark blue text.'
  }
}

type size = 'Small' | 'Medium' | 'Large' | 'Huge'
export interface Client {
  name: string;
  attributes: Attribute[],
  description: string;
  size: size;
}

export function slugify(name: string) {
  return name.toLowerCase().replaceAll(' ', '-')
}

export const Clients: Client[] = [
  {
    name: 'Sammi',
    attributes: [TRAINER],
    description: 'Sammi previously worked at club Bambi and was one of the few who escaped. Far from unscathed though, Sammi is now a sissy but still visits the club occassionally. I guess no one ever truly escapes Bambi do they.',
    size: 'Small'
  },
  {
    name: 'Henry',
    attributes: [COSPLAY],
    description: 'Henry is the newest member of the gang and younger brother to Butch. He is still somewhat innocent when it comes to sexual experiences. And is by far the more kind-hearted of the two brothers.',
    size: 'Small'
  },
  {
    name: 'The Creep',
    attributes: [KINKY, SADISTIC, BREEDER],
    description: 'The creep always seems to be hanging around the club. Gossip among the other bambis is that he takes pleasure in breaking the new arrivals by forcing them to do degrading and humiliating sexual acts.',
    size: 'Small'
  },
  {
    name: 'Eve',
    attributes: [INSATIABLE, SADISTIC],
    description: 'Eve is the muscle hired to keep the Bambis well behaved. She often remarks on how she cant believe you were ever a man to begin with, and loves seeing how far you will sink into complete depravity. She delights in reminding you just how pathetic you are.',
    size: 'Medium'
  },
  {
    name: 'The Fixer',
    attributes: [ROUGH, KINKY],
    description: 'The Fixer is one of the Dons right hand men. A violent man who is well-versed in torture and bondage techniques. He enjoys employing his talents on Bambis in his free time and making them squirm.',
    size: 'Medium'
  },
  {
    name: 'The Connoisseur',
    attributes: [KINKY, COSPLAY],
    description: 'The Connoisseur has a unique taste for Bambis. He enjoys seeing them dress up for him in suggestive outfits before he has his way with them.',
    size: 'Medium'
  },
  {
    name: 'Stella',
    attributes: [ROUGH, TRAINER, SADISTIC],
    description: 'Stella sometimes likes to check on how her bimbos are coming along and provide "hands on" guidance in the form of her strapon aptly named "The impaler". She\'ll make sure that you\'re being a good girl, or else.',
    size: 'Large'
  },
  {
    name: 'Butch',
    attributes: [ROUGH, INSATIABLE, SADISTIC, BREEDER],
    description: 'Butch is the guard that escorted you into Club Bambi, and he enjoys making Bambis his bitch. He\'ll make you regret not knowing your place when you first started. He usually leaves his bitches as a quivering mess once he\'s done with them.',
    size: 'Large'
  },
  {
    name: 'The Don',
    attributes: [ROUGH, KINKY, SADISTIC, INSATIABLE, BREEDER, COSPLAY, TRAINER],
    description: 'The Don is the boss of the entire gang and you are his property. They say once a Bambi spends a night with him there\'s no going back. With an impossibly large cock and a mean temper you had better be on your best behaviour.',
    size: 'Huge'
  }
]

export interface Stage {
  name: string;
  description: string;
}

export const Stages: Stage[] = [
  {
    name: 'Start',
    description: ''
  },
  {
    name: 'Training',
    description: ''
  },
  {
    name: 'Earn Your Keep',
    description: ''
  }
]

export type Event = (
  'Difficulty' | 'Uniform' | 'Client' | 'Bondage' | 'Outfit' | 'Starting Task'
  | 'Oral Position' | 'Oral Modifier' | 'Oral Next Task' | 'Anal Position' | 'Anal Modifier' | 'Anal Next Task'
  | 'Humiliation' | 'Punishment' | 'Oral Cum' | 'Anal Cum' | 'Cum Next Task' | 'Payment' | 'Oral Task' | 'Anal Task'
)
export const DIFFICULTY = 'Difficulty'
export const UNIFORM = 'Uniform'
export const CLIENT = 'Client'
export const BONDAGE = 'Bondage'
export const OUTFIT = 'Outfit'
export const STARTING_TASK = 'Starting Task'
export const ORAL_POSITION = 'Oral Position'
export const ORAL_MODIFIER = 'Oral Modifier'
export const ORAL_TASK = 'Oral Task'
export const ORAL_NEXT = 'Oral Next Task'
export const ANAL_POSITION = 'Anal Position'
export const ANAL_MODIFIER = 'Anal Modifier'
export const ANAL_TASK = 'Anal Task'
export const ANAL_NEXT = 'Anal Next Task'
export const HUMILIATION = 'Humiliation'
export const PUNISHMENT = 'Punishment'
export const ORAL_CUM = 'Oral Cum'
export const ANAL_CUM = 'Anal Cum'
export const CUM_NEXT = 'Cum Next Task'
export const PAYMENT = 'Payment'

export const events = [
  DIFFICULTY,
  UNIFORM,
  CLIENT,
  BONDAGE,
  OUTFIT,
  STARTING_TASK,
  ORAL_POSITION,
  ORAL_MODIFIER,
  ORAL_TASK,
  ORAL_NEXT,
  ANAL_POSITION,
  ANAL_MODIFIER,
  ANAL_TASK,
  ANAL_NEXT,
  HUMILIATION,
  PUNISHMENT,
  ORAL_CUM,
  ANAL_CUM,
  CUM_NEXT,
  PAYMENT
]

export interface PenetrationTask {
  min: number;
  max: number;
  duration: number;
  speed?: number;
  name: string;
  task: string;
  description: string;
  attributeTasks: { [key in Attribute]?: string }
}

export type Effect =
  'Super Sensitive' | 'Ass-to-Mouth' | 'Ass-to-Mouth Throating' | 'Locked'
  | 'Permanently Locked' | 'Facial' | 'Selfie' | 'Plugged' | 'Snake Plugged'
  | 'Makeup Fixer' | 'Makeup Destruction' | 'Cock Cleaner' | 'Limp Clitty'

export const SENSITIVE = 'Super Sensitive'
export const A2M = 'Ass-to-Mouth'
export const A2M_THROATING = 'Ass-to-Mouth Throating'
export const LOCKED = 'Locked'
export const PERMALOCKED = 'Permanently Locked'
export const FACIAL = 'Facial'
export const SELFIE = 'Selfie'
export const PLUGGED = 'Plugged'
export const PLUGGED_SNAKE = 'Snake Plugged'
export const MAKEUP = 'Makeup Fixer'
export const MAKEUP_DESTROYER = 'Makeup Destruction'
export const CLEANER = 'Cock Cleaner'
export const LIMP = 'Limp Clitty'

export const eventDetails: { [key in Event]: Decision[] } = {
  [DIFFICULTY]: [],
  [UNIFORM]: [],
  [CLIENT]: [],
  [BONDAGE]: [
    { min: 1, max: 3, task: 'Do nothing.' },
    { min: 4, max: 5, task: 'Add a leash and tie it to something.' },
    { min: 6, max: 6, task: 'Add nipple clamps.' },
    { min: 7, max: 7, task: 'Tie your hands behind your back.' },
    { min: 8, max: 8, task: 'Add butt plug when your ass is not in use.' },
    { min: 9, max: 9, task: 'Add gag when your mouth is not in use.' },
    { min: 10, max: 10, task: 'Tie your feet together.' },
  ],
  [OUTFIT]: [
    { min: 1, max: 2, task: 'Do nothing.' },
    { min: 3, max: 5, task: 'Add +1 to your current uniform for this client.' },
    { min: 6, max: 7, task: 'Replace your dress / top & skirt with a lingerie bra and panties for this client.' },
    { min: 8, max: 8, task: 'Add another +1 to your current uniform for this client.' },
    { min: 9, max: 9, task: 'Add +1 to your current uniform permanently.' },
    { min: 10, max: 10, task: 'Add another +1 to your current uniform permanently.' },
  ],
  [STARTING_TASK]: [
    { min: 1, max: 3, task: HUMILIATION },
    { min: 4, max: 6, task: PUNISHMENT },
    { min: 7, max: 8, task: ORAL_POSITION },
    { min: 9, max: 10, task: ANAL_POSITION },
  ],
  [ANAL_POSITION]: [
    {
      min: 1,
      max: 2,
      duration: 8,
      speed: 60,
      name: 'On Your Back',
      task: 'Fuck your ass while on your back, with your legs in the air.',
      description: 'They pick you up and throw you down on the bed. Grabbing your ankles and holding them over your head. There is a couple seconds where you hold your breath in anticipation but you can\'t help but moan as they enter your ass.'
    },
    {
      min: 3,
      max: 4,
      duration: 8,
      speed: 90,
      name: 'Doggy Style',
      task: 'Fuck your ass doggy style.',
      description: 'You are forced onto all fours like a dog. They grab you by your hips and you yelp as they push their entire length inside you with no warning. Your mind short-circuits as they continue their assault on your ass.'
    },
    {
      min: 5,
      max: 6,
      duration: 5,
      speed: 120,
      name: 'Bent Over',
      task: 'Bend over and fuck your ass.',
      description: 'They bend you over a table with your ass sticking out. Then they grab you by the hair and start pounding away. The only sounds; your moans mixed with a rythmic slapping sound as their balls smack against your ass.',
      attributeTasks: {
        ROUGH: 'Slap your ass every 15 seconds'
      }
    },
    {
      min: 7,
      max: 8,
      duration: 8,
      speed: 90,
      name: 'Cow Girl',
      task: 'Ride a Dildo.',
      description: 'They lie on their back, their throbbing cock standing right at attention. You climb on top of them and position your butt right over it, sinking down on its girthy length with a gasp, then starting to bounce up and down, gradually picking up speed.'
    },
    {
      min: 9,
      max: 9,
      duration: 10,
      speed: 40,
      name: 'On Your Side',
      task: 'While on your side, steadily fuck your ass.',
      description: 'They turn you onto your side with your clitty tucked between your legs and spread your ass and inspect your hole before slowly fucking your ass like the bitch you are.'
    },
    {
      min: 10,
      max: 10,
      duration: 5,
      speed: 100,
      name: 'Prone',
      task: 'Fuck your ass in the prone position.',
      description: 'They manhandle you to the bed, with a firm hand on your back pinning you down on your stomach. Your useless clitty smothered on the sheets. They lean over you and plunge their cock deep into your ass over and over again.'
    },
  ],
  [ANAL_MODIFIER]: [
    {
      min: 1,
      max: 2,
      task: 'Every 2 minutes, you must attempt to gape your ass for 30 seconds before continuing.',
      attributeTasks: {
        [KINKY]: 'Insert and expel a plug 5 times without hands after your fucking.'
      }
    },
    {
      min: 3,
      max: 4,
      task: 'The dildo must completely leave your ass between each stroke.',
    },
    {
      min: 5,
      max: 6,
      task: '"Posture Lock" - you must maintain feminine, submissive posture at all times, making sure to arch your back. If you falter at any point they slap you 1 time.',
      attributeTasks: {
        [ROUGH]: 'They slap you 5 times instead.'
      }
    },
    {
      min: 7,
      max: 8,
      task: 'They smack your ass every 10 seconds while fucking you.',
      attributeTasks: {
        [ROUGH]: 'They slap you harder.',
        [SADISTIC]: 'They slap you in the balls instead.'
      }
    },
    {
      min: 9,
      max: 10,
      task: 'They demand that you moan and whine while they fuck you.',
      attributeTasks: {
        [TRAINER]: 'They force your clitty into chastity while you are getting fucked.'
      }
    },
  ],
  [ANAL_TASK]: [],
  [ANAL_NEXT]: [
    { min: 1, max: 5, task: ANAL_CUM },
    { min: 6, max: 6, task: ANAL_POSITION },
    { min: 7, max: 8, task: HUMILIATION },
    { min: 9, max: 10, task: PUNISHMENT }
  ],
  [ORAL_POSITION]: [
    {
      min: 1,
      max: 2,
      duration: 5,
      name: 'Worship Cock',
      task: 'Attach a dildo to the wall and get on your kness. Rub your face all over it including the balls, then lick the head and up down the shaft worshipping it.',
      description: 'They grab the back of your head and rub your face all over their cock and balls, ordering you to worship it.',
    },
    {
      min: 3,
      max: 4,
      duration: 5,
      name: 'In Your Place',
      task: 'While on all fours, suck a dildo.',
      description: 'They sit down and tell you to begin. You crawl over on all fours between their legs, take their cock into your mouth and timidly begin sucking.',
      attributeTasks: {
        [KINKY]: 'If you are wearing a leash, they sit on it, preventing you from taking the head of their cock out of your mouth.'
      }
    },
    {
      min: 5,
      max: 6,
      duration: 5,
      speed: 60,
      name: 'On Your Knees',
      task: 'Get on your knees with your hands behind your back. Stick a dildo to a wall and suck it.',
      description: 'They take hold of your head and force you to your knees. Sliding their hard cock between your lips over and over again.',
      attributeTasks: {
        [TRAINER]: 'Have a picture of your client above the dildo and maintain eye contact.'
      }
    },
    {
      min: 7,
      max: 8,
      duration: 5,
      speed: 60,
      name: 'Service Cock',
      task: 'Lick up and down the shaft every now and then, and use your hands while sucking the dildo.',
      description: 'They take hold of your head and force you to your knees. Sliding their hard cock between your lips over and over again.',
    },
    {
      min: 9,
      max: 9,
      duration: 4,
      speed: 60,
      name: 'No Escape',
      task: 'Get on your knees with your back against the wall and fuck your throat. Afterwards, deepthroat 5 times for as long as you can.',
      description: 'They drag you to your knees by your hair and push you up against a wall. There will be no escape while he tests your deepthroating limits.',
      attributeTasks: {
        [COSPLAY]: 'Apply heavy eye makeup, including mascara, before getting fucked.',
        [SADISTIC]: 'Hold or clamp your nose closed.'
      }
    },
    {
      min: 10,
      max: 10,
      duration: 5,
      speed: 90,
      name: 'Throat Fucked',
      task: 'Hang your head off the edge of a bed and fuck your throat, do not swallow any spit.',
      description: 'The shove you onto the bed with your head hanging off the edge. Then, they proceed to throat fuck you with a passion giving you no chance to catch your breath.',
      attributeTasks: {
        [COSPLAY]: 'Apply heavy eye makeup, including mascara, before getting fucked.',
        [KINKY]: 'Insert an anal hook (or butt plug) and tie it to your collar while getting fucked.'
      }
    },
  ],
  [ORAL_MODIFIER]: [
    {
      min: 1,
      max: 2,
      task: 'Finger your ass while sucking.'
    },
    {
      min: 3,
      max: 4,
      task: 'Every 1 minute, hold a deepthroat for as long as you can before continuing.'
    },
    {
      min: 5,
      max: 6,
      task: 'Occasionally spit on their cock.'
    },
    {
      min: 7,
      max: 8,
      task: 'They slap your face with their dick 10 times.',
      attributeTasks: {
        [ROUGH]: 'They do it 20 times extra hard instead.'
      }
    },
    {
      min: 9,
      max: 10,
      task: 'The cock may never leave your mouth. You must keep some part of the cock / balls in your mouth at all times.',
      attributeTasks: {
        [TRAINER]: 'They force your clitty into chastity while you are getting fucked.'
      }
    },
  ],
  [ORAL_TASK]: [],
  [ORAL_NEXT]: [
    { min: 1, max: 5, task: ORAL_CUM },
    { min: 6, max: 7, task: ANAL_POSITION },
    { min: 8, max: 9, task: HUMILIATION },
    { min: 10, max: 10, task: PUNISHMENT }
  ],
  [HUMILIATION]: [
    {
      min: 1,
      max: 1,
      task: 'Finger your ass while moaning how much you want their cock inside you.',
      description: 'They order you to finger yourself and beg for their cock.',
      next: ANAL_POSITION,
    },
    {
      min: 2,
      max: 2,
      task: 'Rub ice on your asshole. Moan like a slut for the rest of this client',
      description: 'They tell you to spread your ass cheeks. You feel them rub something cold against your hole and a few seconds later your asshole becomes extremely sensitive. "Here, an aphrodesiac, for being such a Good Girl."',
      next: ANAL_POSITION,
      effect: SENSITIVE
    },
    {
      min: 3,
      max: 3,
      task: 'Roll anal, then immediately roll oral.',
      description: 'They force you to do ass to mouth.',
      next: ANAL_POSITION,
      effect: A2M,
      attributeEffects: {
        [SADISTIC]: A2M_THROATING
      }
    },
    {
      min: 4,
      max: 4,
      task: 'Suck on 2 fingers while moaning and thinking of sucking a hard cock.',
      description: 'They use a trigger on your, "Zap cock drain obey", filling your head with thoughts of sucking hard cock. They tell you to suck on their 2 fingers as if it was their dick.',
      next: ORAL_POSITION,
    },
    {
      min: 5,
      max: 5,
      task: 'Spread your ass cheeks, trying to gape your ass.',
      description: 'They demand you to beg them to fuck your ass.',
      next: ANAL_POSITION,
    },
    {
      min: 6,
      max: 6,
      task: 'Lock yourself in chastity for rest of this client. Listen to a hypno audio for 3 minutes while slapping your balls with a dildo.',
      description: 'They make fun of your pathetic clitty and compare it to a real cock.',
      effect: LOCKED,
      attributeEffects: {
        [TRAINER]: PERMALOCKED
      },
      next: HUMILIATION,
    },
    {
      min: 7,
      max: 7,
      task: 'Take a selfie of yourself in a slutty pose with a suggestive caption. Maintain eye contact with it during the next oral.',
      description: 'They want you to know how slutty you have become.',
      effect: SELFIE,
      next: ORAL_POSITION,
    },
  ],
  [PUNISHMENT]: [
    {
      min: 1,
      max: 1,
      task: 'Get on your knees and smack your face with a dildo hard 20 times.',
      description: 'They show you where you belong. On your knees.',
      attributeTasks: {
        [ROUGH]: 'Smack your face 40 times instead.'
      },
      next: ORAL_POSITION
    },
    {
      min: 2,
      max: 2,
      task: 'Spank your ass 20 times.',
      description: 'They spank your ass and make you promise to be a "good girl" from now on.',
      attributeTasks: {
        [ROUGH]: 'Spank your ass 40 times instead.'
      },
      next: ANAL_POSITION
    },
    {
      min: 3,
      max: 3,
      task: 'Put nipple clamps on and pull on them for 2 minutes while moaning.',
      description: 'They train your nipples to feel pleasure from pain.',
      attributeTasks: {
        [ROUGH]: 'Then rip the clamps off 5 times.'
      },
      next: HUMILIATION
    },
    {
      min: 4,
      max: 4,
      task: 'Squeeze your balls for 1 minute, pretending that they\'re being stepped on.',
      description: 'They step on your balls and destroy your last scraps of "manhood".',
      attributeTasks: {
        [ROUGH]: 'Lightly choke yourself at the same time.'
      },
      next: HUMILIATION
    },
    {
      min: 5,
      max: 5,
      task: 'Deepthroat on 2 fingers for 1 minute, then wipe your saliva over your face and slap yourself 5 times.',
      description: 'You are nothing more than an object.',
      attributeTasks: {
        [ROUGH]: 'Slap yourself 10 times instead.'
      },
      next: ANAL_POSITION
    },
    {
      min: 6,
      max: 6,
      task: 'Insert your largest butt plug. Leave it in during the next oral.',
      description: 'Time to push your ass to its limits.',
      effect: PLUGGED,
      attributeEffects: {
        [KINKY]: PLUGGED_SNAKE
      },
      next: ORAL_POSITION
    },
    {
      min: 7,
      max: 7,
      task: 'Tie a 500g weight to a buttplug and insert it. Let the weight hang and hold the plug in without hands for 2 minutes.',
      description: 'You need to train to squeeze cocks inside your ass.',
      attributeTasks: {
        [SADISTIC]: 'Use a 1kg weight instead.'
      },
      next: ANAL_POSITION
    },
    {
      min: 8,
      max: 8,
      task: 'Fix your make-up whenever it gets ruined for the rest of this client.',
      description: 'A Bambi should always be looking her best.',
      effect: MAKEUP,
      attributeEffects: {
        [ROUGH]: MAKEUP_DESTROYER
      },
      next: ORAL_POSITION
    },
    {
      min: 9,
      max: 9,
      task: 'From now on you must lick their cock clean after every anal and cum task.',
      description: 'They order you to clean their cock with your mouth.',
      effect: CLEANER,
      next: ANAL_POSITION
    },
    {
      min: 10,
      max: 10,
      task: 'Smack your clitty limp whenever it gets hard for the rest of this client.',
      description: 'Good girls know that their clitty is useless now and should stay limp at all times.',
      effect: LIMP,
      next: PUNISHMENT
    },
  ],
  [ORAL_CUM]: [
    { min: 1, max: 2, cum: 10, task: 'They cum down your throat during a 15 second deepthroat.' },
    { min: 3, max: 4, cum: 10, task: 'They cum all over your face.' },
    { min: 5, max: 6, cum: 10, task: 'They cum into your open mouth with your tongue sticking out. Swallow and show them your empty mouth.', attributeTasks: { [KINKY]: 'Instead of swallowing it, they put on a gag until the next time it needs to be removed.' } },
    { min: 7, max: 8, cum: 20, task: 'They cum onto your neck and tits.' },
    { min: 9, max: 10, cum: 30, task: 'They cum into a glass and force you to drink it.', attributeTasks: { [SADISTIC]: 'Instead of a glass, they cum into a bowl and force you to lick it all up from the bowl' } },
  ],
  [ANAL_CUM]: [
    { min: 1, max: 2, cum: 20, task: 'They pull out and cum on your clitty.' },
    { min: 3, max: 5, cum: 30, task: 'They cum inside your ass and let it leak out slowly.', attributeTasks: { [KINKY]: 'Instead of letting it leak, they insert a buttplug until the next time it needs to be removed.' } },
    { min: 6, max: 8, cum: 30, task: 'They cum inside your ass and fuck it slow and deep for 1 minute.' },
    { min: 9, max: 10, cum: 50, task: 'They cum balls deep inside your ass. Gape and let it leak out.', attributeTasks: { [SADISTIC]: 'They force you to lick up the leaked cum.' } },
  ],
  [CUM_NEXT]: [
    { min: 1, max: 2, task: ANAL_POSITION, description: 'No, they eye your ass obviously looking to another round.' },
    { min: 3, max: 4, task: ORAL_POSITION, description: 'No, they lick their lips imagining your plump lips around their still hard cock.' },
    { min: 5, max: 5, task: HUMILIATION, description: 'No, a devilish smile splits their face after seeing you covered in their cum.' },
    { min: 6, max: 6, task: PUNISHMENT, description: 'No, if anything they seem angrier than ever.' },
    { min: 7, max: 10, task: PAYMENT, description: 'Yes, move on to payment.' },
  ],
  [PAYMENT]: [
    { min: 1, max: 1, amount: 150, task: '$150', description: 'They are impressed with your skills and leave a tip.' },
    { min: 2, max: 5, amount: 100, task: '$100', description: 'They pay as expected.' },
    { min: 6, max: 7, amount: 100, task: '$100', description: 'They pay under the condition that you deepthroat them one last time. They hold you down balls deep for 10 seconds.' },
    { min: 8, max: 9, amount: 50, task: '$50', description: 'With you disoriented after a good pounding with a dumb bimbo brain, they dash out after tucking a bill in your bra.' },
    { min: 10, max: 10, amount: 0, task: '$0', description: 'They drug you. You wake up in a hogtie with a gag, chastity, and buttplug. After you wake up, 10 minutes pass before someone finds you and releases you.' },
  ],
}

export interface EffectDetail {
  description: string;
  expiration: 'task' | 'client' | 'game'
}

export const effectDetails: { [name in Effect]: EffectDetail } = {
  [SENSITIVE]: {
    description: 'Extra sensitive, moaning like a slut.',
    expiration: 'client'
  },
  [A2M]: {
    description: 'Performing anal followed by oral.',
    expiration: 'task'
  },
  [A2M_THROATING]: {
    description: 'The next oral will be a brutal throating.',
    expiration: 'task'
  },
  [LOCKED]: {
    description: 'Locked in chastity.',
    expiration: 'client'
  },
  [PERMALOCKED]: {
    description: 'Locked in chastity permanently until your debt is settled.',
    expiration: 'game'
  },
  [FACIAL]: {
    description: 'Face full of cum.',
    expiration: 'client'
  },
  [SELFIE]: {
    description: 'Focusing on a slutty selfie.',
    expiration: 'task'
  },
  [PLUGGED]: {
    description: 'Largest butt plug inserted.',
    expiration: 'task'
  },
  [PLUGGED_SNAKE]: {
    description: 'Long, snake-like plug (or secured dildo) inserted.',
    expiration: 'task'
  },
  [MAKEUP]: {
    description: 'Fixing makeup after it gets ruined.',
    expiration: 'client'
  },
  [MAKEUP_DESTROYER]: {
    description: 'The next oral will definitely ruin your makeup.',
    expiration: 'task'
  },
  [CLEANER]: {
    description: 'Licking the cock clean after anal and cum.',
    expiration: 'client'
  },
  [LIMP]: {
    description: 'Smacking balls limp when they get hard.',
    expiration: 'client'
  },
}

export interface GameState {
  // Options
  strokeSpeedUnit: 'bpm' | 'percent';
  taskTimeModifier: '0.5' | '1' | '1.5';
  debugMode: boolean;

  // Globals
  debtPaid: number;
  debt: number | null;
  uniform: number | null;
  stage: number;
  currentEvent: Event;

  // Client
  client: number | null;
  satisfaction: number | null;
  bondage: number | null;
  outfit: number | null;

  //Task
  currentTask?: {
    task: Event
    position?: number
    modifier?: number
  }

  effects: Effect[]
}

/* UTILITIES */
export type Decision = { min: number, max: number, [key: string]: any }
export function findDecision(roll: number, decisionSet: Decision[]) {
  for (const decision of decisionSet) {
    if (decision.min <= roll && roll <= decision.max) {
      return decision
    }
  }
}

/**
* Parameters: numeric min, numeric max, boolean integer
* Return: random numeric between min and max inclusive. Reduced to int if (integer == true)
**/
export function randRange(min: number, max: number, integer: boolean = true) {
  if (integer) {
    return Math.floor(Math.random() * ((max - min) + 1) + min);
  } else {
    return Math.random() * ((max - min) + 1) + min;
  }
}

export function bpmToPercent(bpm: number) {
  return Math.min((bpm - 20) / 10 * 4 + 2, 100)
}