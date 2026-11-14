export type RulesBlock =
  | { type: 'rule'; num: string; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'ordered'; items: string[]; start?: number };

export type RulesSubsection = {
  id: string;
  title: string;
  blocks: RulesBlock[];
};

export type RulesSection = {
  id: string;
  number: number;
  title: string;
  subsections: RulesSubsection[];
};

export const TOURNAMENT_RULES_INTRO =
  'Official TOURNAX Season 3 rulebook. All participants must read and follow these rules for group chat conduct, match rooms, results, statistics and walkovers. Where the committee must decide, their ruling is final.';

/** Shown in the “At a glance” strip — scores, points and deadlines players cite most often. */
export const TOURNAMENT_RULES_KEY_FACTS: { label: string; value: string }[] = [
  { label: 'Match win', value: '3 pts' },
  { label: 'Draw', value: '1 pt each' },
  { label: 'Loss', value: '0 pts' },
  { label: 'Deadline walkover (ready player)', value: '3–0 · 3 pts' },
  { label: 'Both miss deadline (group)', value: '0–0 · 1 pt each' },
  { label: 'Room-rule rematch window', value: '24 hours' },
  { label: 'Connection rematch window', value: '45 or 90 min' },
];

export const TOURNAMENT_RULES_SECTIONS: RulesSection[] = [
  {
    id: 'conduct',
    number: 1,
    title: 'Group Behaviour & Code of Conduct',
    subsections: [
      {
        id: 'conduct-main',
        title: 'General conduct',
        blocks: [
          {
            type: 'rule',
            num: '1.1',
            text: 'All members must stay polite, respectful and sportsmanlike towards one another at all times.',
          },
          {
            type: 'rule',
            num: '1.2',
            text: 'Abusive language, offensive remarks or behaviour that makes others uncomfortable will not be tolerated and may lead to disciplinary action.',
          },
          {
            type: 'rule',
            num: '1.3',
            text: 'Anyone who breaks tournament rules faces consequences without exception. Admins and the committee review the case and make the final call.',
          },
          {
            type: 'rule',
            num: '1.4',
            text: 'Members may share opinions, suggestions and concerns freely, but all discussion must stay mature, professional and respectful.',
          },
          {
            type: 'rule',
            num: '1.5',
            text: 'For any allegation or complaint, both the complainant and the accused must provide valid evidence to support their claim or response.',
          },
          {
            type: 'rule',
            num: '1.6',
            text: 'Allegations without valid evidence may be dismissed. Members who make false or baseless claims may also face disciplinary action.',
          },
          {
            type: 'rule',
            num: '1.7',
            text: 'Everyone is expected to keep mutual respect, fairness and a healthy competitive atmosphere throughout the tournament.',
          },
        ],
      },
    ],
  },
  {
    id: 'admins-only',
    number: 2,
    title: 'Admins-Only Group Rules',
    subsections: [
      {
        id: 'admins-only-main',
        title: 'When the group is admins-only',
        blocks: [
          {
            type: 'rule',
            num: '2.1',
            text: 'Admins may manage, change and maintain group settings — including enabling or disabling Admins Only mode — whenever necessary.',
          },
          {
            type: 'rule',
            num: '2.2',
            text: 'Major setting changes or admin decisions must be discussed and agreed by the committee, including admins.',
          },
          {
            type: 'rule',
            num: '2.3',
            text: 'While Admins Only mode is on, participants who need to share updates or concerns must contact admins by direct message.',
          },
          {
            type: 'rule',
            num: '2.4',
            text: 'When Admins Only is enabled, participants should understand why, respect the decision and cooperate with the committee.',
          },
          {
            type: 'rule',
            num: '2.5',
            text: 'For enquiries, clarifications or tournament issues, contact the relevant committee member.',
          },
          {
            type: 'rule',
            num: '2.6',
            text: 'All participants must respect committee decisions and follow group communication guidelines.',
          },
        ],
      },
    ],
  },
  {
    id: 'room-creation',
    number: 3,
    title: 'Room Creation Rules',
    subsections: [
      {
        id: 'room-basics',
        title: 'Home & away',
        blocks: [
          {
            type: 'list',
            items: [
              'Each player gets a fair turn hosting the match room under the ||Home & Away|| fixture list.',
              'The ||Home|| player creates the room and must apply official tournament settings. Mistakes or violations are the Home player’s responsibility.',
              'The ||Away|| player may object if room rules are broken. Either side may cite a violation only with valid evidence.',
            ],
          },
        ],
      },
      {
        id: 'room-violations',
        title: 'Violations & match results',
        blocks: [
          {
            type: 'rule',
            num: '3.1',
            text: 'If Home breaks a room-creation rule but still wins, Away may appeal with valid proof of the violation.',
          },
          {
            type: 'rule',
            num: '3.2',
            text: 'If Home wins despite a room violation and Away provides no valid evidence, the original result stands and Home keeps the win.',
          },
          {
            type: 'rule',
            num: '3.3',
            text: 'If Home breaks a room rule and loses, the result stands in favour of Away.',
          },
        ],
      },
      {
        id: 'room-rematch',
        title: 'Rematch & evidence',
        blocks: [
          {
            type: 'rule',
            num: '3.4',
            text: 'When a room violation is proven with valid evidence, both players must play a rematch for the official result.',
          },
          {
            type: 'rule',
            num: '3.5',
            text: 'The rematch must finish within ||24 hours|| of the original kick-off.',
          },
          {
            type: 'rule',
            num: '3.6',
            text: 'If Home fails to play or finish the rematch in time, Away gets a ||0–1|| walkover and ||3 points||.',
          },
          {
            type: 'rule',
            num: '3.7',
            text: 'If Away fails to play or finish the rematch in time, Home gets a ||0–1|| walkover and ||3 points||.',
          },
          {
            type: 'rule',
            num: '3.8',
            text: 'Appeals need clear evidence (screenshot or screen recording). The committee reviews disputes and decides finally.',
          },
          {
            type: 'rule',
            num: '3.9',
            text: 'Room complaints should use clear, unedited screen recordings. Screenshots count only if both players agree they are valid.',
          },
          {
            type: 'rule',
            num: '3.10',
            text: 'Recordings must show the violation clearly — no cuts, edits or manipulation.',
          },
        ],
      },
    ],
  },
  {
    id: 'gameplay',
    number: 4,
    title: 'Gameplay Rules',
    subsections: [
      {
        id: 'gameplay-connection',
        title: 'Connection & interruptions',
        blocks: [
          {
            type: 'rule',
            num: '4.1',
            text: 'If lag, network issues or connection errors interrupt a match, both players discuss what happened and agree how to proceed.',
          },
          {
            type: 'rule',
            num: '4.2',
            text: 'By mutual agreement, a rematch may be played within ||45 minutes|| or ||90 minutes|| of the interruption.',
          },
          {
            type: 'rule',
            num: '4.3',
            text: 'Both players should cooperate in good faith so the match finishes without needless disputes.',
          },
          {
            type: 'rule',
            num: '4.4',
            text: 'If a rematch is agreed, it must be completed before the group stage ends.',
          },
          {
            type: 'rule',
            num: '4.5',
            text: 'Disagreements on connection issues, continuing play or rematches must be reported to the committee.',
          },
        ],
      },
      {
        id: 'gameplay-guidelines',
        title: 'Score confirmation & fair play',
        blocks: [
          {
            type: 'rule',
            num: '4.6',
            text: 'Confirm the final score when the match ends. Report disagreements at once with supporting evidence.',
          },
          {
            type: 'rule',
            num: '4.7',
            text: 'If players cannot agree, the committee reviews evidence and decides whether to continue, restart or award the match.',
          },
          {
            type: 'rule',
            num: '4.8',
            text: 'Do not use technical problems to delay matches past deadlines. Extensions need committee approval.',
          },
          {
            type: 'rule',
            num: '4.9',
            text: 'Intentional disconnects or exploiting connection issues to gain an advantage are forbidden.',
          },
          {
            type: 'rule',
            num: '4.10',
            text: 'Leaving a match early without a valid reason may be treated as a violation and reviewed by the committee.',
          },
        ],
      },
      {
        id: 'gameplay-abandonment',
        title: 'Abandonment & stats',
        blocks: [
          {
            type: 'rule',
            num: '4.11',
            text: 'If a player quits before full time to gain an unfair edge, the opponent’s in-match stats may be based on their average from previous matches.',
          },
          {
            type: 'rule',
            num: '4.12',
            text: 'The player who abandons gets ||zero|| on individual match stats except goals scored/conceded, which follow the official result.',
          },
          {
            type: 'rule',
            num: '4.13',
            text: 'On a player’s first tournament match (no prior stats), the committee sets a fair statistical record from the situation.',
          },
          {
            type: 'rule',
            num: '4.14',
            text: 'The committee may review the incident, verify evidence and decide the result and stat adjustments.',
          },
        ],
      },
    ],
  },
  {
    id: 'statistics',
    number: 5,
    title: 'Statistics & Record-Keeping',
    subsections: [
      {
        id: 'statistics-main',
        title: 'Screenshots & special results',
        blocks: [
          {
            type: 'rule',
            num: '5.1',
            text: 'Result and statistics screenshots are compulsory every match. Rankings and individual awards use submitted screenshots only.',
          },
          {
            type: 'rule',
            num: '5.2',
            text: 'Room-creation walkover (||0–1||): individual match stats are ||zero|| except goals scored/conceded per the awarded score.',
          },
          {
            type: 'rule',
            num: '5.3',
            text: 'Deadline walkover (||3–0||): only official goals (including conceded) are recorded; all other individual stats stay ||zero|| for both players.',
          },
          {
            type: 'rule',
            num: '5.4',
            text: 'Double no-show draw (||0–0||): each player gets ||1 point|| only; other match statistics stay ||zero||.',
          },
          {
            type: 'rule',
            num: '5.5',
            text: 'Submit clear, valid screenshots. Missing or unclear proof can affect stats and awards.',
          },
        ],
      },
      {
        id: 'statistics-screenshots',
        title: 'Screenshots — both players',
        blocks: [
          {
            type: 'rule',
            num: '5.6',
            text: 'Do not rely only on your opponent’s screenshots. Images can be ||edited||, ||manipulated|| or misused to change match statistics.',
          },
          {
            type: 'rule',
            num: '5.7',
            text: '||Both players|| are equally responsible for capturing and keeping screenshots of the ||match result and statistics|| immediately after each match.',
          },
        ],
      },
    ],
  },
  {
    id: 'standings',
    number: 6,
    title: 'Standings & Tie-Breakers',
    subsections: [
      {
        id: 'standings-order',
        title: 'Group-stage ranking order',
        blocks: [
          {
            type: 'paragraph',
            text: 'If two or more players are level, rank them using the criteria below in this exact order:',
          },
          {
            type: 'ordered',
            start: 1,
            items: [
              '||Total points|| — higher points rank above.',
              '||Goals scored (GF)|| — more goals rank above.',
              '||Goals conceded (GA)|| — fewer goals conceded rank above.',
              '||Head-to-head points|| between tied players.',
              '||Head-to-head goal difference|| between tied players.',
              '||Red cards|| — fewer red cards rank above.',
              '||Yellow cards|| — fewer yellow cards rank above.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'walkover',
    number: 7,
    title: 'Walkover Rules',
    subsections: [
      {
        id: 'walkover-intro',
        title: 'Deadlines',
        blocks: [
          {
            type: 'list',
            items: [
              'Complete group-stage and knockout fixtures by the deadline set for each round.',
              'Players may schedule matches together any time before the deadline.',
              'Matches not finished in time follow the walkover rules below.',
            ],
          },
        ],
      },
      {
        id: 'walkover-group',
        title: 'Group stage',
        blocks: [
          {
            type: 'rule',
            num: '7.1',
            text: 'If one player is ready to play and the opponent misses the deadline, the ready player wins ||3–0|| and earns ||3 points||.',
          },
          {
            type: 'rule',
            num: '7.2',
            text: 'If both miss the deadline, the match is recorded ||0–0|| with ||1 point|| for each player.',
          },
        ],
      },
      {
        id: 'walkover-knockout',
        title: 'Knockout stage',
        blocks: [
          {
            type: 'rule',
            num: '7.3',
            text: 'If one player is ready and the opponent misses the deadline, the ready player wins ||3–0|| and advances.',
          },
          {
            type: 'rule',
            num: '7.4',
            text: 'If both miss the deadline, both are eliminated.',
          },
          {
            type: 'rule',
            num: '7.5',
            text: 'If this happens in quarter-finals or semi-finals, remaining qualifiers may progress or the committee may arrange a play-off to fill the slot.',
          },
        ],
      },
      {
        id: 'walkover-tiebreak',
        title: 'Knockout qualification procedure',
        blocks: [
          {
            type: 'rule',
            num: '7.6',
            text: 'One player no-show: the available player gets ||3–0|| and advances.',
          },
          {
            type: 'rule',
            num: '7.7',
            text: 'Both no-show (no approved extension): both are eliminated; the committee decides how to fill the vacant qualification spot.',
          },
          {
            type: 'rule',
            num: '7.8',
            text: 'Quarter-finals: if both are eliminated, the committee may pick from other quarter-final losers or run a special qualification match.',
          },
          {
            type: 'rule',
            num: '7.9',
            text: 'Semi-finals: if both are eliminated, eligible quarter-final losers may play a special match for the vacant final spot.',
          },
          {
            type: 'rule',
            num: '7.10',
            text: 'Special qualification matches use the same knockout settings. The committee sets fixture, schedule and deadline. Valid emergencies may get extra time before walkover or elimination.',
          },
          {
            type: 'rule',
            num: '7.11',
            text: 'All qualification calls, special fixtures and exceptions are approved by the committee. Their decision is final.',
          },
        ],
      },
      {
        id: 'walkover-extensions',
        title: 'Deadline extensions',
        blocks: [
          {
            type: 'rule',
            num: '7.12',
            text: 'For emergencies or other valid reasons, players may request more time to finish a match.',
          },
          {
            type: 'rule',
            num: '7.13',
            text: 'Tell the relevant committee member before the original deadline and explain the delay.',
          },
          {
            type: 'rule',
            num: '7.14',
            text: 'The committee decides on extensions case by case. Their decision is final.',
          },
        ],
      },
    ],
  },
];
