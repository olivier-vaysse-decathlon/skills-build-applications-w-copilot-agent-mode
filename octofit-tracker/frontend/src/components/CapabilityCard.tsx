import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  dataKey: string;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
};

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; items: T[] };

export function CapabilityCard<T>({ title, description, path, dataKey, emptyText, renderItem }: Props<T>) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    getJson<Record<string, T[]>>(path)
      .then((response) => {
        const items = response[dataKey];
        if (!Array.isArray(items)) throw new Error('Invalid API response');
        if (active) setState({ status: 'success', items });
      })
      .catch((error: unknown) => {
        if (active) setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    return () => { active = false; };
  }, [path, dataKey]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}: {state.message}</p>}
        {state.status === 'success' && (
          state.items.length === 0
            ? <p>{emptyText}</p>
            : <ul>{state.items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>
        )}
      </div>
    </section>
  );
}
