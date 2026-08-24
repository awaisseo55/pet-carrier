// Test-only stub. The real "server-only" package throws unconditionally
// when actually executed (it relies on Next's bundler swapping in a no-op
// for genuine server code and only lets the throw reach client bundles).
// Vitest runs in plain Node with no such bundler step, so it's aliased to
// this empty module, see vitest.config.ts.
export {};
