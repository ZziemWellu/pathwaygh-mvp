// One icon set (lucide-react) for the whole app. Emoji used to stand in
// for icons, but they render differently on every phone brand and read as
// clip art next to the line icons in the navigation. Data that arrives
// with an emoji (achievements, practice subjects) is mapped to an icon by
// id here instead, so the backend's emoji field is never rendered.
import {
  Award, BookOpen, BookOpenText, Brain, CalendarDays, Calculator, CirclePlay, Flame,
  FlaskConical, GraduationCap, Languages, Layers, ListChecks, Rocket, Star, Trophy,
} from 'lucide-react';

export const ACHIEVEMENT_ICONS = {
  first_quiz: Rocket,
  first_lesson: BookOpenText,
  streak_3: Flame,
  streak_7: CalendarDays,
  streak_30: Trophy,
  quiz_master_10: Brain,
  high_scorer: Award,
  mastery_achieved: Star,
  course_complete: GraduationCap,
  wordsmith: BookOpen,
  flashcard_habit: Layers,
};

export const achievementIcon = (id) => ACHIEVEMENT_ICONS[id] || Award;

// Subject ids carry a country suffix (mathematics_ng, science_gm...).
const SUBJECT_ICONS = { mathematics: Calculator, english: Languages, science: FlaskConical };

export const subjectIcon = (id = '') => SUBJECT_ICONS[id.split('_')[0]] || BookOpen;

export const LESSON_ICONS = { video: CirclePlay, quiz: ListChecks, text: BookOpenText };

export const lessonIcon = (type) => LESSON_ICONS[type] || BookOpenText;

// Render-ready versions: <AchievementIcon id={a.id} size={32} />.
export const AchievementIcon = ({ id, ...props }) => {
  const Icon = achievementIcon(id);
  return <Icon aria-hidden="true" {...props} />;
};

export const SubjectIcon = ({ id, ...props }) => {
  const Icon = subjectIcon(id);
  return <Icon aria-hidden="true" {...props} />;
};

export const LessonIcon = ({ type, ...props }) => {
  const Icon = lessonIcon(type);
  return <Icon aria-hidden="true" {...props} />;
};
