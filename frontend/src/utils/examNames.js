// What each country calls its senior secondary exam. Nigerian students know the
// WAEC exam as the SSCE; everywhere else on the platform it's the WASSCE.
export const seniorExamName = (country) => (country === 'NG' ? 'SSCE' : 'WASSCE');

// These are practice questions written in the exam's style, not real past
// papers. Don't call them past questions unless licensed papers are added.
export const practiceLabel = (level, country) => {
  if (level === 'jhs') return 'BECE practice questions';
  if (level === 'shs') return `${seniorExamName(country)} practice questions`;
  return 'Practice questions';
};
