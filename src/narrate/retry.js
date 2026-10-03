/** call fn until it succeeds, at most `attempts` times; rethrows the last error. onRetry(n) runs before each new attempt. */
export function retry(fn, { attempts = 4, onRetry = () => {} } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return fn();
    } catch (e) {
      if (attempt >= attempts) throw e;
      onRetry(attempt);
    }
  }
}
