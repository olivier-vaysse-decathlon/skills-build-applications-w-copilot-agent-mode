import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [state, setState] = useState<LeaderboardState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (!Array.isArray(leaderboard)) throw new Error('Invalid API response');
        if (active) setState({ status: 'success', leaderboard });
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
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
        {state.status === 'error' && <p role="alert">Unable to load leaderboard: {state.message}</p>}
        {state.status === 'success' && (
          state.leaderboard.length === 0
            ? <p>No leaderboard rankings yet.</p>
            : <ul>{state.leaderboard.map((entry, index) => (
              <li key={index}>Rank {entry.rank}: {entry.teamName} - {entry.totalPoints} points</li>
            ))}</ul>
        )}
      </div>
    </section>
  );
}
