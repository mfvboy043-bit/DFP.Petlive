/**
 * Uniform module boundary result.
 * Callers must handle ok:false without throwing across features.
 */

/**
 * @template T
 * @typedef {{ ok: true, data: T } | { ok: false, error: ModuleError }} ModuleResult
 */

/**
 * @typedef {{ code: string, message: string, cause?: unknown }} ModuleError
 */

/**
 * @template T
 * @param {T} data
 * @returns {ModuleResult<T>}
 */
export function ok(data) {
  return { ok: true, data };
}

/**
 * @param {string} code
 * @param {string} message
 * @param {unknown} [cause]
 * @returns {ModuleResult<never>}
 */
export function fail(code, message, cause) {
  return { ok: false, error: { code, message, cause } };
}

/**
 * Run a module function and never let exceptions escape the boundary.
 * @template T
 * @param {() => T} fn
 * @param {string} [code]
 * @returns {ModuleResult<T>}
 */
export function guard(fn, code = "MODULE_ERROR") {
  try {
    return ok(fn());
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Unknown module failure";
    return fail(code, message, cause);
  }
}

/**
 * @template T
 * @param {ModuleResult<T>} result
 * @param {T} fallback
 * @returns {T}
 */
export function dataOr(result, fallback) {
  return result.ok ? result.data : fallback;
}
