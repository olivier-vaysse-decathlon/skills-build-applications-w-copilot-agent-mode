import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string };
const userEmail = 'mona@example.com';

export default function Workouts() {
  return <CapabilityCard<Suggestion>
    title="Workout suggestions"
    description={`Recommend workouts from activity patterns for ${userEmail}.`}
    path={`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`}
    dataKey="suggestions"
    emptyText="No workout suggestions yet."
    renderItem={(suggestion) => <>{suggestion.title} - {suggestion.reason}</>}
  />;
}
