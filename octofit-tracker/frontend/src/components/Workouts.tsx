import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason: string };
type WorkoutState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; suggestions: Suggestion[] };
const userEmail = 'mona@example.com';

export default function Workouts() {
  const [state, setState] = useState<WorkoutState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then(({ suggestions }) => {
        if (!Array.isArray(suggestions)) throw new Error('Invalid API response');
        if (active) setState({ status: 'success', suggestions });
      })
      .catch((error: unknown) => {
        if (active) setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns for {userEmail}.</p>
        {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
        {state.status === 'error' && <p role="alert">Unable to load workout suggestions: {state.message}</p>}
        {state.status === 'success' && (
          state.suggestions.length === 0
            ? <p>No workout suggestions yet.</p>
            : <ul>{state.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion.title} - {suggestion.reason}</li>
            ))}</ul>
        )}
      </div>
    </section>
  );
}
