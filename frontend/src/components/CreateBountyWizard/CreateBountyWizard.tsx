import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { mapErrorMessage } from "../../utils/format";
import {
  SYMBOL_MAX_LENGTH,
  validateDetailsStep,
  validateMilestonesStep,
  validateRewardStep,
} from "../../lib/validation";
import type { BountyDraftData, CreateBountyWizardProps, WizardStep } from "./types";
import "./CreateBountyWizard.css";

export const CREATE_BOUNTY_DRAFT_KEY = "mergemint_create_bounty_draft";

const defaultDraft: BountyDraftData = {
  title: "",
  description: "",
  reward: "",
  maxAssignees: 1,
  milestones: [],
  verifiers: [],
  threshold: 1,
};

interface StoredDraftState {
  formData: BountyDraftData;
  step: WizardStep;
}

/**
 * Retrieves the persisted bounty draft from sessionStorage if available.
 * @returns Parsed draft state or null
 */
function loadDraftFromStorage(): StoredDraftState | null {
  try {
    const raw = sessionStorage.getItem(CREATE_BOUNTY_DRAFT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.formData) {
      return parsed as StoredDraftState;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Multi-step wizard for creating a bounty with per-step validation and session storage draft persistence.
 * @param props Component properties including optional onSubmit and initialData
 * @returns The rendered CreateBountyWizard component
 */
export function CreateBountyWizard({ onSubmit, initialData }: CreateBountyWizardProps) {
  const navigate = useNavigate();

  const [initialLoaded] = useState(() => loadDraftFromStorage());

  const [step, setStep] = useState<WizardStep>(() => {
    if (initialLoaded?.step) {
      return initialLoaded.step;
    }
    return 1;
  });

  const [formData, setFormData] = useState<BountyDraftData>(() => {
    return {
      ...defaultDraft,
      ...(initialLoaded?.formData ?? {}),
      ...(initialData ?? {}),
    };
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stateToStore: StoredDraftState = { formData, step };
      sessionStorage.setItem(CREATE_BOUNTY_DRAFT_KEY, JSON.stringify(stateToStore));
    } catch {
      return;
    }
  }, [formData, step]);

  const handleDetailsNext = useCallback(() => {
    const validation = validateDetailsStep({
      title: formData.title,
      description: formData.description,
    });
    if (!validation.valid) {
      setFieldErrors(validation.errors as Record<string, string>);
      return;
    }
    setFieldErrors({});
    setStep(2);
  }, [formData.title, formData.description]);

  const handleRewardNext = useCallback(() => {
    const validation = validateRewardStep({
      reward: formData.reward,
      maxAssignees: formData.maxAssignees,
    });
    if (!validation.valid) {
      setFieldErrors(validation.errors as Record<string, string>);
      return;
    }
    setFieldErrors({});
    setStep(3);
  }, [formData.reward, formData.maxAssignees]);

  const handleMilestonesNext = useCallback(() => {
    const validation = validateMilestonesStep({
      milestones: formData.milestones,
      totalReward: formData.reward,
      verifiers: formData.verifiers,
      threshold: formData.threshold,
    });
    if (!validation.valid) {
      setFieldErrors(validation.errors as Record<string, string>);
      return;
    }
    setFieldErrors({});
    setStep(4);
  }, [formData.milestones, formData.reward, formData.verifiers, formData.threshold]);

  const handleBack = useCallback(() => {
    setFieldErrors({});
    setSubmitError(null);
    setStep((prev) => (Math.max(1, prev - 1) as WizardStep));
  }, []);

  const handleAddMilestone = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { description: "", reward: "" }],
    }));
  }, []);

  const handleRemoveMilestone = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  }, []);

  const handleMoveMilestone = useCallback((index: number, direction: -1 | 1) => {
    setFormData((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.milestones.length) {
        return prev;
      }
      const nextMilestones = [...prev.milestones];
      const [moved] = nextMilestones.splice(index, 1);
      nextMilestones.splice(target, 0, moved);
      return { ...prev, milestones: nextMilestones };
    });
  }, []);

  const handleMilestoneChange = useCallback(
    (index: number, field: "description" | "reward", value: string) => {
      setFormData((prev) => {
        const nextMilestones = [...prev.milestones];
        nextMilestones[index] = { ...nextMilestones[index], [field]: value };
        return { ...prev, milestones: nextMilestones };
      });
    },
    []
  );

  const handleAddVerifier = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      verifiers: [...prev.verifiers, ""],
    }));
  }, []);

  const handleRemoveVerifier = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      verifiers: prev.verifiers.filter((_, i) => i !== index),
    }));
  }, []);

  const handleVerifierChange = useCallback((index: number, value: string) => {
    setFormData((prev) => {
      const nextVerifiers = [...prev.verifiers];
      nextVerifiers[index] = value;
      return { ...prev, verifiers: nextVerifiers };
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setSubmitError(null);

      try {
        if (onSubmit) {
          await onSubmit(formData);
        } else {
          const payload = {
            title: formData.title,
            description: formData.description,
            reward: formData.reward,
            maxAssignees: formData.maxAssignees,
            milestones: formData.milestones.map((m) => ({
              description: m.description,
              reward: m.reward,
              completed: false,
            })),
          };
          const bounty = await api.createBounty(payload);
          try {
            sessionStorage.removeItem(CREATE_BOUNTY_DRAFT_KEY);
          } catch {
            return;
          }
          navigate(`/bounties/${bounty.id}`);
          return;
        }

        try {
          sessionStorage.removeItem(CREATE_BOUNTY_DRAFT_KEY);
        } catch {
          return;
        }
      } catch (err) {
        setSubmitError(mapErrorMessage(err instanceof Error ? err.message : String(err)));
      } finally {
        setSubmitting(false);
      }
    },
    [formData, onSubmit, navigate]
  );

  const stepsList: Array<{ id: WizardStep; label: string }> = [
    { id: 1, label: "Details" },
    { id: 2, label: "Reward" },
    { id: 3, label: "Milestones" },
    { id: 4, label: "Review" },
  ];

  const milestoneTotal = formData.milestones.reduce((sum, m) => {
    const value = parseFloat(m.reward);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const rewardTotal = parseFloat(formData.reward);
  const milestoneSumMatches =
    formData.milestones.length > 0 &&
    Number.isFinite(rewardTotal) &&
    Math.abs(milestoneTotal - rewardTotal) < 1e-9;

  return (
    <div className="create-bounty-wizard" data-testid="create-bounty-wizard">
      <nav className="wizard-stepper" aria-label="Creation Progress">
        {stepsList.map((s) => (
          <div
            key={s.id}
            className={`wizard-step-indicator ${step === s.id ? "active" : ""} ${
              step > s.id ? "completed" : ""
            }`}
          >
            <div className="wizard-step-circle">{s.id}</div>
            <div className="wizard-step-label">{s.label}</div>
          </div>
        ))}
      </nav>

      {submitError && (
        <div role="alert" className="wizard-error-banner">
          {submitError}
        </div>
      )}

      {step === 1 && (
        <div className="wizard-step-body" data-testid="step-details">
          <div className="wizard-field-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              aria-label="Title"
              className="wizard-input"
              value={formData.title}
              maxLength={SYMBOL_MAX_LENGTH}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title: e.target.value }));
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: "" }));
                }
              }}
            />
            {fieldErrors.title && (
              <span className="wizard-field-error" role="alert">
                {fieldErrors.title}
              </span>
            )}
          </div>

          <div className="wizard-field-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              aria-label="Description"
              className="wizard-textarea"
              value={formData.description}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, description: e.target.value }));
                if (fieldErrors.description) {
                  setFieldErrors((prev) => ({ ...prev, description: "" }));
                }
              }}
            />
            {fieldErrors.description && (
              <span className="wizard-field-error" role="alert">
                {fieldErrors.description}
              </span>
            )}
          </div>

          <div className="wizard-actions">
            <button type="button" className="wizard-button primary" onClick={handleDetailsNext}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step-body" data-testid="step-reward">
          <div className="wizard-field-group">
            <label htmlFor="reward">Total Reward</label>
            <input
              id="reward"
              aria-label="Total Reward"
              className="wizard-input"
              inputMode="decimal"
              value={formData.reward}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, reward: e.target.value }));
                if (fieldErrors.reward) {
                  setFieldErrors((prev) => ({ ...prev, reward: "" }));
                }
              }}
            />
            {fieldErrors.reward && (
              <span className="wizard-field-error" role="alert">
                {fieldErrors.reward}
              </span>
            )}
          </div>

          <div className="wizard-field-group">
            <label htmlFor="maxAssignees">Max Assignees</label>
            <input
              id="maxAssignees"
              aria-label="Max Assignees"
              className="wizard-input"
              type="number"
              min={1}
              value={formData.maxAssignees}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setFormData((prev) => ({
                  ...prev,
                  maxAssignees: Number.isFinite(value) ? value : 1,
                }));
                if (fieldErrors.maxAssignees) {
                  setFieldErrors((prev) => ({ ...prev, maxAssignees: "" }));
                }
              }}
            />
            {fieldErrors.maxAssignees && (
              <span className="wizard-field-error" role="alert">
                {fieldErrors.maxAssignees}
              </span>
            )}
          </div>

          <div className="wizard-actions">
            <button type="button" className="wizard-button" onClick={handleBack}>
              Back
            </button>
            <button type="button" className="wizard-button primary" onClick={handleRewardNext}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="wizard-step-body" data-testid="step-milestones">
          <div className="wizard-milestones-header">
            <h3>Milestones</h3>
            <p className="wizard-milestones-hint">
              Add milestones whose amounts sum to the total reward of {formData.reward || "0"}.
            </p>
          </div>

          {formData.milestones.length === 0 && (
            <p className="wizard-milestones-empty">No milestones yet. Add one to split the reward.</p>
          )}

          <ul className="wizard-milestones-list">
            {formData.milestones.map((milestone, index) => (
              <li key={index} className="wizard-milestone-item" data-testid={`milestone-${index}`}>
                <div className="wizard-milestone-order">{index + 1}</div>
                <div className="wizard-milestone-fields">
                  <div className="wizard-field-group">
                    <label htmlFor={`milestone-description-${index}`}>Description</label>
                    <input
                      id={`milestone-description-${index}`}
                      aria-label={`Milestone ${index + 1} description`}
                      className="wizard-input"
                      value={milestone.description}
                      onChange={(e) =>
                        handleMilestoneChange(index, "description", e.target.value)
                      }
                    />
                  </div>
                  <div className="wizard-field-group">
                    <label htmlFor={`milestone-reward-${index}`}>Amount</label>
                    <input
                      id={`milestone-reward-${index}`}
                      aria-label={`Milestone ${index + 1} amount`}
                      className="wizard-input"
                      inputMode="decimal"
                      value={milestone.reward}
                      onChange={(e) => handleMilestoneChange(index, "reward", e.target.value)}
                    />
                  </div>
                </div>
                <div className="wizard-milestone-controls">
                  <button
                    type="button"
                    className="wizard-icon-button"
                    aria-label={`Move milestone ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => handleMoveMilestone(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="wizard-icon-button"
                    aria-label={`Move milestone ${index + 1} down`}
                    disabled={index === formData.milestones.length - 1}
                    onClick={() => handleMoveMilestone(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="wizard-icon-button danger"
                    aria-label={`Remove milestone ${index + 1}`}
                    onClick={() => handleRemoveMilestone(index)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="wizard-milestones-summary">
            <span>
              Sum: {milestoneTotal} / {formData.reward || "0"}
            </span>
            {formData.milestones.length > 0 && !milestoneSumMatches && (
              <span className="wizard-field-error" role="alert">
                Milestone amounts must sum to the total reward.
              </span>
            )}
          </div>

          {fieldErrors.milestones && (
            <span className="wizard-field-error" role="alert">
              {fieldErrors.milestones}
            </span>
          )}

          <div className="wizard-actions">
            <button type="button" className="wizard-button" onClick={handleAddMilestone}>
              Add Milestone
            </button>
            <button type="button" className="wizard-button" onClick={handleBack}>
              Back
            </button>
            <button type="button" className="wizard-button primary" onClick={handleMilestonesNext}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <form className="wizard-step-body" data-testid="step-review" onSubmit={handleSubmit}>
          <div className="wizard-field-group">
            <label htmlFor="verifier">Verifiers</label>
            {formData.verifiers.map((verifier, index) => (
              <div key={index} className="wizard-verifier-row">
                <input
                  id={`verifier-${index}`}
                  aria-label={`Verifier ${index + 1}`}
                  className="wizard-input"
                  value={verifier}
                  onChange={(e) => handleVerifierChange(index, e.target.value)}
                />
                <button
                  type="button"
                  className="wizard-icon-button danger"
                  aria-label={`Remove verifier ${index + 1}`}
                  onClick={() => handleRemoveVerifier(index)}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="wizard-button" onClick={handleAddVerifier}>
              Add Verifier
            </button>
            {fieldErrors.verifiers && (
              <span className="wizard-field-error" role="alert">
                {fieldErrors.verifiers}
              </span>
            )}
          </div>

          <div className="wizard-field-group">
            <label htmlFor="threshold">Approval Threshold</label>
            <input
              id="threshold"
              aria-label="Approval Threshold"
              className="wizard-input"
              type="number"
              min={1}
              value={formData.threshold}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setFormData((prev) => ({
                  ...prev,
                  threshold: Number.isFinite(value) ? value : 1,
                }));
                if (fieldErrors.threshold) {
                  setFieldErrors((prev) => ({ ...prev, threshold: "" }));
                }
              }}
            />
            {fieldErrors.threshold && (
              <span className="wizard-field-error" role="alert">
                {fieldErrors.threshold}
              </span>
            )}
          </div>

          <div className="wizard-actions">
            <button type="button" className="wizard-button" onClick={handleBack}>
              Back
            </button>
            <button type="submit" className="wizard-button primary" disabled={submitting}>
              {submitting ? "Creating..." : "Create Bounty"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
