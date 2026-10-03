// Per-worker frame counts and busy time, to show how parallel a render really was.
export function workerStats(count) {
  const frames = new Array(count).fill(0);
  const busyMs = new Array(count).fill(0);
  const started = Date.now();
  return {
    record(worker, ms) {
      frames[worker]++;
      busyMs[worker] += ms;
    },
    // e.g. "workers 14 15 15 14"
    line: () => `workers ${frames.join(' ')}`,
    // e.g. "4 workers, 3.6x parallel (busy 36.0s in 10.0s)"
    summary() {
      const wall = Date.now() - started;
      const busy = busyMs.reduce((a, b) => a + b, 0);
      return `${count} workers, ${(busy / Math.max(1, wall)).toFixed(1)}x parallel (busy ${(busy / 1000).toFixed(1)}s in ${(wall / 1000).toFixed(1)}s)`;
    },
  };
}
