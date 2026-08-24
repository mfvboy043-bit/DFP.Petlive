/**
 * Browser bridge to modular building blocks.
 * Serve repo root (`npm run serve` / python from petlive/) then open /apps/web/
 */
import * as shared from "../../../packages/shared/result.js";
import * as pet from "../../../modules/pet/index.js";
import * as drug from "../../../modules/drug/index.js";
import { drugs as drugSeed } from "../../../modules/drug/seed.js";
import * as visit from "../../../modules/visit/index.js";
import * as alert from "../../../modules/medical-alert/index.js";
import * as vaccine from "../../../modules/vaccine/index.js";
import * as medication from "../../../modules/medication/index.js";
import * as emergency from "../../../modules/emergency-card/index.js";

/** Classic app.js fallbacks (`searchDrugs` / `resolveEnrichedDrug`) read this global. */
window.drugs = drugSeed;

const PetLive = {
  shared,
  pet,
  drug,
  visit,
  alert,
  vaccine,
  medication,
  emergency,
  /**
   * Demo / QA: which emergency upstream sections should fail.
   * Read from sessionStorage `petlive-inject-fail` JSON, e.g. {"alerts":true}
   * or URL `?injectFail=alerts,medications`.
   */
  readInjectFail() {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("injectFail");
      if (q) {
        const flags = {};
        q.split(",").forEach((key) => {
          const k = key.trim();
          if (k) flags[k] = true;
        });
        return flags;
      }
      const raw = sessionStorage.getItem("petlive-inject-fail");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  },
  setInjectFail(flags) {
    try {
      if (!flags || !Object.keys(flags).length) {
        sessionStorage.removeItem("petlive-inject-fail");
      } else {
        sessionStorage.setItem("petlive-inject-fail", JSON.stringify(flags));
      }
    } catch {
      /* ignore */
    }
  },
  /**
   * Safe call helper for UI features — never throws into the shell.
   * @template T
   * @param {() => import('../../../packages/shared/result.js').ModuleResult<T> | T} fn
   * @param {T} fallback
   */
  call(fn, fallback) {
    try {
      const result = fn();
      if (result && typeof result === "object" && "ok" in result) {
        return result.ok ? result.data : fallback;
      }
      return result;
    } catch (error) {
      console.warn("[PetLive.call]", error);
      return fallback;
    }
  },
};

window.PetLive = PetLive;
window.dispatchEvent(new Event("petlive:ready"));

export { PetLive };
