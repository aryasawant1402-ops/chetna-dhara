import { useEffect, useState } from "react";
import { downloadPdf, loadMergedHistory, localScore, syncCompletedSession } from "../api/client";
import type { HistoryEntry } from "../domain/dossier";
import { SessionHistory } from "./SessionHistory";
import { hiCatalog } from "../i18n/hi";
import { clinicalCapMs } from "../domain/pacing";
import { conditionLabels } from "../domain/offline";
import type { ColorVision, ConditionId } from "../domain/types";
import { useSession } from "../state/sessionStore";

const conditions: ConditionId[] = ["adhd", "asd", "dyslexia", "dyspraxia", "idd"];
const visions: { id: ColorVision; label: string }[] = [
  { id: "typical", label: "Typical" },
  { id: "protanopia", label: "Protanopia" },
  { id: "deuteranopia", label: "Deuteranopia" },
  { id: "tritanopia", label: "Tritanopia" },
];

export function Caregiver() {
  const displayName = useSession((state) => state.displayName);
  const ageYears = useSession((state) => state.ageYears);
  const condition = useSession((state) => state.condition);
  const colorVision = useSession((state) => state.colorVision);
  const darkMode = useSession((state) => state.darkMode);
  const pace = useSession((state) => state.pace);
  const locale = useSession((state) => state.locale);
  const endReason = useSession((state) => state.endReason);
  const syncState = useSession((state) => state.syncState);
  const serverExplain = useSession((state) => state.serverExplain);
  const setProfile = useSession((state) => state.setProfile);
  const leaveCaregiver = useSession((state) => state.leaveCaregiver);
  const prepareNewSession = useSession((state) => state.prepareNewSession);
  const remoteId = useSession((state) => state.remoteId);
  const [pdfError, setPdfError] = useState("");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const finished = endReason !== null;
  const score = finished ? localScore() : null;
  const clinicalMinutes = clinicalCapMs(ageYears) / 60_000;

  useEffect(() => {
    let cancelled = false;
    void loadMergedHistory(displayName).then((next) => {
      if (!cancelled) setEntries(next);
    });
    return () => {
      cancelled = true;
    };
  }, [displayName, syncState, endReason, remoteId]);

  async function onPdf() {
    if (!remoteId) return;
    setPdfError("");
    try {
      await downloadPdf(remoteId);
    } catch {
      setPdfError("The PDF could not be created. Check that the API is running.");
    }
  }

  return (
    <main className="screen caregiver">
      <p className="wordmark">Caregiver</p>
      <h2>{finished ? score?.badge : "Before the session"}</h2>
      {score ? (
        <section className="report" data-testid="sitting">
          <p className="note">{score.disclaimer}</p>
          <h3>Strengths</h3>
          <ul>
            {score.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Focus next time</h3>
          <ul>
            {score.focusAreas.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <strong>{score.nicheTitle}.</strong> {score.nicheNote}
          </p>
          <p className="note" data-testid="explain">
            {(serverExplain ?? score.explain).note}
          </p>
          {(serverExplain?.attributions ?? []).length > 0 ? (
            <ul>
              {serverExplain?.attributions?.map((item) => (
                <li key={item.name}>
                  {item.label}: {item.direction}.
                </li>
              ))}
            </ul>
          ) : null}
          {syncState === "offline" ? (
            <button type="button" className="quiet" onClick={() => void syncCompletedSession()}>
              Save session again
            </button>
          ) : null}
          <button type="button" className="primary" data-testid="pdf" disabled={!remoteId} onClick={() => void onPdf()}>
            {remoteId ? "Download 1-page note" : "PDF needs the API"}
          </button>
          {pdfError ? <p className="note">{pdfError}</p> : null}
        </section>
      ) : (
        <p className="lede">The child session uses these settings. Scores stay on this screen.</p>
      )}

      <SessionHistory displayName={displayName} entries={entries} />

      <label>
        Name
        <input
          value={displayName}
          maxLength={40}
          onChange={(event) => setProfile({ displayName: event.target.value || "Friend" })}
        />
      </label>

      <fieldset>
        <legend>Age</legend>
        <div className="choices">
          {[6, 7, 8].map((age) => (
            <button
              key={age}
              type="button"
              className={ageYears === age ? "choice on" : "choice"}
              onClick={() => setProfile({ ageYears: age as 6 | 7 | 8 })}
            >
              {age}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Sensory profile</legend>
        <div className="choices">
          {conditions.map((item) => (
            <button
              key={item}
              type="button"
              className={condition === item ? "choice on" : "choice"}
              onClick={() => setProfile({ condition: item })}
            >
              {conditionLabels[item]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Color vision</legend>
        <div className="choices">
          {visions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={colorVision === item.id ? "choice on" : "choice"}
              onClick={() => setProfile({ colorVision: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="check">
        <input
          type="checkbox"
          checked={darkMode}
          onChange={(event) => setProfile({ darkMode: event.target.checked })}
        />
        Low-luminance dark mode
      </label>

      <fieldset>
        <legend>Session length</legend>
        <div className="choices">
          <button
            type="button"
            className={pace === "judging" ? "choice on" : "choice"}
            onClick={() => setProfile({ pace: "judging" })}
          >
            Judging pace
          </button>
          <button
            type="button"
            className={pace === "clinical" ? "choice on" : "choice"}
            onClick={() => setProfile({ pace: "clinical" })}
          >
            Clinical cap
          </button>
        </div>
        <p className="note">
          Clinical cap for age {ageYears} is {clinicalMinutes} minutes. Judging pace is a 30 second warm-up, a 60
          second game, and a 20 second rest so the ending can be shown.
        </p>
      </fieldset>

      <label className="check">
        <input
          type="checkbox"
          checked={locale === "hi"}
          onChange={(event) => setProfile({ locale: event.target.checked ? "hi" : "en" })}
        />
        Hindi string table ({Object.keys(hiCatalog).length} translated strings)
      </label>

      <div className="row">
        <button type="button" className="quiet" onClick={leaveCaregiver}>
          {finished ? "Back to the quest" : "Back to the child"}
        </button>
        {finished ? (
          <button type="button" className="primary" onClick={prepareNewSession}>
            Prepare a new session
          </button>
        ) : null}
      </div>
    </main>
  );
}
