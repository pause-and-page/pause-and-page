/* Pause and Page — app logic.
   Local-first: everything is stored on this device only. No network calls. */
(function () {
'use strict';
const w = window, doc = document;
const KEY = 'pauseandpage.v1';
const MORN = 'One manageable step is enough to begin.';
const EVE = 'You can leave unfinished things for tomorrow.';
const MED_NOTE = 'Do not include patient names or identifying clinical information.';
const SAFE_INTRO = 'Choose a manageable everyday situation. You do not need to revisit your most distressing experience.';
const EXP_INTRO = 'Use a small, safe everyday situation. Do not use this exercise to test dangerous situations, harassment, or abuse.';
const NOTICE = 'This app is not an emergency service. Entries are not continuously monitored.';
const APP = !!w.Android;

/* ---------- icons ---------- */
const ICON = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z"/><path d="M12 14c0-3-2.5-5.5-7-5.5 0 3 2.5 5.5 7 5.5z"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  chart: '<path d="M5 20V11M11 20V5M17 20v-6M3 20h18"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  leaf: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l7-7"/>',
  wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>'
};
function ic(n) { return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ''}</svg>`; }

/* ---------- content ---------- */
const MOODS = ['Very low', 'Low', 'Neutral', 'Good', 'Very good'];
const EMO = ['Worry', 'Sadness', 'Anger', 'Guilt', 'Shame', 'Frustration', 'Disappointment', 'Other'];
const BODY = ['Tension', 'Restlessness', 'Heaviness', 'Racing heart', 'Tiredness', 'No noticeable change', 'Other'];
const YN = ['Yes', 'Possibly', 'No', 'Not sure'];

const AFF = {
  'Self-compassion': ['I can treat myself with the patience I would offer a friend.', 'Having a hard day does not make me a failure.', 'I am allowed to be a work in progress.', 'My feelings make sense, even when they are uncomfortable.', 'I can speak to myself kindly, even after a mistake.'],
  'Confidence': ['I can practise speaking even when I feel nervous.', 'I can take one manageable step even when I feel uncertain.', 'I have handled difficult things before, and I can learn from them.', 'My worth is not decided by one result.', 'I can ask a question without needing to know everything.'],
  'Study or work pressure': ['One manageable step is enough to begin.', 'I can focus on the next small task, not the whole list.', 'Steady, good-enough work still counts.', 'I can ask for help with the parts that are unclear.', 'Feedback is information about my work, not a verdict on me.'],
  'Boundaries': ['I can say no to some things so I can say yes to what matters.', 'It is okay to take time before I reply.', 'I can protect my rest without explaining every reason.', 'Other people’s expectations are not all my responsibility.'],
  'Rest': ['Rest is part of doing things well, not a reward I must earn.', 'I can leave unfinished things for tomorrow.', 'My body is allowed to slow down tonight.', 'Pausing is not the same as giving up.'],
  'Gratitude': ['I can notice one small thing that went okay today.', 'Small moments of comfort still count.', 'I can appreciate the people who make things a little easier.', 'There is room for both difficulty and appreciation today.']
};

const Q = {
  /* onboarding 1–10 */
  q1: { q: 'Are you aged 18 years or above?', t: 'one', o: ['Yes', 'No'], req: 1 },
  name: { q: 'What would you like to be called?', t: 'short', help: 'Used only for your greeting.', opt: 1 },
  q2: { q: 'Which best describes your current role?', t: 'one', o: ['UG student', 'PG student', 'Medical professional', 'Other'], req: 1 },
  q3: { q: 'What would you most like support with?', t: 'multi', max: 3, help: 'Choose up to three.', o: ['Academic or work pressure', 'Worrying', 'Low mood', 'Procrastination', 'Sleep', 'Confidence', 'Relationships', 'Adjusting to change', 'Other'] },
  q4: { q: 'What would you like to be able to do more comfortably?', t: 'short', ph: 'For example: speak up in seminars' },
  q5: { q: 'Have you used CBT-based exercises before?', t: 'one', o: ['No', 'A little', 'Regularly', 'Not sure'] },
  q6: { q: 'How much time would you usually like to spend in the app?', t: 'one', o: ['2–5 minutes', '5–10 minutes', 'More than 10 minutes'] },
  q7: { q: 'Would you like morning and evening reminders?', t: 'one', o: ['Morning', 'Evening', 'Both', 'Neither'] },
  q8: { q: 'When would you prefer your reminders?', t: 'times' },
  q8s: { q: 'Do you work shifts?', t: 'one', o: ['Regular hours', 'I work shifts'], opt: 1, help: 'If you work shifts, set times around when you usually wake and wind down. You can change them any time.' },
  q9: { q: 'Which affirmation themes would you like?', t: 'multi', o: Object.keys(AFF) },
  q10: { q: 'How should reminders appear on your lock screen?', t: 'one', o: ['Show affirmation text', 'Show a private reminder only'] },
  snd: { q: 'Reminder sound', t: 'one', o: ['Sound on', 'Silent'] },
  /* check-in 11–16 */
  q11: { q: 'How would you describe your mood right now?', t: 'one', o: MOODS },
  q12: { q: 'How much energy do you have right now?', t: 'scale10', lo: 'No energy', hi: 'High energy' },
  q13: { q: 'How restful did your sleep feel?', t: 'one', o: ['Not restful', 'Slightly', 'Moderately', 'Very', 'Extremely', 'I have not slept yet'] },
  q14: { q: 'What is taking up the most space in your mind?', t: 'short', opt: 1 },
  q15: { q: 'What do you need most today?', t: 'one', o: ['Rest', 'Structure', 'Connection', 'Practical help', 'Personal space', 'Other'], opt: 1 },
  q16: { q: 'What is one manageable intention for today?', t: 'short', opt: 1, ph: 'Something small and realistic' },
  /* thought record 17–30 */
  q17: { q: 'What happened? Describe the situation without interpreting it.', t: 'long', ph: 'Where were you, who was there, what was said or done?' },
  q18: { q: 'What thought or image came to mind?', t: 'long' },
  q19: { q: 'What did that thought mean to you?', t: 'long', opt: 1 },
  q20: { q: 'Which emotions did you notice?', t: 'multi', o: EMO },
  q21: { q: 'How strong was the main emotion?', t: 'r100', opt: 1 },
  q22: { q: 'What did you notice in your body?', t: 'multi', o: BODY, opt: 1 },
  q23: { q: 'What did you do, or feel like doing?', t: 'long' },
  q24: { q: 'What facts support your interpretation?', t: 'long' },
  q25: { q: 'What facts suggest another interpretation?', t: 'long' },
  q26: { q: 'What information is missing or uncertain?', t: 'long' },
  q27: { q: 'What would you say to a friend in the same situation?', t: 'long' },
  q28: { q: 'What is a balanced response that you can reasonably believe?', t: 'long', help: 'It doesn’t have to be positive — just fair.' },
  q29: { q: 'What small, helpful action could you take?', t: 'short' },
  q30: { q: 'How strong is the emotion now, if you would like to record it?', t: 'r100', opt: 1, help: 'A change in this number doesn’t decide whether the exercise worked.' },
  /* thinking patterns 31–37 */
  pt0: { q: 'Which thought are you looking at?', t: 'long', ph: 'Write the thought in a few words' },
  q31: { q: 'Am I treating this situation as completely good or completely bad?', t: 'one', o: YN },
  q32: { q: 'Am I predicting an outcome before knowing what will happen?', t: 'one', o: YN },
  q33: { q: 'Am I assuming what another person thinks without checking?', t: 'one', o: YN },
  q34: { q: 'Am I using one event to make a conclusion about my whole life or ability?', t: 'one', o: YN },
  q35: { q: 'Am I overlooking information that does not fit my first thought?', t: 'one', o: YN },
  q36: { q: 'Am I applying a rule such as “I must always succeed” or “I should never need help”?', t: 'one', o: YN },
  q37: { q: 'Which question helped you look at the situation differently?', t: 'long', opt: 1 },
  /* small action 38–45 */
  q38: { q: 'What activity would matter to you today?', t: 'one', o: ['Study or work', 'Rest', 'Connection', 'Personal care', 'Enjoyment', 'Other'] },
  q39: { q: 'What is making this activity difficult to start?', t: 'multi', o: ['Uncertainty', 'Tiredness', 'Fear of mistakes', 'Task feels too large', 'Limited resources', 'Other'] },
  q40: { q: 'What is the smallest useful first step?', t: 'short' },
  q41: { q: 'When and where could you try it?', t: 'time' },
  q42: { q: 'What help or resource would make it easier?', t: 'short', opt: 1 },
  q43: { q: 'What would be a reasonable stopping point?', t: 'short' },
  q44: { q: 'After trying it, what did you notice?', t: 'long' },
  q45: { q: 'What would you repeat or adjust next time?', t: 'long' },
  /* behavioural experiment 46–52 */
  q46: { q: 'What are you predicting will happen?', t: 'long' },
  q47: { q: 'How strongly do you believe this prediction?', t: 'r100', opt: 1 },
  q48: { q: 'What small, safe action could help you explore it?', t: 'short' },
  q49: { q: 'What observable outcome would support your prediction?', t: 'long' },
  q50: { q: 'What observable outcome would suggest a different conclusion?', t: 'long' },
  q51: { q: 'What actually happened?', t: 'long' },
  q52: { q: 'What did you learn, and what remains uncertain?', t: 'long' },
  /* five-minute journal and evening 53–60 */
  q53: { q: 'What stood out to you today?', t: 'long' },
  q54: { q: 'What felt difficult?', t: 'long' },
  q55: { q: 'What helped, even slightly?', t: 'long' },
  q56: { q: 'What effort would you like to acknowledge?', t: 'long' },
  q57: { q: 'Was there a moment of connection, comfort, or appreciation?', t: 'long', opt: 1 },
  q58: { q: 'What do you need tonight?', t: 'one', o: ['Rest', 'Connection', 'Practical support', 'Quiet', 'Other'] },
  q59: { q: 'What can wait until tomorrow?', t: 'long' },
  q60: { q: 'Is there anything you would like to discuss with someone you trust?', t: 'long', opt: 1 },
  /* affirmation personalisation 61–65 */
  q61: { q: 'How does this statement feel to you?', t: 'one', o: ['Supportive', 'Neutral', 'Uncomfortable', 'Not relevant'] },
  q62: { q: 'How believable does it feel right now?', t: 'one', o: ['Not believable', 'Partly believable', 'Believable'] },
  q63: { q: 'Would you like to keep it, change the wording, or choose another?', t: 'one', o: ['Keep', 'Edit', 'Another'] },
  q64: { q: 'What would be a kinder, realistic statement in your own words?', t: 'short', opt: 1, ph: 'For example: I can practise speaking even when I feel nervous.' },
  q65: { q: 'Is there a small action you would like to connect with this statement?', t: 'short', opt: 1 },
  /* weekly review 66–73 */
  q66: { q: 'Which situations affected you most this week?', t: 'multi', o: ['Study or coursework', 'Work or shifts', 'Relationships', 'Health or sleep', 'Money or housing', 'Family', 'Other'] },
  q67: { q: 'Which exercise or strategy felt useful?', t: 'multi', o: ['Thought record', 'Situation map', 'Thinking patterns', 'Small action', 'Problem solving', 'Behavioural experiment', 'Personal rules', 'Journaling', 'Grounding', 'None yet', 'Other'] },
  q68: { q: 'What did you learn about your thoughts or responses?', t: 'long' },
  q69: { q: 'Which action did you attempt, and what happened?', t: 'long' },
  q70: { q: 'How manageable did your usual responsibilities feel?', t: 'one', o: ['Not manageable', 'Slightly', 'Moderately', 'Mostly', 'Very manageable'] },
  q71: { q: 'What made practising difficult?', t: 'multi', o: ['Time', 'Energy', 'Privacy', 'Exercise did not fit', 'Unclear instructions', 'Other'] },
  q72: { q: 'What would you like to continue or change next week?', t: 'long' },
  q73: { q: 'Would additional support be helpful?', t: 'one', o: ['Yes', 'Maybe', 'No'] },
  /* pathway 74–80 */
  q74: { q: 'Which part of college life feels hardest to manage right now?', t: 'long', role: 'ug' },
  q75: { q: 'When you compare yourself with classmates, what conclusion do you make about yourself?', t: 'long', role: 'ug' },
  q76: { q: 'What thought comes up when you receive feedback on your work?', t: 'long', role: 'pg' },
  q77: { q: 'Which part of your research or dissertation needs practical help rather than more self-pressure?', t: 'long', role: 'pg' },
  q78: { q: 'Which part of your recent work has stayed on your mind?', t: 'long', role: 'med' },
  q79: { q: 'What factors were within your control, and what factors were outside it?', t: 'long', role: 'med' },
  q80: { q: 'What support, rest, or workplace change would help you?', t: 'long', role: 'med' },
  /* sharing 81–85 */
  q81: { q: 'Would you like to share selected information with someone you trust?', t: 'one', o: ['Yes', 'Not now'] },
  q82: { q: 'What would you like to share?', t: 'one', o: ['Selected goals', 'Weekly summary', 'Request for support', 'Individually selected entry'] },
  q83: { q: 'What would you like this person to understand or help with?', t: 'long' },
  /* support plan 86–89 */
  q86: { q: 'What signs tell you that you need additional support?', t: 'long' },
  q87: { q: 'Who could you contact when you feel overwhelmed or unsafe?', t: 'long' },
  q88: { q: 'Where could you go to be with someone and feel safer?', t: 'long' },
  q89: { q: 'Which professional or campus service could you contact?', t: 'long' },
  /* guided CBT journal */
  j1: { q: 'What happened?', t: 'long' },
  j2: { q: 'What did I think it meant?', t: 'long' },
  j3: { q: 'What did I feel, notice in my body, and do?', t: 'long' },
  j4: { q: 'What evidence supports or challenges my interpretation?', t: 'long' },
  j5: { q: 'What is a balanced response?', t: 'long' },
  j6: { q: 'What action could I try?', t: 'long' },
  j7: { q: 'What did I learn?', t: 'long' },
  g1: { q: 'What is one thing you appreciated today, however small?', t: 'long' },
  g2: { q: 'Who or what made today a little easier?', t: 'long' },
  g3: { q: 'What did you do today that you’d like to recognise?', t: 'long' },
  free: { q: 'Write freely', t: 'long', rows: 14, ph: 'Whatever is on your mind. No one else will see this.' },
  /* problem solving (module 5) */
  p1: { q: 'What is the problem? Describe it as specifically as you can.', t: 'long' },
  p2: { q: 'Which part can you act on, and which part is uncertainty you cannot settle today?', t: 'long' },
  p3: { q: 'List two or three possible solutions, including imperfect ones.', t: 'long' },
  p4: { q: 'For your most workable option, what might help and what might get in the way?', t: 'long' },
  p5: { q: 'What is the first step, and when will you try it?', t: 'short' },
  pr1: { q: 'What happened when you tried it?', t: 'long' },
  pr2: { q: 'What would you keep, adjust, or try instead?', t: 'long' },
  /* personal rules (module 7) */
  r1: { q: 'Which rule or expectation have you noticed?', t: 'long', ph: 'For example: “I must never make mistakes”' },
  r2: { q: 'Where might this rule have come from, and how has it helped you?', t: 'long' },
  r3: { q: 'What does this rule cost you when it is applied strictly?', t: 'long' },
  r4: { q: 'What would a more flexible version sound like?', t: 'long', ph: 'For example: “I aim for careful work, and mistakes help me learn”' },
  r5: { q: 'What is one small way to practise the flexible version this week?', t: 'short' },
  /* maintenance (module 8) */
  m1: { q: 'Which ideas or exercises have been most useful to you?', t: 'long' },
  m2: { q: 'What early signs suggest a difficult period may be starting?', t: 'long' },
  m3: { q: 'What will you do first when you notice those signs?', t: 'long' },
  m4: { q: 'Which routines help you stay steady — rest, connection, movement, structure?', t: 'long' },
  m5: { q: 'Who and what will you turn to for support?', t: 'long' }
};

const EX = {
  map: { t: 'Map a recent situation', m: 1, min: 5, intro: SAFE_INTRO, qs: ['q17', 'q18', 'q20', 'q22', 'q23'] },
  patterns: { t: 'Notice a thinking pattern', m: 2, min: 5, intro: 'These questions are prompts for reflection. There are no right answers and no score.', qs: ['pt0', 'q31', 'q32', 'q33', 'q34', 'q35', 'q36', 'q37'] },
  thought: { t: 'Balanced thought record', m: 3, min: 10, intro: SAFE_INTRO, qs: ['q17', 'q18', 'q19', 'q20', 'q21', 'q22', 'q23', 'q24', 'q25', 'q26', 'q27', 'q28', 'q29', 'q30'] },
  action: { t: 'Plan one small action', m: 4, min: 6, intro: 'Useful when it’s hard to get started, or when you’ve been pulling back from things.', qs: ['q38', 'q39', 'q40', 'q41', 'q42', 'q43'], review: ['q44', 'q45'] },
  problem: { t: 'Solve a practical problem', m: 5, min: 8, qs: ['p1', 'p2', 'p3', 'p4', 'p5'], review: ['pr1', 'pr2'] },
  experiment: { t: 'Plan a safe behavioural experiment', m: 6, min: 8, intro: EXP_INTRO, qs: ['q46', 'q47', 'q48', 'q49', 'q50'], review: ['q51', 'q52'] },
  rules: { t: 'Work with a personal rule', m: 7, min: 7, qs: ['r1', 'r2', 'r3', 'r4', 'r5'] },
  maintain: { t: 'My maintenance plan', m: 8, min: 8, qs: ['m1', 'm2', 'm3', 'm4', 'm5'] }
};

const FORMS = {
  j_guided: { t: 'Guided CBT journal', d: 'Answer any of these — skip what doesn’t fit today.', qs: ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7'] },
  j_five: { t: 'Five-minute journal', d: 'Pick one or two prompts. You don’t need to answer them all.', qs: ['q53', 'q54', 'q55', 'q56', 'q57'] },
  j_evening: { t: 'Evening reflection', d: 'Notice what helped and what you need next. Any prompt is enough.', qs: ['q53', 'q54', 'q55', 'q56', 'q57', 'q58', 'q59', 'q60'], sec: 'lilac' },
  j_grat: { t: 'Gratitude reflection', d: 'Small things count. There’s room for difficulty here too.', qs: ['g1', 'g2', 'g3'] },
  j_free: { t: 'Free writing', d: '', qs: ['free'] },
  j_path: { t: 'Prompts for you', d: 'Questions chosen for your pathway.', qs: [] },
  weekly: { t: 'Weekly review', d: 'Look back at the week — patterns, actions and support. Skip anything.', qs: ['q66', 'q67', 'q68', 'q69', 'q70', 'q71', 'q72', 'q73'], sec: 'lilac', med: false }
};

const LESSONS = [null,
  { t: 'Understand my response', f: 'How situations, thoughts, emotions, body and behaviour connect', ex: 'map',
    body: ['CBT looks at how a situation, the thoughts it sparks, your emotions, what you notice in your body, and what you do all influence one another.', 'This isn’t about blaming your thoughts. It’s about seeing the loop clearly, because a small change in any one part — a thought, an action, some rest — can ease the others.'],
    eg: { ug: 'A classmate doesn’t reply to your message about a group project. Thought: “They’re annoyed with me.” Emotion: worry. Body: a tight chest. Behaviour: you avoid the group chat for the rest of the day.',
          pg: 'Your supervisor reschedules your meeting. Thought: “My work must be disappointing.” Emotion: dread. Body: restlessness and poor sleep. Behaviour: you re-read your chapter late into the night instead of resting.',
          med: 'A senior colleague is brief with you on a busy shift. Thought: “I’ve made an error they’re not telling me about.” Emotion: anxiety. Body: tension, a fast heartbeat. Behaviour: you re-check notes repeatedly and skip your break.' },
    say: 'Noticing my reactions is a skill, not a judgement.' },
  { t: 'Notice thinking patterns', f: 'Recognising assumptions and recurring unhelpful interpretations', ex: 'patterns',
    body: ['Under pressure, minds take shortcuts: predicting the worst, guessing what others think, seeing things as all-or-nothing, or drawing a big conclusion from one event.', 'Everyone does this. The aim is to notice the pattern — “I’m predicting again” — without labelling yourself as irrational or broken.'],
    eg: { ug: 'After one low internal assessment mark: “I’m going to fail the whole year.” Pattern: one event used to judge your entire ability.',
          pg: 'A reviewer questions your methods: “Everyone will think my research is worthless.” Patterns: mind-reading and all-or-nothing thinking.',
          med: 'A patient’s family seems unhappy with an explanation: “I’m not cut out for this.” Pattern: one encounter used to judge a whole career.' },
    say: 'I can notice a thinking pattern without treating it as the full truth.' },
  { t: 'Review a difficult thought', f: 'Examining evidence and considering another perspective', ex: 'thought',
    body: ['A thought record slows a thought down so you can look at it. You note the facts that support it, the facts that don’t, and what you don’t yet know.', 'The goal isn’t positive thinking. It’s a balanced response you can actually believe — and one small action to go with it.'],
    eg: { ug: 'Thought: “I’ll embarrass myself in the presentation.” Supporting: I stumbled once in practice. Other facts: I knew the content when I rehearsed; classmates are mostly focused on their own turn. Balanced: “I may feel nervous and stumble a little, and I can still get my main points across.”',
          pg: 'Thought: “My supervisor thinks I’m not capable.” Supporting: the draft came back with many edits. Other facts: they called the argument promising; heavy edits are normal for drafts. Balanced: “The draft needs work — that’s what drafts are for.”',
          med: 'Thought: “I should have caught that sooner.” Supporting: in hindsight, a sign was there. Other facts: it was unclear at the time; I escalated when it became clearer; I was covering many patients. Balanced: “I can review what I’d do differently without deciding I’m incompetent.”' },
    say: 'A balanced thought doesn’t have to be positive; it has to be fair.' },
  { t: 'Take a manageable action', f: 'Reducing avoidance through realistic steps involving work, rest or connection', ex: 'action',
    body: ['Avoidance brings quick relief, but tasks and worries often grow while they wait. Mood and motivation frequently follow action rather than come before it.', 'Pick a step so small it feels almost too easy — for study or work, for rest, or for connection — then review how it went.'],
    eg: { ug: 'Instead of “study all weekend”: open the chapter 4 notes after lunch, read for 20 minutes, then stop.',
          pg: 'Instead of “finish the literature review”: list five papers to include and write two sentences about the first one.',
          med: 'After a run of night shifts, instead of “get my life back on track”: eat a proper meal and message one friend before sleeping.' },
    say: 'A small step counts, even if it isn’t the whole task.' },
  { t: 'Solve a practical problem', f: 'Distinguishing actionable problems from uncertainty', ex: 'problem',
    body: ['Some problems can be acted on; some parts are uncertainty that no amount of thinking will settle today. Mixing them up can keep you stuck in worry.', 'For the actionable part: define it, list options, choose one, try it, and review. For the uncertain part, notice it and decide when you’ll revisit it.'],
    eg: { ug: 'Rent is due and a scholarship payment is late. Actionable: email the scholarship office and ask about a short extension. Uncertain: exactly when the payment will arrive.',
          pg: 'Data collection is behind schedule. Actionable: list what’s causing the delay and ask your supervisor about narrowing the sample. Uncertain: what the final results will show.',
          med: 'Your rota leaves no time to prepare for an exam. Actionable: ask about swapping one shift and plan 30-minute study blocks. Uncertain: the exam result.' },
    say: 'I can act on what is in my control and set aside what isn’t, for now.' },
  { t: 'Test a prediction safely', f: 'Learning from observation rather than assumptions', ex: 'experiment',
    body: ['Many worries are predictions: “If I do this, that will happen.” A behavioural experiment is a small, safe way to check a prediction against what actually happens.', EXP_INTRO],
    eg: { ug: 'Prediction: “If I ask a question in class, people will laugh.” Experiment: ask one short question in a tutorial and notice how people actually respond.',
          pg: 'Prediction: “If I tell my supervisor I’m stuck, they’ll think less of me.” Experiment: mention one specific difficulty at your next meeting and observe the response.',
          med: 'Prediction: “If I ask a senior for advice, I’ll look incompetent.” Experiment: ask one clarifying question about a non-urgent case and notice what you learn.' },
    say: 'I can learn from what happens, not only from what I predict.' },
  { t: 'Work with personal rules', f: 'Reflecting on expectations such as “I must never make mistakes”', ex: 'rules',
    body: ['Personal rules often begin as sensible ways to cope or succeed. Applied strictly, they can turn into pressure, avoidance or harsh self-criticism.', 'You don’t have to drop your standards. A more flexible version keeps what you value and leaves room for being human.'],
    eg: { ug: 'Rule: “I must get top marks or I’ve wasted my family’s money.” Flexible: “I want to make good use of this opportunity, and one result doesn’t decide that.”',
          pg: 'Rule: “I can’t send work until it’s perfect.” Flexible: “Sharing drafts early helps the work get better.”',
          med: 'Rule: “A good doctor never needs help.” Flexible: “Asking for help is part of safe, good practice.”' },
    say: 'I can keep high standards and still be human.' },
  { t: 'Maintain useful skills', f: 'Reviewing what helped and preparing for future difficult periods', ex: 'maintain',
    body: ['Setbacks are a normal part of learning any skill. A short plan written on a steadier day makes it easier to act early on a harder one.', 'Note what has helped, your early warning signs, your first steps, and who you can turn to. Your support plan sits alongside this.'],
    eg: { ug: 'Before exams: “If I start skipping meals and avoiding friends, I’ll plan one small action and talk to my roommate.”',
          pg: 'Before submission: “If I’m re-reading the same page for hours, I’ll do a thought record and email my supervisor.”',
          med: 'Before a heavy rota: “If I can’t switch off after shifts, I’ll use a grounding exercise and talk to a colleague I trust.”' },
    say: 'Setbacks are part of learning, not a return to the start.' }
];

const GROUND = {
  five: { t: '5-4-3-2-1 senses', steps: ['Look around and name five things you can see.', 'Notice four things you can feel — your feet on the floor, your clothes, the chair beneath you.', 'Listen for three things you can hear, near or far.', 'Notice two things you can smell, or think of two scents you like.', 'Name one thing you can taste, or take a slow sip of water.'] },
  breathe: { t: 'Slow breathing' },
  steady: { t: 'Steady and slow', steps: ['Press your feet gently into the floor and notice the contact.', 'Let your shoulders drop a little as you breathe out.', 'Say to yourself: “This is a hard moment. It will change.”', 'Find one thing nearby in a colour you like, and look at it for a few breaths.', 'Choose one small next step: a glass of water, a message to someone, or stepping outside.'] }
};

/* ---------- state ---------- */
let S;
function defaults() {
  return {
    v: 1, onboarded: false, under18: false, obStep: 0, ob: {},
    profile: { name: '', q2: '', q3: [], q4: '', q5: '', q6: '', q7: 'Neither', mt: '07:30', et: '20:30', q8s: '', q9: [], q10: 'Show a private reminder only', snd: 'Sound on' },
    settings: { quiet: false, reduce: false, secure: false },
    checkins: {}, entries: [], explored: {},
    aff: { saved: [], custom: [], cur: '', i: 0, fb: [] },
    plan: {}, trusted: { name: '', phone: '' }, campus: {},
    share: { name: '', status: 'none', log: [] }, shareDraft: {}
  };
}
function merge(d, o) {
  Object.keys(o || {}).forEach(k => {
    const a = d[k], b = o[k];
    if (b && typeof b === 'object' && !Array.isArray(b) && a && typeof a === 'object' && !Array.isArray(a)) merge(a, b);
    else d[k] = b;
  });
  return d;
}
function load() {
  try { const raw = localStorage.getItem(KEY); S = raw ? merge(defaults(), JSON.parse(raw)) : defaults(); }
  catch (e) { S = defaults(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Couldn’t save on this device. Storage may be full.'); } }
let saveT = 0;
function setStat(t) { const s = doc.getElementById('saveStat'); if (s) s.textContent = t; }
function saveSoon() {
  setStat('Saving…');
  clearTimeout(saveT);
  saveT = setTimeout(() => { save(); setStat('Saved on this device'); }, 350);
}

/* ---------- helpers ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dkey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function fmtD(ts) { try { return new Date(ts).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return dkey(new Date(ts)); } }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function filled(v) { return Array.isArray(v) ? v.length > 0 : (v !== '' && v != null); }
function hasContent(a) { return Object.keys(a || {}).some(k => filled(a[k])); }
function ansText(v) { return Array.isArray(v) ? v.join(', ') : String(v); }
function roleKey() { const r = S.profile.q2; return r === 'UG student' ? 'ug' : r === 'PG student' ? 'pg' : r === 'Medical professional' ? 'med' : ''; }
function getE(id) { return S.entries.find(e => e.id === id); }
function telOf(p) { return String(p || '').replace(/[^\d+]/g, ''); }
function dayNum() { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
let toastT = 0;
function toast(t) {
  const el = doc.getElementById('toast'); if (!el) return;
  el.textContent = t; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2800);
}
function pathQs() { const r = roleKey(); return Object.keys(Q).filter(k => Q[k].role && Q[k].role === r); }
function formDef(ex) { const d = FORMS[ex]; if (ex === 'j_path') return Object.assign({}, d, { qs: pathQs() }); return d; }
function defOf(e) { return EX[e.ex] || formDef(e.ex); }
function firstLine(e) {
  const d = defOf(e); if (!d) return '';
  const ks = (d.qs || []).concat(d.review || []);
  for (let i = 0; i < ks.length; i++) { const v = e.a[ks[i]]; if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 90); }
  return '';
}
function planText(e) { const a = e.a; return a.q40 || a.q48 || a.p5 || ''; }
function ckToday() { const k = dkey(new Date()); if (!S.checkins[k]) S.checkins[k] = {}; return S.checkins[k]; }

/* ---------- affirmations ---------- */
function affPool() {
  const th = (S.profile.q9 && S.profile.q9.length) ? S.profile.q9 : Object.keys(AFF);
  let pool = S.aff.custom.slice();
  th.forEach(t => (AFF[t] || []).forEach(x => { if (pool.indexOf(x) < 0) pool.push(x); }));
  if (!pool.length) pool = [MORN];
  return pool;
}
function curAff() { if (S.aff.cur) return S.aff.cur; const p = affPool(); return p[dayNum() % p.length]; }
function nextAff() { const p = affPool(); S.aff.i = (S.aff.i + 1) % p.length; let n = p[(dayNum() + S.aff.i) % p.length]; if (n === curAff() && p.length > 1) n = p[(dayNum() + S.aff.i + 1) % p.length]; S.aff.cur = n; save(); }

/* ---------- native bridge ---------- */
function syncReminders() {
  if (!APP) return;
  const p = S.profile;
  const cfg = {
    morning: p.q7 === 'Morning' || p.q7 === 'Both',
    evening: p.q7 === 'Evening' || p.q7 === 'Both',
    mt: p.mt || '07:30', et: p.et || '20:30',
    lock: p.q10 === 'Show affirmation text' ? 'show' : 'private',
    sound: p.snd !== 'Silent',
    morningTexts: [MORN].concat(S.aff.saved.slice(0, 12)),
    eveningTexts: [EVE].concat(S.aff.saved.slice(0, 12))
  };
  try { w.Android.scheduleReminders(JSON.stringify(cfg)); } catch (e) { /* ignore */ }
}
let syncT = 0;
function syncSoon() { clearTimeout(syncT); syncT = setTimeout(syncReminders, 600); }
function askNotif() { if (APP) { try { w.Android.requestNotificationPermission(); } catch (e) { /* ignore */ } } }
function applySettings() {
  const b = doc.body; if (!b || !b.classList) return;
  b.classList.toggle('quiet', !!S.settings.quiet);
  b.classList.toggle('reduce', !!S.settings.reduce);
}

/* ---------- form binding ---------- */
const F = { t: null, cb: null, onPick: null };
function bindTo(t, cb, onPick) { F.t = t; F.cb = cb || null; F.onPick = onPick || null; }
function changed() { if (F.cb) F.cb(); saveSoon(); }

function qInput(k, t, bk) {
  const q = Q[k]; bk = bk || k; const v = t[bk];
  if (q.t === 'long') return `<textarea id="f_${bk}" data-bind="${bk}" rows="${q.rows || 4}" placeholder="${esc(q.ph || '')}">${esc(v)}</textarea>`;
  if (q.t === 'short') return `<input id="f_${bk}" type="text" data-bind="${bk}" value="${esc(v)}" placeholder="${esc(q.ph || '')}" autocomplete="off">`;
  if (q.t === 'one' || q.t === 'multi') {
    const multi = q.t === 'multi'; const arr = Array.isArray(v) ? v : [];
    let h = `<div class="chips" role="group" aria-label="${esc(q.q)}">` + q.o.map(o => {
      const on = multi ? arr.indexOf(o) >= 0 : v === o;
      return `<button type="button" class="chip${on ? ' on' : ''}" aria-pressed="${on}" data-act="pick" data-key="${bk}" data-val="${esc(o)}" data-multi="${multi ? 1 : 0}" data-max="${q.max || 0}">${esc(o)}</button>`;
    }).join('') + '</div>';
    if (q.o.indexOf('Other') >= 0) h += `<input type="text" class="other" data-bind="${bk}_other" value="${esc(t[bk + '_other'])}" placeholder="Other — a few words (optional)" autocomplete="off" aria-label="Other">`;
    return h;
  }
  if (q.t === 'scale10') {
    let h = `<div class="chips scale" role="group" aria-label="${esc(q.q)}">`;
    for (let i = 0; i <= 10; i++) { const on = String(v) === String(i); h += `<button type="button" class="chip${on ? ' on' : ''}" aria-pressed="${on}" data-act="pick" data-key="${bk}" data-val="${i}" data-multi="0">${i}</button>`; }
    return h + `</div><div class="ends"><span>0 · ${esc(q.lo)}</span><span>10 · ${esc(q.hi)}</span></div>`;
  }
  if (q.t === 'r100') {
    const has = filled(v);
    return `<div class="r100"><input type="range" min="0" max="100" step="5" data-bind="${bk}" value="${has ? esc(v) : 50}" aria-label="${esc(q.q)}"><div class="ends"><span>0</span><b id="lab_${bk}">${has ? esc(v) : 'Not recorded'}</b><span>100</span></div><button type="button" class="link" data-act="clearR" data-key="${bk}">Leave unrecorded</button></div>`;
  }
  if (q.t === 'time') return `<div class="row2"><input type="time" data-bind="${bk}" value="${esc(v)}" aria-label="Time"><input type="text" data-bind="${bk}_where" value="${esc(t[bk + '_where'])}" placeholder="Where (optional)" autocomplete="off" aria-label="Where"></div>`;
  return '';
}
function qBlock(k, t, bk) {
  const q = Q[k]; const lab = (q.t === 'long' || q.t === 'short') ? ` for="f_${bk || k}"` : '';
  return `<div class="q"><label class="ql"${lab}>${esc(q.q)}${q.opt ? ' <span class="opt">optional</span>' : ''}</label>${q.help ? `<p class="help">${esc(q.help)}</p>` : ''}${qInput(k, t, bk)}</div>`;
}

/* ---------- navigation ---------- */
let stack = [{ r: 'today', p: {} }];
const timers = [];
function clearTimers() { while (timers.length) clearInterval(timers.pop()); }
function cur() { return stack[stack.length - 1]; }
function go(r, p) { stack.push({ r: r, p: p || {} }); render(true); }
function tab(r) { stack = [{ r: r, p: {} }]; render(true); }
function replace(r, p) { stack[stack.length - 1] = { r: r, p: p || {} }; render(true); }
function back() {
  if (urgentOpen()) { closeUrgent(); return 'handled'; }
  if (S.under18) return 'exit';
  if (!S.onboarded) { if (S.obStep > 0) { S.obStep = prevOb(S.obStep); save(); render(true); return 'handled'; } return 'exit'; }
  if (stack.length > 1) { stack.pop(); render(true); return 'handled'; }
  if (cur().r !== 'today') { tab('today'); return 'handled'; }
  return 'exit';
}
function prune() {
  const keep = cur().p && cur().p.id;
  S.entries = S.entries.filter(e => e.id === keep || e.status !== 'draft' || hasContent(e.a));
}
function render(scroll) {
  clearTimers();
  if (S.onboarded) prune();
  const main = doc.getElementById('main');
  let html;
  try {
    if (S.under18) html = V.under18();
    else if (!S.onboarded) html = V.onboarding();
    else { const c = cur(); html = (V[c.r] || V.missing)(c.p || {}); }
  } catch (err) {
    html = `<div class="card coral"><h2>Something went wrong on this screen.</h2><p>Your saved entries are safe. Urgent help is always available from the button at the top.</p><button class="btn" data-act="tab" data-r="today">Go to Today</button></div>`;
    if (w.console) console.error(err);
  }
  main.innerHTML = html;
  const b = doc.body;
  b.classList.toggle('no-nav', !S.onboarded || !!S.under18);
  b.classList.toggle('on-today', S.onboarded && !S.under18 && cur().r === 'today');
  updateNav(); renderSide();
  if (scroll) w.scrollTo(0, 0);
  if (cur().r === 'ground' && cur().p.k === 'breathe') startBreath();
}
function updateNav() {
  const root = stack[0].r;
  doc.querySelectorAll('#nav [data-r]').forEach(b => { const on = b.getAttribute('data-r') === root; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
}
function renderSide() {
  const s = doc.getElementById('side'); if (!s) return;
  if (!S.onboarded || S.under18) { s.innerHTML = ''; return; }
  const pend = pendingReview();
  s.innerHTML = `<div class="card sun mini"><p class="eyebrow">${ic('sun')} Affirmation</p><p class="aff-s">${esc(curAff())}</p><button class="link" data-act="affAnother">Show another</button></div>` +
    `<div class="card mint mini"><p class="eyebrow">${ic('leaf')} My small step</p>${pend ? `<p>${esc(planText(pend) || EX[pend.ex].t)}</p><button class="link" data-act="review" data-id="${pend.id}">Review action</button>` : `<p class="muted">No step chosen yet.</p><button class="link" data-act="startEx" data-ex="action">Plan a small action</button>`}</div>`;
}

/* ---------- urgent help overlay ---------- */
const UI = {};
let uScroll = 0;
function urgentOpen() { const u = doc.getElementById('urgent'); return !!(u && !u.hidden); }
function openUrgent() {
  const u = doc.getElementById('urgent'); if (!u) return;
  if (!urgentOpen()) uScroll = w.scrollY || 0;
  UI.uCampusOpen = false; UI.uForm = false;
  fillUrgent();
  u.hidden = false; doc.body.classList.add('u-open'); w.scrollTo(0, 0);
  const h = doc.getElementById('urgentTitle'); if (h && h.focus) h.focus();
}
function closeUrgent() {
  const u = doc.getElementById('urgent'); if (!u) return;
  u.hidden = true; doc.body.classList.remove('u-open'); w.scrollTo(0, uScroll);
}
function fillUrgent() {
  const t = S.trusted, tEl = doc.getElementById('uTrusted'), cEl = doc.getElementById('uCampus');
  if (tEl) {
    if (t.phone && !UI.ut) {
      const tel = telOf(t.phone);
      tEl.innerHTML = `<a class="ubtn outline" href="tel:${tel}">${ic('phone')}<span>Contact my trusted person<small>Call ${esc(t.name || t.phone)}</small></span></a>
        <p class="usub"><a href="sms:${tel}">Send a text instead</a> · <button class="link" data-act="editTrusted" data-pre="u">Change person</button></p>`;
    } else {
      tEl.innerHTML = `<button class="ubtn outline" data-act="uTrustedForm">${ic('heart')}<span>Contact my trusted person<small>${t.phone ? 'Edit details' : 'Not set up yet — add someone now'}</small></span></button>` +
        (UI.uForm || UI.ut ? `<div class="uform">${trustedForm('u')}</div>` : '');
    }
  }
  if (cEl) {
    cEl.innerHTML = `<button class="ubtn outline" data-act="uCampus" aria-expanded="${!!UI.uCampusOpen}">${ic('school')}<span>View campus support<small>Counselling appointments and ongoing support</small></span></button>` +
      (UI.uCampusOpen ? `<div class="uform">${campusView('u')}</div>` : '');
  }
}
function trustedForm(pre) {
  const t = S.trusted;
  return `<div class="form"><label for="${pre}tName">Name</label><input id="${pre}tName" value="${esc(t.name)}" autocomplete="off">
    <label for="${pre}tPhone">Phone number</label><input id="${pre}tPhone" type="tel" inputmode="tel" value="${esc(t.phone)}" autocomplete="off">
    <p class="fine">Saved only on this device. This person isn’t told or contacted — you choose when to call or text them.</p>
    <div class="row"><button class="btn" data-act="saveTrusted" data-pre="${pre}">Save</button>${t.phone ? `<button class="btn ghost" data-act="cancelTrusted" data-pre="${pre}">Cancel</button><button class="btn ghost danger" data-act="removeTrusted" data-pre="${pre}">Remove</button>` : ''}</div></div>`;
}
function trustedView(pre) {
  const t = S.trusted;
  if (!t.phone || UI[pre + 't']) return trustedForm(pre);
  const tel = telOf(t.phone);
  return `<p class="big">${esc(t.name || 'My trusted person')}</p><p class="muted">${esc(t.phone)}</p>
    <div class="row"><a class="btn" href="tel:${tel}">${ic('phone')} Call</a><a class="btn ghost" href="sms:${tel}">Text</a><button class="btn ghost" data-act="editTrusted" data-pre="${pre}">Change</button></div>`;
}
function campusView(pre) {
  const c = S.campus || {}; const has = c.name || c.phone || c.email;
  if (has && !UI[pre + 'c']) {
    return `<div class="campus"><p class="big">${esc(c.name || 'Campus counselling')}</p>
      <p><b>Operating hours:</b> ${c.hours ? esc(c.hours) : 'not added yet'}</p>${c.loc ? `<p><b>Where:</b> ${esc(c.loc)}</p>` : ''}
      <div class="row">${c.phone ? `<a class="btn" href="tel:${telOf(c.phone)}">${ic('phone')} Call ${esc(c.phone)}</a>` : ''}${c.email ? `<a class="btn ghost" href="mailto:${esc(c.email)}">Email</a>` : ''}</div>
      <p class="fine">For counselling appointments and ongoing support — not for emergencies. In immediate danger, call 112.</p>
      <p class="fine">Added by you${c.src ? ' from ' + esc(c.src) : ''}${c.checked ? ', last checked ' + esc(c.checked) : ''}. Re-check these details each term.</p>
      <button class="link" data-act="editCampus" data-pre="${pre}">Edit details</button></div>`;
  }
  return `<div class="form">${has ? '' : '<p>No campus counselling contact has been added yet. Copy the details from your institution’s official website, student handbook or notice board so they’re here when you need them.</p>'}
    <label for="${pre}cName">Service or institution</label><input id="${pre}cName" value="${esc(c.name)}" placeholder="e.g. Student Counselling Centre" autocomplete="off">
    <label for="${pre}cPhone">Phone</label><input id="${pre}cPhone" type="tel" inputmode="tel" value="${esc(c.phone)}" autocomplete="off">
    <label for="${pre}cEmail">Email (optional)</label><input id="${pre}cEmail" type="email" value="${esc(c.email)}" autocomplete="off">
    <label for="${pre}cHours">Operating hours</label><input id="${pre}cHours" value="${esc(c.hours)}" placeholder="e.g. Mon–Fri, 9:30 am – 5:00 pm" autocomplete="off">
    <label for="${pre}cLoc">Location (optional)</label><input id="${pre}cLoc" value="${esc(c.loc)}" autocomplete="off">
    <label for="${pre}cSrc">Where you found these details</label><input id="${pre}cSrc" value="${esc(c.src)}" placeholder="e.g. college website, student handbook" autocomplete="off">
    <div class="row"><button class="btn" data-act="saveCampus" data-pre="${pre}">Save campus details</button>${has ? `<button class="btn ghost" data-act="cancelCampus" data-pre="${pre}">Cancel</button>` : ''}</div></div>`;
}
function refreshPanels() { if (urgentOpen()) fillUrgent(); render(false); }

/* ---------- exercises ---------- */
function newEntry(ex, a) { const e = { id: uid(), ex: ex, a: a || {}, cr: Date.now(), up: Date.now(), status: 'draft', idx: 0, phase: 'main' }; S.entries.push(e); save(); return e; }
function pendingReview() { const l = S.entries.filter(e => e.status === 'review').sort((a, b) => b.up - a.up); return l[0]; }
function draftOf(ex) { const l = S.entries.filter(e => e.ex === ex && e.status === 'draft' && hasContent(e.a)).sort((a, b) => b.up - a.up); return l[0]; }
function finishEx(e) {
  const d = EX[e.ex]; const rev = d.review || [];
  if (e.phase !== 'review' && rev.length && !rev.some(k => filled(e.a[k]))) { e.status = 'review'; e.phase = 'review'; e.idx = 0; }
  else { e.status = 'done'; e.done = Date.now(); }
  e.up = Date.now(); save(); replace('entry', { id: e.id, fresh: 1 });
}
function suggestion() {
  const c = S.profile.q3 || [];
  const o = [['Separate a thought from a fact', 'thought']];
  if (c.indexOf('Worrying') >= 0 || c.indexOf('Confidence') >= 0) o.push(['Test a worry with a small, safe experiment', 'experiment']);
  if (c.indexOf('Procrastination') >= 0 || c.indexOf('Low mood') >= 0) o.push(['Choose one small, manageable step', 'action']);
  if (c.indexOf('Academic or work pressure') >= 0) o.push(['Sort what you can act on from what you can’t', 'problem']);
  o.push(['Map a recent moment: thought, feeling, body, action', 'map'], ['Notice a thinking pattern', 'patterns']);
  let pick = o[dayNum() % o.length];
  if (S.profile.q6 === '2–5 minutes' && EX[pick[1]].min > 6) pick = ['Map a recent moment: thought, feeling, body, action', 'map'];
  return pick;
}
function mapDiagram(a) {
  const box = (lbl, v) => `<div class="mapbox"><b>${lbl}</b><span>${filled(v) ? esc(ansText(v)) : '—'}</span></div>`;
  return `<div class="map">${box('Situation', a.q17)}${box('Thought', a.q18)}${box('Emotions', a.q20)}${box('Body', a.q22)}${box('Behaviour', a.q23)}</div><p class="fine">Each part can influence the others. A change in any one of them can ease the loop.</p>`;
}
function answersList(e) {
  const d = defOf(e); const ks = (d.qs || []).concat(d.review || []);
  const rows = ks.filter(k => filled(e.a[k]) || filled(e.a[k + '_other'])).map(k => {
    let v = filled(e.a[k]) ? ansText(e.a[k]) : '';
    if (filled(e.a[k + '_other'])) v += (v ? ' — ' : '') + e.a[k + '_other'];
    if (filled(e.a[k + '_where'])) v += ' · ' + e.a[k + '_where'];
    return `<div class="ans"><p class="aq">${esc(Q[k].q)}</p><p class="av">${esc(v)}</p></div>`;
  });
  return rows.length ? rows.join('') : '<p class="muted">No answers recorded.</p>';
}
function weekStats() {
  const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(dkey(d)); }
  const cks = days.map(k => S.checkins[k]).filter(c => c && c.q11);
  const since = Date.now() - 7 * 86400000;
  const ex = S.entries.filter(e => EX[e.ex] && e.status !== 'draft' && e.up >= since);
  const jr = S.entries.filter(e => FORMS[e.ex] && e.ex !== 'weekly' && e.cr >= since && hasContent(e.a));
  return { cks: cks, ex: ex, jr: jr };
}
function weekSummary() {
  const s = weekStats();
  const types = {}; s.ex.forEach(e => { types[EX[e.ex].t] = (types[EX[e.ex].t] || 0) + 1; });
  const tl = Object.keys(types).map(t => `${esc(t)} (${types[t]})`).join(', ');
  return `<div class="card lilac soft"><p class="eyebrow">This week at a glance</p><p>Check-ins: ${s.cks.length} · Journal entries: ${s.jr.length}</p><p>Exercises: ${tl || 'none yet — that’s okay'}</p></div>`;
}

/* ---------- sharing ---------- */
function buildShare() {
  const dr = S.shareDraft, p = S.profile, who = S.share.name || 'you';
  let body = '';
  if (dr.q82 === 'Selected goals') {
    const acts = S.entries.filter(e => (e.ex === 'action' || e.ex === 'experiment' || e.ex === 'problem') && planText(e)).sort((a, b) => b.up - a.up).slice(0, 3).map(e => '• ' + planText(e));
    body = 'Goals I’m working on:\n' + (p.q4 ? '• ' + p.q4 + '\n' : '') + (acts.length ? acts.join('\n') : (p.q4 ? '' : '• (no goals written yet)'));
  } else if (dr.q82 === 'Weekly summary') {
    const s = weekStats(); const wk = S.entries.filter(e => e.ex === 'weekly' && hasContent(e.a)).sort((a, b) => b.cr - a.cr)[0];
    body = `My week in Pause and Page:\n• Check-ins: ${s.cks.length}\n• Exercises practised: ${s.ex.length}\n• Journal entries: ${s.jr.length}`;
    if (wk) {
      if (filled(wk.a.q67)) body += '\n• Useful strategies: ' + ansText(wk.a.q67);
      if (filled(wk.a.q70)) body += '\n• How manageable things felt: ' + wk.a.q70;
      if (filled(wk.a.q72)) body += '\n• Next week I’d like to: ' + wk.a.q72;
    }
  } else if (dr.q82 === 'Request for support') {
    body = 'I’d appreciate some support at the moment.';
  } else if (dr.q82 === 'Individually selected entry') {
    const e = getE(dr.entry);
    if (e) { const d = defOf(e); body = d.t + ' — ' + fmtD(e.cr) + '\n' + (d.qs || []).concat(d.review || []).filter(k => filled(e.a[k])).map(k => Q[k].q + '\n' + ansText(e.a[k])).join('\n\n'); }
    else body = '(Choose an entry to share.)';
  }
  if (filled(dr.q83)) body += '\n\nWhat I’d like you to understand or help with:\n' + dr.q83;
  return `Hi ${who},\n\n${body}\n\n— Sent from Pause and Page`;
}

/* ---------- views ---------- */
const V = {};

V.missing = () => `<div class="card"><h2>This item is no longer here.</h2><p>It may have been deleted.</p><button class="btn" data-act="tab" data-r="today">Go to Today</button></div>`;

V.under18 = () => `<div class="sec pink"><h1>Pause and Page is for adults</h1>
  <p class="lead">This app is designed for people aged 18 and above. A service designed for younger users isn’t available here yet.</p>
  <div class="card pink"><p>If you’re having a hard time, please talk to a parent, a trusted adult, or your school or college counsellor.</p>
  <p>Tele-MANAS offers free, 24-hour mental health support across India: <a href="tel:14416"><b>14416</b></a> or <a href="tel:18008914416">1800-891-4416</a>.</p>
  <p>Child Helpline: <a href="tel:1098"><b>1098</b></a>.</p>
  <p>If you are in immediate danger, call <a href="tel:112"><b>112</b></a>.</p></div>
  <button class="btn ghost" data-act="ageMistake">I entered my age by mistake</button></div>`;

const OB = ['welcome', 'q1', 'name', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'done'];
function nextOb(i) { let n = i + 1; if (OB[n] === 'q8' && (S.ob.q7 === 'Neither' || !S.ob.q7)) n++; return Math.min(n, OB.length - 1); }
function prevOb(i) { let n = i - 1; if (OB[n] === 'q8' && (S.ob.q7 === 'Neither' || !S.ob.q7)) n--; return Math.max(n, 0); }

V.onboarding = () => {
  const i = S.obStep || 0, st = OB[i];
  if (st === 'welcome') {
    return `<div class="welcome"><div class="rainbow-band" aria-hidden="true"></div>
      <h1 class="hero">Pause and Page</h1>
      <p class="lead">A CBT-informed self-help space for undergraduate and postgraduate students and medical professionals aged 18 and above.</p>
      <div class="card sky"><p><b>What it is:</b> short lessons, practical exercises, private journaling, gentle affirmations and a place to track what helps.</p>
      <p><b>What it isn’t:</b> diagnosis, treatment, or a crisis service. It won’t promise recovery or watch over your entries.</p></div>
      <div class="card mint"><p><b>Your privacy:</b> there’s no account. Everything stays on this phone. Nothing is sent to anyone — including parents, faculty or employers — unless you choose to share it yourself.</p></div>
      <p class="fine">${NOTICE} You can use <b>Get urgent help</b> at the top of every screen at any time, without finishing these questions.</p>
      <button class="btn wide" data-act="obNext">Begin — about 2 minutes</button></div>`;
  }
  if (st === 'done') {
    const o = S.ob;
    return `<div class="welcome"><h1>You’re set up${o.name ? ', ' + esc(o.name) : ''}.</h1>
      <p class="lead">Start small. Three morning questions, one exercise when it helps, and a couple of evening prompts is plenty.</p>
      <div class="card sun"><p>${esc(curAffFor(o))}</p></div>
      <p class="fine">You can change any of these answers later in Profile and privacy.</p>
      <div class="row"><button class="btn ghost" data-act="obBack">Back</button><button class="btn" data-act="obFinish">Go to Today</button></div></div>`;
  }
  bindTo(S.ob, null, k => { if (k === 'q1' || k === 'q7') save(); });
  const q = Q[st];
  const n = OB.length - 2, pos = i;
  let input;
  if (st === 'q8') {
    if (!S.ob.mt) S.ob.mt = '07:30';
    if (!S.ob.et) S.ob.et = '20:30';
    const mOn = S.ob.q7 === 'Morning' || S.ob.q7 === 'Both', eOn = S.ob.q7 === 'Evening' || S.ob.q7 === 'Both';
    input = `<div class="times">${mOn ? `<label>${ic('sun')} Morning<input type="time" data-bind="mt" value="${esc(S.ob.mt)}"></label>` : ''}${eOn ? `<label>${ic('moon')} Evening<input type="time" data-bind="et" value="${esc(S.ob.et)}"></label>` : ''}</div>${qBlock('q8s', S.ob)}`;
  } else input = qInput(st, S.ob);
  return `<div class="ob"><div class="prog" aria-hidden="true"><i style="width:${Math.round(pos / n * 100)}%"></i></div>
    <p class="count">${pos} of ${n}${q.req ? '' : ' · you can skip this'}</p>
    <h1 class="qbig">${esc(q.q)}</h1>${q.help ? `<p class="help">${esc(q.help)}</p>` : ''}
    <div class="qin">${input}</div>
    <div class="runnav"><button class="btn ghost" data-act="obBack">Back</button><span class="grow"></span>${q.req ? '' : '<button class="btn ghost" data-act="obNext" data-skip="1">Skip</button>'}<button class="btn" data-act="obNext">Next</button></div></div>`;
};
function curAffFor(o) { const th = (o.q9 && o.q9.length) ? o.q9 : Object.keys(AFF); return AFF[th[0]][0]; }

V.today = () => {
  const p = S.profile, ck = ckToday(), h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  bindTo(ck);
  const sug = suggestion(), dr = draftOf(sug[1]), pend = pendingReview();
  const aff = curAff();
  let html = `<h1 class="greet">${greet}${p.name ? ', ' + esc(p.name) : ''}.</h1><p class="sub">What would help you today?</p>`;
  html += UI.affEdit
    ? `<section class="card sun"><p class="eyebrow">${ic('sun')} Edit this statement</p><textarea id="affEditBox" rows="3">${esc(aff)}</textarea><div class="row"><button class="btn" data-act="affEditSave">Save my wording</button><button class="btn ghost" data-act="affEditCancel">Cancel</button></div></section>`
    : `<section class="card sun"><p class="eyebrow">${ic('sun')} Today’s affirmation</p><p class="aff">${esc(aff)}</p>
      <div class="row"><button class="btn sm" data-act="affSave">${S.aff.saved.indexOf(aff) >= 0 ? 'Saved' : 'Save'}</button><button class="btn sm ghost" data-act="affAnother">Another</button><button class="btn sm ghost" data-act="affEdit">Edit</button></div>
      <button class="link" data-act="go" data-r="affFeel">How does this statement feel?</button></section>`;
  html += `<section class="card coral"><p class="eyebrow">${ic('heart')} ${h < 12 ? 'Morning check-in' : 'Check-in'} <span id="saveStat" class="stat">${ck.q11 ? 'Saved for today' : 'About a minute · skip anything'}</span></p>
    ${qBlock('q11', ck)}${qBlock('q12', ck)}${qBlock('q13', ck)}
    <details class="more"><summary>Add a little more (optional)</summary>${qBlock('q14', ck)}${qBlock('q15', ck)}${qBlock('q16', ck)}</details></section>`;
  html += `<section class="card sky"><p class="eyebrow">${ic('sprout')} Today’s practice</p><h2>${esc(sug[0])}</h2><p class="muted">About ${EX[sug[1]].min} minutes · ${esc(EX[sug[1]].t)}</p>
    <div class="row"><button class="btn" data-act="startEx" data-ex="${sug[1]}">Begin practice</button><button class="btn ghost" data-act="tab" data-r="cbt">All lessons</button></div>
    ${dr ? `<button class="link" data-act="openE" data-id="${dr.id}">Continue your paused ${esc(EX[dr.ex].t.toLowerCase())}</button>` : ''}</section>`;
  html += `<section class="card peach"><p class="eyebrow">${ic('book')} Journal</p><h2>Take five minutes for yourself.</h2>
    <div class="row"><button class="btn" data-act="newJ" data-k="j_guided">Guided journal</button><button class="btn ghost" data-act="newJ" data-k="j_free">Free writing</button></div></section>`;
  if (pend) {
    html += `<section class="card mint"><p class="eyebrow">${ic('leaf')} My small step</p><p class="big">${esc(planText(pend) || EX[pend.ex].t)}</p>${pend.a.q41 ? `<p class="muted">Planned for ${esc(pend.a.q41)}${pend.a.q41_where ? ' · ' + esc(pend.a.q41_where) : ''}</p>` : ''}
      <button class="btn" data-act="review" data-id="${pend.id}">Review action</button></section>`;
  } else if (ck.q16) {
    html += `<section class="card mint"><p class="eyebrow">${ic('leaf')} Today’s intention</p><p class="big">${esc(ck.q16)}</p><button class="btn ghost" data-act="startEx" data-ex="action" data-pre="${esc(ck.q16)}">Plan it as a small step</button></section>`;
  } else {
    html += `<section class="card mint"><p class="eyebrow">${ic('leaf')} My small step</p><p>Choose one small, realistic step for work, rest or connection.</p><button class="btn ghost" data-act="startEx" data-ex="action">Plan a small action</button></section>`;
  }
  if (h >= 17) {
    html += `<section class="card lilac"><p class="eyebrow">${ic('moon')} Evening reflection</p><h2>What helped today, and what do you need next?</h2><p class="muted">${esc(EVE)}</p><button class="btn" data-act="newJ" data-k="j_evening">Reflect for a few minutes</button></section>`;
  }
  return html;
};

V.affFocus = p => {
  const ev = p.kind === 'evening';
  return `<div class="focus ${ev ? 'lilac' : 'sun'}"><p class="eyebrow">${ic(ev ? 'moon' : 'sun')} ${ev ? 'Evening' : 'Morning'}</p>
    <p class="aff big-aff">${esc(ev ? EVE : curAff())}</p>${ev ? `<p class="muted">${esc(curAff())}</p>` : ''}
    <p class="sub">Would you like to…</p>
    <div class="stack"><button class="btn wide" data-act="tab" data-r="today">${ev ? 'See today' : 'Do a quick check-in'}</button>
    <button class="btn wide ghost" data-act="newJ" data-k="${ev ? 'j_evening' : 'j_five'}">${ev ? 'Write a short evening reflection' : 'Write a few lines'}</button>
    <button class="btn wide ghost" data-act="tab" data-r="today">Not now</button></div></div>`;
};

V.affFeel = () => {
  if (!S.affDraft) S.affDraft = {};
  bindTo(S.affDraft);
  return `<div class="sec sun"><button class="link" data-act="back">${ic('back')} Back</button><h1>How does this statement feel?</h1>
    <div class="card sun"><p class="aff">${esc(curAff())}</p></div>
    ${['q61', 'q62', 'q63', 'q64', 'q65'].map(k => qBlock(k, S.affDraft)).join('')}
    <p class="fine">For example, “I am always confident” could become “I can practise speaking even when I feel nervous.”</p>
    <div class="row"><button class="btn" data-act="affFeelSave">Save</button><button class="btn ghost" data-act="back">Not now</button></div></div>`;
};

V.cbt = () => {
  let h = `<div class="sec sky"><h1>My CBT journey</h1><p class="lead">Eight short lessons at your own pace. Each has an example, a practice worksheet and a small action. Skip or pause anything.</p><ol class="lessons">`;
  for (let n = 1; n <= 8; n++) {
    const L = LESSONS[n], ex = EX[L.ex];
    h += `<li><button class="lesson" data-act="go" data-r="lesson" data-n="${n}"><span class="num" aria-hidden="true">${n}</span><span class="lt"><b>${esc(L.t)}</b><span>${esc(L.f)}</span><small>About ${ex.min + 3} minutes · ${S.explored[n] ? 'Explored' : 'Not explored yet'}</small></span></button></li>`;
  }
  h += `</ol><button class="card sky linkcard" data-act="go" data-r="library">${ic('list')}<span><b>My practice library</b><span>Saved thought records, paused exercises and reusable worksheets</span></span></button></div>`;
  return h;
};

V.lesson = p => {
  const n = Math.max(1, Math.min(8, parseInt(p.n, 10) || 1)), L = LESSONS[n], ex = EX[L.ex];
  if (!S.explored[n]) { S.explored[n] = Date.now(); save(); }
  const rk = roleKey() || 'ug';
  const others = ['ug', 'pg', 'med'].filter(k => k !== rk);
  const lbl = { ug: 'Undergraduate', pg: 'Postgraduate', med: 'Medical professional' };
  const dr = draftOf(L.ex);
  const saved = S.aff.saved.indexOf(L.say) >= 0;
  return `<article class="sec sky lessonpage"><button class="link" data-act="back">${ic('back')} My CBT journey</button>
    <p class="eyebrow">Lesson ${n} of 8</p><h1>${esc(L.t)}</h1><p class="lead">${esc(L.f)}</p>
    <div class="reading">${L.body.map(t => `<p>${esc(t)}</p>`).join('')}</div>
    <div class="card sky"><p class="eyebrow">An example · ${lbl[rk]}</p><p>${esc(L.eg[rk])}</p>
      <details class="more"><summary>Other examples</summary>${others.map(k => `<p><b>${lbl[k]}:</b> ${esc(L.eg[k])}</p>`).join('')}</details></div>
    <div class="card white"><p class="eyebrow">${ic('pen')} Practice</p><h2>${esc(ex.t)}</h2><p class="muted">About ${ex.min} minutes · one question at a time · pause whenever you like</p>
      <div class="row"><button class="btn" data-act="startEx" data-ex="${L.ex}">Start worksheet</button>${dr ? `<button class="btn ghost" data-act="openE" data-id="${dr.id}">Continue draft</button>` : ''}</div>
      ${ex.review ? '<p class="fine">After you try your step, come back to review what happened. It will wait for you on the Today screen.</p>' : ''}</div>
    <div class="card sun"><p class="eyebrow">Supportive statement · optional</p><p class="aff">${esc(L.say)}</p><button class="btn sm ghost" data-act="saySave" data-n="${n}">${saved ? 'Saved to my affirmations' : 'Save to my affirmations'}</button></div>
    ${n === 8 ? '<button class="card pink linkcard" data-act="go" data-r="plan">' + ic('heart') + '<span><b>My support plan</b><span>Signs, people, places and services to turn to</span></span></button>' : ''}
    <div class="row between">${n > 1 ? `<button class="btn ghost" data-act="lessonGo" data-n="${n - 1}">Previous lesson</button>` : '<span></span>'}${n < 8 ? `<button class="btn ghost" data-act="lessonGo" data-n="${n + 1}">Next lesson</button>` : ''}</div></article>`;
};

V.run = p => {
  const e = getE(p.id); if (!e || !EX[e.ex]) return V.missing();
  const d = EX[e.ex], rev = e.phase === 'review', qs = rev ? d.review : d.qs;
  if (!(e.idx >= 0)) e.idx = 0; if (e.idx > qs.length - 1) e.idx = qs.length - 1;
  const k = qs[e.idx], q = Q[k];
  bindTo(e.a, () => { e.up = Date.now(); });
  const med = roleKey() === 'med' && (q.t === 'long' || q.t === 'short');
  return `<div class="sec sky run"><div class="runbar"><button class="link" data-act="back">${ic('back')} Close</button><span class="grow"></span><span id="saveStat" class="stat"></span><button class="btn sm ghost" data-act="exSave">Save</button><button class="btn sm ghost" data-act="exPause">Pause</button></div>
    <p class="eyebrow">${esc(rev ? 'Review · ' + d.t : d.t)}</p>
    <div class="prog" role="progressbar" aria-valuemin="1" aria-valuemax="${qs.length}" aria-valuenow="${e.idx + 1}"><i style="width:${Math.round((e.idx + 1) / qs.length * 100)}%"></i></div>
    <p class="count">Question ${e.idx + 1} of ${qs.length}</p>
    ${e.idx === 0 && !rev && d.intro ? `<div class="intro">${esc(d.intro)}</div>` : ''}
    ${e.idx === 0 && rev ? `<div class="intro">Your step: ${esc(planText(e) || '—')}</div>` : ''}
    <h1 class="qbig"><label${(q.t === 'long' || q.t === 'short') ? ` for="f_${k}"` : ''}>${esc(q.q)}</label>${q.opt ? ' <span class="opt">optional</span>' : ''}</h1>
    ${q.help ? `<p class="help">${esc(q.help)}</p>` : ''}${med ? `<p class="mednote">${MED_NOTE}</p>` : ''}
    <div class="qin">${qInput(k, e.a)}</div>
    <div class="runnav">${e.idx > 0 ? '<button class="btn ghost" data-act="exPrev">Back</button>' : '<span></span>'}<span class="grow"></span><button class="btn ghost" data-act="exSkip">Skip</button><button class="btn" data-act="exNext">${e.idx === qs.length - 1 ? 'Finish' : 'Next'}</button></div>
    <p class="fine">Saved on this device as you go.</p></div>`;
};

V.entry = p => {
  const e = getE(p.id); if (!e) return V.missing();
  const isEx = !!EX[e.ex], d = defOf(e);
  if (!isEx) { return V.write(p); }
  let h = `<div class="sec sky"><button class="link" data-act="back">${ic('back')} Back</button><p class="eyebrow">${esc(fmtD(e.cr))}</p><h1>${esc(d.t)}</h1>`;
  if (p.fresh) h += `<div class="card mint soft"><p>${e.status === 'review' ? 'Saved. When you’ve tried your step, come back to review how it went — it will wait for you on the Today screen.' : 'Saved. Thank you for taking the time to do this.'}</p></div>`;
  if (e.ex === 'thought') {
    const a = e.a, both = filled(a.q21) && filled(a.q30);
    h += `<div class="card sky"><p class="eyebrow">Your review</p>
      <p class="aq">Balanced response</p><p class="av big">${filled(a.q28) ? esc(a.q28) : '—'}</p>
      <p class="aq">Chosen action</p><p class="av">${filled(a.q29) ? esc(a.q29) : '—'}</p>
      ${both ? `<p class="aq">Emotion strength</p><p class="av">${esc(a.q21)} before · ${esc(a.q30)} after</p><p class="fine">A change in this number doesn’t decide whether the exercise worked.</p>` : ''}
      <p class="eyebrow">Optional follow-up</p><div class="row"><button class="btn sm ghost" data-act="startEx" data-ex="patterns" data-from="${e.id}">Check for thinking patterns</button>${filled(a.q29) ? `<button class="btn sm ghost" data-act="startEx" data-ex="action" data-from="${e.id}">Plan this action</button>` : ''}</div></div>`;
  }
  if (e.ex === 'map') h += mapDiagram(e.a);
  if (e.status === 'review') h += `<div class="card mint"><p class="eyebrow">Your step</p><p class="big">${esc(planText(e) || '—')}</p><button class="btn" data-act="review" data-id="${e.id}">Review how it went</button></div>`;
  if (e.status === 'draft') h += `<div class="card sun"><p>This exercise is paused.</p><button class="btn" data-act="openE" data-id="${e.id}">Continue</button></div>`;
  h += `<h2 class="h2">Your answers</h2>${answersList(e)}`;
  h += `<div class="row"><button class="btn ghost" data-act="editEx" data-id="${e.id}">Edit answers</button><button class="btn ghost danger" data-act="delE" data-id="${e.id}">Delete</button></div></div>`;
  return h;
};

V.library = () => {
  const ex = S.entries.filter(e => EX[e.ex]).sort((a, b) => b.up - a.up);
  const item = e => `<li><button class="item" data-act="openE" data-id="${e.id}"><b>${esc(EX[e.ex].t)}</b><span>${esc(firstLine(e) || 'No details yet')}</span><small>${esc(fmtD(e.up))}</small></button></li>`;
  const grp = (t, l, empty) => `<h2 class="h2">${t}</h2>${l.length ? `<ul class="items">${l.map(item).join('')}</ul>` : `<p class="muted">${empty}</p>`}`;
  return `<div class="sec sky"><button class="link" data-act="back">${ic('back')} Back</button><h1>My practice library</h1>
    ${grp('Waiting for review', ex.filter(e => e.status === 'review'), 'Nothing waiting. Steps you plan will appear here until you review them.')}
    ${grp('Paused', ex.filter(e => e.status === 'draft'), 'No paused exercises.')}
    ${grp('Completed', ex.filter(e => e.status === 'done'), 'Your completed thought records and worksheets will be saved here.')}
    <h2 class="h2">Reusable worksheets</h2><div class="grid2">${Object.keys(EX).map(k => `<button class="tile" data-act="startEx" data-ex="${k}"><b>${esc(EX[k].t)}</b><small>About ${EX[k].min} min</small></button>`).join('')}</div></div>`;
};

V.journal = () => {
  const list = S.entries.filter(e => FORMS[e.ex] && e.ex !== 'weekly' && hasContent(e.a)).sort((a, b) => b.cr - a.cr);
  const opts = [['j_guided', 'Guided CBT journal', 'Seven prompts that walk through a moment'], ['j_five', 'Five-minute journal', 'A few quick prompts for the day'], ['j_evening', 'Evening reflection', 'What helped, and what you need tonight'], ['j_grat', 'Gratitude reflection', 'Small things that made today easier'], ['j_free', 'Free writing', 'A blank page, just for you']];
  if (pathQs().length) opts.push(['j_path', 'Prompts for you', 'Questions for your pathway']);
  return `<div class="sec peach"><h1>My journal</h1><p class="lead">Private to this device. Write as much or as little as you like.</p>
    <div class="grid2">${opts.map(o => `<button class="tile peach" data-act="newJ" data-k="${o[0]}"><b>${o[1]}</b><small>${o[2]}</small></button>`).join('')}</div>
    <h2 class="h2">Previous entries</h2>${list.length ? `<ul class="items">${list.map(e => `<li><button class="item" data-act="go" data-r="write" data-id="${e.id}"><b>${esc(formDef(e.ex).t)}</b><span>${esc(firstLine(e))}</span><small>${esc(fmtD(e.cr))}</small></button></li>`).join('')}</ul>` : '<p class="muted">Your entries will appear here. Start with any option above.</p>'}</div>`;
};

V.write = p => {
  const e = getE(p.id); if (!e) return V.missing();
  const d = formDef(e.ex); if (!d) return V.missing();
  bindTo(e.a, () => { e.up = Date.now(); }, (k, v) => { if (k === 'q73') { const b = doc.getElementById('supBox'); if (b) b.hidden = !(v === 'Yes' || v === 'Maybe'); } });
  const med = roleKey() === 'med' && d.med !== false;
  const sec = d.sec || 'peach';
  return `<div class="sec ${sec}"><div class="runbar"><button class="link" data-act="back">${ic('back')} Done</button><span class="grow"></span><span id="saveStat" class="stat">${hasContent(e.a) ? 'Saved on this device' : 'Nothing written yet'}</span></div>
    <div class="paper ${sec}"><p class="date">${esc(fmtD(e.cr))}</p><h1>${esc(d.t)}</h1>${d.d ? `<p class="sub">${esc(d.d)}</p>` : ''}
    ${e.ex === 'weekly' ? weekSummary() : ''}${med ? `<p class="mednote">${MED_NOTE}</p>` : ''}
    ${d.qs.length ? d.qs.map(k => qBlock(k, e.a)).join('') : '<p class="muted">Choose your pathway in Profile to see prompts here.</p>'}
    ${e.ex === 'weekly' ? `<div id="supBox" class="card pink" ${(e.a.q73 === 'Yes' || e.a.q73 === 'Maybe') ? '' : 'hidden'}><p><b>Support options</b> — you don’t have to explain anything to use them.</p><div class="row"><button class="btn sm" data-act="urgent">Get urgent help</button><button class="btn sm ghost" data-act="go" data-r="campus">Campus support</button><button class="btn sm ghost" data-act="go" data-r="plan">My support plan</button><button class="btn sm ghost" data-act="go" data-r="share">Share with someone I trust</button></div></div>` : ''}
    </div><div class="row"><button class="btn" data-act="back">Done</button><button class="btn ghost danger" data-act="delE" data-id="${e.id}">Delete entry</button></div></div>`;
};

function moodChart(days) {
  const L = ['Very good', 'Good', 'Neutral', 'Low', 'Very low'];
  const X = i => 74 + i * 21, Y = lv => 18 + (5 - lv) * 24;
  let s = '<svg class="chart" viewBox="0 0 370 160" role="img" aria-label="Mood over the last 14 days">';
  L.forEach((l, j) => { const y = 18 + j * 24; s += `<line x1="66" x2="364" y1="${y}" y2="${y}" class="gl"/><text x="60" y="${y + 4}" text-anchor="end" class="tl">${l}</text>`; });
  let prev = null, dots = '';
  days.forEach((d, i) => {
    const c = S.checkins[dkey(d)], lv = c && c.q11 ? MOODS.indexOf(c.q11) + 1 : 0, x = X(i);
    if (lv) { if (prev) s += `<line x1="${prev[0]}" y1="${prev[1]}" x2="${x}" y2="${Y(lv)}" class="ml"/>`; prev = [x, Y(lv)]; dots += `<circle cx="${x}" cy="${Y(lv)}" r="5.5" class="md"><title>${esc(fmtD(d.getTime()))}: ${esc(c.q11)}</title></circle>`; }
    else { s += `<line x1="${x}" x2="${x}" y1="18" y2="114" class="miss"/>`; prev = null; }
    s += `<text x="${x}" y="134" text-anchor="middle" class="tl">${'SMTWTFS'[d.getDay()]}</text><text x="${x}" y="150" text-anchor="middle" class="tl dim">${d.getDate()}</text>`;
  });
  return s + dots + '</svg>';
}

V.progress = () => {
  const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
  const wk = days.slice(7).map(d => S.checkins[dkey(d)]).filter(c => c && (c.q11 || filled(c.q12) || c.q13));
  const en = wk.filter(c => filled(c.q12)).map(c => +c.q12);
  const sl = wk.filter(c => c.q13 && c.q13 !== 'I have not slept yet');
  const restful = sl.filter(c => c.q13 === 'Very' || c.q13 === 'Extremely').length;
  const done = S.entries.filter(e => EX[e.ex] && e.status !== 'draft');
  const byType = {}; done.forEach(e => { byType[e.ex] = (byType[e.ex] || 0) + 1; });
  const explored = Object.keys(S.explored).filter(k => S.explored[k]).length;
  const s = weekStats();
  const helped = [];
  S.entries.slice().sort((a, b) => b.up - a.up).forEach(e => {
    [['q55', 'What helped'], ['q37', 'A helpful question'], ['q45', 'Next time'], ['q52', 'What I learned'], ['j7', 'What I learned'], ['pr2', 'What I’d keep'], ['m1', 'Useful'], ['q68', 'What I learned']].forEach(x => { if (typeof e.a[x[0]] === 'string' && e.a[x[0]].trim() && helped.length < 6) helped.push([x[1], e.a[x[0]].trim(), e.up]); });
    if (Array.isArray(e.a.q67) && e.a.q67.length && helped.length < 6) helped.push(['Useful strategies', e.a.q67.join(', '), e.up]);
  });
  const acts = S.entries.filter(e => (e.ex === 'action' || e.ex === 'experiment' || e.ex === 'problem') && e.status !== 'draft').sort((a, b) => b.up - a.up).slice(0, 4);
  const reviews = S.entries.filter(e => e.ex === 'weekly' && hasContent(e.a)).sort((a, b) => b.cr - a.cr);
  return `<div class="sec lilac"><h1>My progress</h1><p class="lead">How you’ve been feeling and what you’ve practised are shown separately. Days without entries are simply blank — nothing is lost.</p>
    <section class="card lilac"><p class="eyebrow">${ic('heart')} How I’ve been feeling</p><p class="muted">Self-reported mood, last 14 days</p><div class="chartwrap">${moodChart(days)}</div>
      <p>${en.length ? `Energy this week ranged from ${Math.min.apply(null, en)} to ${Math.max.apply(null, en)} out of 10, across ${en.length} check-in${en.length > 1 ? 's' : ''}.` : 'No energy check-ins this week.'}</p>
      <p>${sl.length ? `Sleep felt very or extremely restful on ${restful} of ${sl.length} night${sl.length > 1 ? 's' : ''} you recorded.` : 'No sleep entries this week.'}</p></section>
    <section class="card lilac"><p class="eyebrow">${ic('sprout')} What I’ve practised</p><p class="fine">This shows activity only. It isn’t a measure of how you feel, and there are no streaks to keep.</p>
      <p><b>${explored} of 8</b> lessons explored · <b>${s.ex.length}</b> exercise${s.ex.length === 1 ? '' : 's'} this week · <b>${s.jr.length}</b> journal entr${s.jr.length === 1 ? 'y' : 'ies'} this week</p>
      ${Object.keys(byType).length ? `<ul class="plain">${Object.keys(byType).map(k => `<li>${esc(EX[k].t)}: ${byType[k]}</li>`).join('')}</ul>` : '<p class="muted">Exercises you complete will be listed here.</p>'}</section>
    <section class="card lilac"><p class="eyebrow">${ic('leaf')} What helped me</p>${helped.length ? `<ul class="plain">${helped.map(x => `<li><b>${esc(x[0])}:</b> ${esc(x[1])}</li>`).join('')}</ul>` : '<p class="muted">Strategies you find useful in reflections and reviews will collect here.</p>'}</section>
    <section class="card lilac"><p class="eyebrow">${ic('pen')} Goals and actions</p>${S.profile.q4 ? `<p><b>I’d like to:</b> ${esc(S.profile.q4)}</p>` : ''}
      ${acts.length ? `<ul class="plain">${acts.map(e => `<li><b>${esc(planText(e) || EX[e.ex].t)}</b>${filled(e.a.q39) ? ' · barriers: ' + esc(ansText(e.a.q39)) : ''}${filled(e.a.q45) ? ' · adjusted: ' + esc(e.a.q45) : ''}${e.status === 'review' ? ' · <i>not reviewed yet</i>' : ''}</li>`).join('')}</ul>` : '<p class="muted">Steps you plan and attempt will appear here, with any barriers and adjustments.</p>'}</section>
    <section class="card lilac"><p class="eyebrow">${ic('moon')} Weekly reflection</p><p>Review patterns, actions attempted, useful strategies and whether more support would help.</p><button class="btn" data-act="newJ" data-k="weekly">Start this week’s review</button>
      ${reviews.length ? `<ul class="items">${reviews.map(e => `<li><button class="item" data-act="go" data-r="write" data-id="${e.id}"><b>Week of ${esc(fmtD(e.cr))}</b><span>${esc(e.a.q72 || e.a.q68 || '')}</span></button></li>`).join('')}</ul>` : ''}</section></div>`;
};

V.support = () => `<div class="sec pink"><h1>Support</h1><p class="lead">Tools for difficult moments, and the people and services you can turn to.</p>
  <button class="ubtn em" data-act="urgent">${ic('phone')}<span>Get urgent help<small>112, Tele-MANAS, your trusted person and campus support</small></span></button>
  <h2 class="h2">Grounding activities</h2><div class="grid2">
    <button class="tile pink" data-act="go" data-r="ground" data-k="breathe"><b>Slow breathing</b><small>A steady rhythm, about 2 minutes</small></button>
    <button class="tile pink" data-act="go" data-r="ground" data-k="five"><b>5-4-3-2-1 senses</b><small>Come back to the room around you</small></button>
    <button class="tile pink" data-act="go" data-r="ground" data-k="steady"><b>Steady and slow</b><small>Five small steps</small></button></div>
  <h2 class="h2">My support</h2>
  <button class="card pink linkcard" data-act="go" data-r="plan">${ic('heart')}<span><b>My support plan</b><span>${hasContent(S.plan) ? 'View or update your plan' : 'Optional · four questions to prepare in advance'}</span></span></button>
  <button class="card pink linkcard" data-act="go" data-r="trusted">${ic('user')}<span><b>My trusted person</b><span>${S.trusted.phone ? esc(S.trusted.name || S.trusted.phone) : 'Add someone you can call or text'}</span></span></button>
  <button class="card pink linkcard" data-act="go" data-r="campus">${ic('school')}<span><b>Campus support</b><span>${S.campus.name ? esc(S.campus.name) : 'Add your institution’s counselling contact'}</span></span></button>
  <button class="card pink linkcard" data-act="go" data-r="share">${ic('share')}<span><b>Share with someone I trust</b><span>You choose what to share, every time</span></span></button>
  <h2 class="h2">Professional help</h2>
  <div class="card white"><p><b>Tele-MANAS</b> — free, 24-hour mental health counselling and support across India. <a href="tel:14416">14416</a> or <a href="tel:18008914416">1800-891-4416</a>.</p>
  <p><b>Emergency response</b> — <a href="tel:112">112</a> for immediate danger, a suicide attempt, serious injury or an urgent medical emergency.</p>
  <p>A doctor, psychiatrist, or clinical psychologist can offer assessment and treatment. This app offers self-help education only.</p></div>
  <p class="fine">${NOTICE}</p></div>`;

V.plan = () => {
  bindTo(S.plan);
  return `<div class="sec pink"><div class="runbar"><button class="link" data-act="back">${ic('back')} Back</button><span class="grow"></span><span id="saveStat" class="stat">${hasContent(S.plan) ? 'Saved on this device' : ''}</span></div>
    <h1>My support plan</h1><p class="lead">Optional. Writing this on a steadier day makes it easier to use on a harder one.</p>
    <div class="notice">${NOTICE}</div>
    ${['q86', 'q87', 'q88', 'q89'].map(k => qBlock(k, S.plan)).join('')}
    <div class="card white"><p><b>Numbers to keep close</b></p><p><a href="tel:112">112</a> — emergency response · <a href="tel:14416">14416</a> — Tele-MANAS</p>${S.trusted.phone ? `<p><a href="tel:${telOf(S.trusted.phone)}">${esc(S.trusted.name || S.trusted.phone)}</a> — my trusted person</p>` : ''}</div>
    <button class="btn" data-act="back">Done</button></div>`;
};

V.trusted = () => `<div class="sec pink"><button class="link" data-act="back">${ic('back')} Back</button><h1>My trusted person</h1>
  <p class="lead">Someone who can offer immediate personal support — a friend, relative, roommate or colleague.</p><div class="card white">${trustedView('p')}</div></div>`;

V.campus = () => `<div class="sec pink"><button class="link" data-act="back">${ic('back')} Back</button><h1>Campus support</h1>
  <p class="lead">Counselling appointments and ongoing support at your institution.</p><div class="card white">${campusView('p')}</div></div>`;

V.ground = p => {
  const g = GROUND[p.k] || GROUND.five;
  if (p.k === 'breathe') {
    return `<div class="sec pink"><button class="link" data-act="back">${ic('back')} Back</button><h1>Slow breathing</h1><p class="lead">Breathe in gently through your nose, and out slowly. Follow the circle, or just the words.</p>
      <div class="breath"><div class="circle" id="bCircle"></div><p class="bword" id="bWord" aria-live="polite">Breathe in</p></div>
      <p class="fine">If slow breathing feels uncomfortable, breathe normally and simply notice your feet on the floor.</p><button class="btn" data-act="back">Finish</button></div>`;
  }
  const i = Math.max(0, Math.min(g.steps.length - 1, parseInt(p.i, 10) || 0));
  return `<div class="sec pink"><button class="link" data-act="back">${ic('back')} Back</button><h1>${esc(g.t)}</h1><p class="count">Step ${i + 1} of ${g.steps.length}</p>
    <div class="card pink"><p class="big">${esc(g.steps[i])}</p></div>
    <div class="runnav">${i > 0 ? `<button class="btn ghost" data-act="gStep" data-i="${i - 1}">Back</button>` : '<span></span>'}<span class="grow"></span>${i < g.steps.length - 1 ? `<button class="btn" data-act="gStep" data-i="${i + 1}">Next</button>` : '<button class="btn" data-act="back">Finish</button>'}</div></div>`;
};
function startBreath() {
  const word = doc.getElementById('bWord'), c = doc.getElementById('bCircle'); if (!word) return;
  let t = 0;
  const tick = () => { const ph = t % 10; const inhale = ph < 4; word.textContent = inhale ? `Breathe in… ${4 - ph}` : `Breathe out… ${10 - ph}`; if (c) c.classList.toggle('grow', inhale); t++; };
  tick(); timers.push(setInterval(tick, 1000));
}

V.share = () => {
  const sh = S.share, dr = S.shareDraft;
  bindTo(dr, null, k => { if (k === 'q81' || k === 'q82') render(false); });
  let h = `<div class="sec pink"><button class="link" data-act="back">${ic('back')} Back</button><h1>Share with someone I trust</h1>
    <p class="lead">Nothing is shared automatically, and no one gets access to the app. Each time, you choose what to send, see a preview, and send it yourself.</p>
    <p class="fine">Journal entries and thought records stay private unless you pick one to share.</p>`;
  if (sh.status !== 'active') {
    h += qBlock('q81', dr);
    if (dr.q81 === 'Yes') h += `<div class="q"><label class="ql" for="shWho">Who is this person?</label><input id="shWho" value="${esc(dr.who)}" placeholder="Name, e.g. Amma or Priya" autocomplete="off"></div><button class="btn" data-act="shareSetup">Continue</button>`;
    if (sh.status === 'stopped') h += '<p class="muted">Sharing is stopped. Nothing further will be prepared for anyone unless you set it up again.</p>';
  } else {
    h += `<div class="card white"><p>Sharing with <b>${esc(sh.name)}</b></p><p class="ql">Would you like to continue, change, or stop this person’s access?</p>
      <div class="row"><button class="btn sm ghost" data-act="shareAccess" data-v="continue">Continue</button><button class="btn sm ghost" data-act="shareAccess" data-v="change">Change person</button><button class="btn sm ghost danger" data-act="shareAccess" data-v="stop">Stop</button></div></div>`;
    h += qBlock('q82', dr);
    if (dr.q82 === 'Individually selected entry') {
      const list = S.entries.filter(e => hasContent(e.a) && e.status !== 'draft' || (FORMS[e.ex] && hasContent(e.a))).sort((a, b) => b.up - a.up).slice(0, 20);
      h += `<div class="q"><p class="ql">Choose one entry</p>${list.length ? `<div class="chips col">${list.map(e => `<button type="button" class="chip${dr.entry === e.id ? ' on' : ''}" data-act="shareEntry" data-id="${e.id}">${esc(defOf(e).t)} · ${esc(fmtD(e.cr))}</button>`).join('')}</div>` : '<p class="muted">No entries yet.</p>'}</div>`;
    }
    h += qBlock('q83', dr);
    h += `<p class="fine">You’ll always see a preview before anything is shared.</p><button class="btn" data-act="sharePreview"${dr.q82 ? '' : ' disabled'}>Preview</button>`;
  }
  if (sh.log.length) h += `<h2 class="h2">Shared before</h2><ul class="plain">${sh.log.slice(-8).reverse().map(l => `<li>${esc(l.what)} → ${esc(l.to)} · ${esc(fmtD(l.at))}</li>`).join('')}</ul><p class="fine">Messages already sent stay on the other person’s device.</p>`;
  return h + '</div>';
};

V.sharePreview = () => {
  const txt = buildShare();
  return `<div class="sec pink"><button class="link" data-act="back">${ic('back')} Edit</button><h1>Preview</h1><p class="lead">This is exactly what will be shared. You’ll choose the app and the person next.</p>
    <pre class="preview">${esc(txt)}</pre><div class="row"><button class="btn" data-act="doShare">Share…</button><button class="btn ghost" data-act="back">Edit</button></div></div>`;
};

V.exportView = () => `<div class="sec"><button class="link" data-act="back">${ic('back')} Back</button><h1>My data</h1><p class="lead">This includes your private entries. Keep it somewhere safe.</p><textarea rows="14" readonly>${esc(JSON.stringify(S, null, 2))}</textarea></div>`;

V.profile = () => {
  const p = S.profile;
  bindTo(p, syncSoon, k => { if (k === 'q7') { if (p.q7 !== 'Neither') askNotif(); render(false); } if (k === 'q2') render(false); });
  const mOn = p.q7 === 'Morning' || p.q7 === 'Both', eOn = p.q7 === 'Evening' || p.q7 === 'Both';
  let notif = '';
  if (APP && p.q7 !== 'Neither') { let st = 'on'; try { st = w.Android.notificationStatus(); } catch (e) { st = 'on'; } if (st !== 'on') notif = `<div class="notice">Notifications are turned off for Pause and Page, so reminders won’t appear. <button class="link" data-act="notifSettings">Open notification settings</button></div>`; }
  if (!APP) notif = '<p class="fine">Reminders are delivered by the Android app.</p>';
  const tog = (k, t, d) => `<button class="toggle${S.settings[k] ? ' on' : ''}" role="switch" aria-checked="${!!S.settings[k]}" data-act="toggleSet" data-k="${k}"><span><b>${t}</b><small>${d}</small></span><i aria-hidden="true"></i></button>`;
  return `<div class="sec"><div class="runbar"><button class="link" data-act="back">${ic('back')} Back</button><span class="grow"></span><span id="saveStat" class="stat"></span></div><h1>Profile and privacy</h1>
    <section class="card white"><h2>About you</h2>${qBlock('name', p)}${qBlock('q2', p)}${qBlock('q3', p)}${qBlock('q4', p)}${qBlock('q6', p)}</section>
    <section class="card sun"><h2>${ic('sun')} Reminders</h2>${qBlock('q7', p)}
      ${mOn || eOn ? `<div class="times">${mOn ? `<label>${ic('sun')} Morning<input type="time" data-bind="mt" value="${esc(p.mt)}"></label>` : ''}${eOn ? `<label>${ic('moon')} Evening<input type="time" data-bind="et" value="${esc(p.et)}"></label>` : ''}</div>${qBlock('q8s', p)}${qBlock('q10', p)}${qBlock('snd', p)}` : ''}${notif}
      ${qBlock('q9', p)}</section>
    <section class="card white"><h2>Appearance</h2>${tog('quiet', 'Quieter appearance', 'Softer colours for when bright screens feel tiring')}${tog('reduce', 'Reduce motion', 'Turns off transitions and the breathing animation')}</section>
    <section class="card white"><h2>Privacy</h2><p>Your entries are stored only on this device. There is no account, no cloud copy, and no one — including parents, faculty or employers — has automatic access.</p>
      ${APP ? tog('secure', 'Hide app content', 'Blocks screenshots and hides the app preview in recent apps') : ''}
      <div class="row"><button class="btn ghost" data-act="go" data-r="share">Sharing settings</button><button class="btn ghost" data-act="exportData">Export my data</button></div>
      <button class="btn ghost danger" data-act="delAll">Delete all my data</button>
      <p class="fine">Deleting removes every entry, check-in and setting from this device. It can’t be undone.</p></section>
    <section class="card white"><h2>About Pause and Page</h2><p>Self-help education informed by cognitive behavioural therapy. It doesn’t diagnose, treat, promise recovery or monitor your entries.</p><p class="fine">${NOTICE} Helpline details are stored on the device so they work offline, and were last reviewed in October 2026.</p></section></div>`;
};

/* ---------- actions ---------- */
const A = {};
A.urgent = () => openUrgent();
A.closeUrgent = () => closeUrgent();
A.profile = () => { if (S.onboarded && !S.under18) go('profile'); };
A.tab = el => { if (urgentOpen()) closeUrgent(); tab(el.dataset.r); };
A.back = () => { back(); };
A.go = el => {
  if (urgentOpen()) closeUrgent();
  const p = {}; Object.keys(el.dataset).forEach(k => { if (k !== 'act' && k !== 'r') p[k] = el.dataset[k]; });
  go(el.dataset.r, p);
};
A.pick = el => {
  const t = F.t; if (!t) return;
  const k = el.dataset.key, v = el.dataset.val, multi = el.dataset.multi === '1', max = +el.dataset.max || 0;
  if (multi) {
    const arr = Array.isArray(t[k]) ? t[k].slice() : []; const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else { if (max && arr.length >= max) { toast(`You can choose up to ${max}.`); return; } arr.push(v); }
    t[k] = arr;
  } else t[k] = t[k] === v ? '' : v;
  const g = el.closest('.chips');
  if (g) g.querySelectorAll('[data-act="pick"]').forEach(b => { const on = multi ? t[k].indexOf(b.dataset.val) >= 0 : t[k] === b.dataset.val; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  changed();
  if (F.onPick) F.onPick(k, t[k]);
};
A.clearR = el => { if (!F.t) return; const k = el.dataset.key; F.t[k] = ''; const l = doc.getElementById('lab_' + k); if (l) l.textContent = 'Not recorded'; changed(); };

A.obNext = el => {
  const st = OB[S.obStep || 0], q = Q[st];
  if (q && q.req && !S.ob[st]) { toast('Please choose an answer to continue.'); return; }
  if (el.dataset.skip && q) { if (!filled(S.ob[st])) delete S.ob[st]; }
  if (st === 'q1' && S.ob.q1 === 'No') { S.under18 = true; save(); render(true); return; }
  S.obStep = nextOb(S.obStep || 0); save(); render(true);
};
A.obBack = () => { S.obStep = prevOb(S.obStep || 0); save(); render(true); };
A.obFinish = () => {
  const o = S.ob, p = S.profile;
  p.name = o.name || ''; p.q2 = o.q2 || ''; p.q3 = o.q3 || []; p.q4 = o.q4 || ''; p.q5 = o.q5 || ''; p.q6 = o.q6 || '';
  p.q7 = o.q7 || 'Neither'; p.mt = o.mt || '07:30'; p.et = o.et || '20:30'; p.q8s = o.q8s || ''; p.q9 = o.q9 || []; p.q10 = o.q10 || 'Show a private reminder only';
  S.onboarded = true; save(); syncReminders(); if (p.q7 !== 'Neither') askNotif(); tab('today');
};
A.ageMistake = () => { S.under18 = false; S.obStep = 1; S.ob.q1 = ''; save(); render(true); };

A.affAnother = () => { UI.affEdit = false; nextAff(); render(false); };
A.affSave = () => { const a = curAff(); if (S.aff.saved.indexOf(a) < 0) { S.aff.saved.unshift(a); save(); syncSoon(); toast('Saved to your affirmations.'); } render(false); };
A.affEdit = () => { UI.affEdit = true; render(false); };
A.affEditCancel = () => { UI.affEdit = false; render(false); };
A.affEditSave = () => {
  const el = doc.getElementById('affEditBox'); const t = el ? el.value.trim() : '';
  if (t) { S.aff.custom = [t].concat(S.aff.custom.filter(x => x !== t)); S.aff.cur = t; if (S.aff.saved.indexOf(t) < 0) S.aff.saved.unshift(t); save(); syncSoon(); toast('Your wording is saved.'); }
  UI.affEdit = false; render(false);
};
A.affFeelSave = () => {
  const d = S.affDraft || {}, a = curAff();
  S.aff.fb.push({ text: a, a: d, at: Date.now() });
  if (filled(d.q64)) { S.aff.custom = [d.q64].concat(S.aff.custom.filter(x => x !== d.q64)); S.aff.cur = d.q64; if (S.aff.saved.indexOf(d.q64) < 0) S.aff.saved.unshift(d.q64); }
  else if (d.q63 === 'Another') nextAff();
  else if (d.q63 === 'Keep' && S.aff.saved.indexOf(a) < 0) S.aff.saved.unshift(a);
  else if (d.q63 === 'Edit') { UI.affEdit = true; }
  S.affDraft = {}; save(); syncSoon(); toast('Thanks — noted.'); back();
};
A.saySave = el => { const L = LESSONS[+el.dataset.n]; if (L && S.aff.saved.indexOf(L.say) < 0) { S.aff.saved.unshift(L.say); save(); syncSoon(); toast('Saved to your affirmations.'); } render(false); };
A.lessonGo = el => replace('lesson', { n: el.dataset.n });

A.startEx = el => {
  if (urgentOpen()) closeUrgent();
  const ex = el.dataset.ex; if (!EX[ex]) return;
  const a = {};
  const from = el.dataset.from ? getE(el.dataset.from) : null;
  if (from && ex === 'patterns') a.pt0 = from.a.q18 || '';
  if (from && ex === 'action') a.q40 = from.a.q29 || '';
  if (el.dataset.pre && ex === 'action') a.q40 = el.dataset.pre;
  const e = newEntry(ex, a); go('run', { id: e.id });
};
A.openE = el => { const e = getE(el.dataset.id); if (!e) return; if (EX[e.ex]) go(e.status === 'draft' ? 'run' : 'entry', { id: e.id }); else go('write', { id: e.id }); };
A.review = el => { const e = getE(el.dataset.id); if (!e) return; e.phase = 'review'; e.idx = 0; save(); go('run', { id: e.id }); };
A.editEx = el => { const e = getE(el.dataset.id); if (!e) return; e.phase = 'main'; e.idx = 0; save(); replace('run', { id: e.id }); };
function runE() { return getE(cur().p.id); }
A.exNext = () => { const e = runE(); if (!e) return; const d = EX[e.ex], qs = e.phase === 'review' ? d.review : d.qs; e.idx++; e.up = Date.now(); if (e.idx >= qs.length) { finishEx(e); return; } save(); render(true); };
A.exSkip = A.exNext;
A.exPrev = () => { const e = runE(); if (!e) return; e.idx = Math.max(0, e.idx - 1); save(); render(true); };
A.exSave = () => { const e = runE(); if (e) e.up = Date.now(); save(); setStat('Saved on this device'); toast('Saved.'); };
A.exPause = () => { const e = runE(); if (e) e.up = Date.now(); save(); back(); toast('Paused. Find it in My practice library.'); };
A.delE = el => {
  if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Tap again to delete'; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = 'Delete'; } }, 4000); return; }
  S.entries = S.entries.filter(e => e.id !== el.dataset.id); save(); toast('Deleted.'); back();
};
A.newJ = el => {
  if (urgentOpen()) closeUrgent();
  const k = el.dataset.k; if (!FORMS[k]) return;
  const e = newEntry(k); if (stack.length > 1 && cur().r === 'affFocus') replace('write', { id: e.id }); else go('write', { id: e.id });
};
A.gStep = el => replace('ground', { k: cur().p.k, i: el.dataset.i });

A.uTrustedForm = () => { UI.uForm = !UI.uForm; fillUrgent(); };
A.editTrusted = el => { UI[el.dataset.pre + 't'] = true; refreshPanels(); };
A.cancelTrusted = el => { UI[el.dataset.pre + 't'] = false; UI.uForm = false; refreshPanels(); };
A.removeTrusted = el => { S.trusted = { name: '', phone: '' }; UI[el.dataset.pre + 't'] = false; save(); toast('Removed.'); refreshPanels(); };
A.saveTrusted = el => {
  const pre = el.dataset.pre, n = doc.getElementById(pre + 'tName'), ph = doc.getElementById(pre + 'tPhone');
  const phone = ph ? ph.value.trim() : '';
  if (telOf(phone).replace('+', '').length < 3) { toast('Please enter a phone number.'); return; }
  S.trusted = { name: n ? n.value.trim() : '', phone: phone }; UI[pre + 't'] = false; UI.uForm = false; save(); toast('Saved on this device.'); refreshPanels();
};
A.uCampus = () => { UI.uCampusOpen = !UI.uCampusOpen; fillUrgent(); };
A.editCampus = el => { UI[el.dataset.pre + 'c'] = true; refreshPanels(); };
A.cancelCampus = el => { UI[el.dataset.pre + 'c'] = false; refreshPanels(); };
A.saveCampus = el => {
  const pre = el.dataset.pre, v = id => { const x = doc.getElementById(pre + id); return x ? x.value.trim() : ''; };
  const c = { name: v('cName'), phone: v('cPhone'), email: v('cEmail'), hours: v('cHours'), loc: v('cLoc'), src: v('cSrc'), checked: fmtD(Date.now()) };
  if (!c.name && !c.phone && !c.email) { toast('Add at least a name, phone or email.'); return; }
  S.campus = c; UI[pre + 'c'] = false; save(); toast('Campus details saved.'); refreshPanels();
};

A.shareSetup = () => {
  const n = doc.getElementById('shWho'); const name = n ? n.value.trim() : '';
  if (!name) { toast('Add a name so you know who this is for.'); return; }
  S.share.name = name; S.share.status = 'active'; S.shareDraft = {}; save(); render(false);
};
A.shareAccess = el => {
  const v = el.dataset.v;
  if (v === 'continue') toast('Sharing stays as it is.');
  if (v === 'change') { S.share.status = 'none'; S.share.name = ''; S.shareDraft = { q81: 'Yes' }; }
  if (v === 'stop') { S.share.status = 'stopped'; S.share.name = ''; S.shareDraft = {}; toast('Sharing stopped.'); }
  save(); render(false);
};
A.shareEntry = el => { S.shareDraft.entry = el.dataset.id; save(); render(false); };
A.sharePreview = () => { if (!S.shareDraft.q82) { toast('Choose what you’d like to share.'); return; } go('sharePreview'); };
A.doShare = () => {
  const txt = buildShare(), dr = S.shareDraft;
  const log = () => { S.share.log.push({ at: Date.now(), what: dr.q82, to: S.share.name }); save(); };
  if (APP) { try { w.Android.share('From Pause and Page', txt); log(); return; } catch (e) { /* fall through */ } }
  if (navigator.share) { navigator.share({ text: txt }).then(log).catch(() => {}); return; }
  if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(() => { log(); toast('Copied. Paste it into a message.'); }).catch(() => toast('Select the text above to copy it.')); }
};

A.toggleSet = el => {
  const k = el.dataset.k; S.settings[k] = !S.settings[k]; applySettings();
  if (k === 'secure' && APP) { try { w.Android.setSecure(!!S.settings.secure); } catch (e) { /* ignore */ } }
  save(); render(false);
};
A.notifSettings = () => { if (APP) { try { w.Android.openNotificationSettings(); } catch (e) { /* ignore */ } } };
A.exportData = () => {
  if (APP) { try { w.Android.share('Pause and Page — my data', JSON.stringify(S, null, 2)); return; } catch (e) { /* fall through */ } }
  go('exportView');
};
A.delAll = el => {
  if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Tap again to delete everything'; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = 'Delete all my data'; } }, 5000); return; }
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  if (APP) { try { w.Android.clearNative(); } catch (e) { /* ignore */ } }
  S = defaults(); stack = [{ r: 'today', p: {} }]; applySettings(); render(true); toast('All data deleted from this device.');
};

/* ---------- events ---------- */
function onClick(e) {
  const el = e.target.closest ? e.target.closest('[data-act]') : null;
  if (!el) return;
  const a = el.dataset.act;
  if (A[a]) { e.preventDefault(); A[a](el, e); }
}
function onInput(e) {
  const el = e.target; if (!el || !el.dataset || el.dataset.bind == null || !F.t) return;
  F.t[el.dataset.bind] = el.value;
  if (el.type === 'range') { const l = doc.getElementById('lab_' + el.dataset.bind); if (l) l.textContent = el.value; }
  changed();
}

/* ---------- public API (used by the Android shell) ---------- */
w.PP = {
  back: back,
  urgent: openUrgent,
  openFromNative: target => {
    const t = String(target || '');
    if (t === 'urgent') { openUrgent(); return; }
    if (t.indexOf('affirmation') === 0 && S.onboarded && !S.under18) {
      if (urgentOpen()) closeUrgent();
      stack = [{ r: 'today', p: {} }, { r: 'affFocus', p: { kind: t.indexOf('evening') > 0 ? 'evening' : 'morning' } }];
      render(true);
    }
  },
  refresh: () => render(false),
  _test: { V: V, A: A, Q: Q, EX: EX, FORMS: FORMS, LESSONS: LESSONS, get S() { return S; }, set S(v) { S = v; }, go: go, render: render, buildShare: buildShare, fillUrgent: fillUrgent }
};

function init() {
  load(); applySettings();
  doc.querySelectorAll('[data-ic]').forEach(x => { x.innerHTML = ic(x.getAttribute('data-ic')); });
  doc.addEventListener('click', onClick);
  doc.addEventListener('input', onInput);
  doc.addEventListener('change', onInput);
  render(true);
  if (S.onboarded) syncReminders();
  if (/[?#&]urgent/.test(w.location.href)) openUrgent();
}
if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
