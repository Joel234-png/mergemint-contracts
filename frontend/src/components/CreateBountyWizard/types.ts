export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: string;
}

export interface BountyFormData {
  title: string;
  description: string;
  reward: string;
  deadline: string;
  category: string;
  milestones: Milestone[];
}

export type WizardStep =
  | "details"
  | "milestones"
  | "review"
  | "payment";

export interface WizardStepConfig {
  id: WizardStep;
  label: string;
  description: string;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: "details",
    label: "Details",
    description: "Describe your bounty",
  },
  {
    id: "milestones",
    label: "Milestones",
    description: "Break the reward into milestones",
  },
  {
    id: "review",
    label: "Review",
    description: "Review before publishing",
  },
  {
    id: "payment",
    label: "Payment",
    description: "Fund the bounty",
  },
];

export const createEmptyMilestone = (): Milestone => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `milestone-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: "",
  description: "",
  amount: "",
});

export const parseAmount = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getMilestonesTotal = (milestones: Milestone[]): number =>
  milestones.reduce((sum, milestone) => sum + parseAmount(milestone.amount), 0);

export interface MilestoneValidationResult {
  valid: boolean;
  errors: string[];
  total: number;
  remaining: number;
}

export const validateMilestones = (
  milestones: Milestone[],
  reward: string
): MilestoneValidationResult => {
  const errors: string[] = [];
  const totalReward = parseAmount(reward);

  if (milestones.length === 0) {
    errors.push("Add at least one milestone.");
  }

  milestones.forEach((milestone, index) => {
    const amount = parseAmount(milestone.amount);
    if (!milestone.title.trim()) {
      errors.push(`Milestone ${index + 1} needs a title.`);
    }
    if (!milestone.amount.trim() || amount <= 0) {
      errors.push(`Milestone ${index + 1} needs a positive amount.`);
    }
  });

  const total = getMilestonesTotal(milestones);
  const remaining = totalReward - total;

  if (milestones.length > 0 && Math.abs(remaining) > 0.000001) {
    errors.push(
      remaining > 0
        ? `Milestone amounts are ${remaining.toFixed(2)} short of the total reward.`
        : `Milestone amounts exceed the total reward by ${Math.abs(remaining).toFixed(2)}.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    total,
    remaining,
  };
};
