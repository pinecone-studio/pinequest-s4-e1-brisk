"use client";

import {
  OnboardingStoreProvider,
  useOnboardingStore,
} from "@/app/onboarding/use-onboarding-store";
import { OnboardingShell } from "@/components/onboarding/onboarding-layout";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMyProjects, initializeProject } from "@/lib/api/projects";
import {
  exportGithubMilestones,
  extractApiError,
  fetchGithubStatus,
  setGithubUserId,
} from "@/lib/integrations/github";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import { clearOnboardingDraft } from "@/lib/onboarding-draft-storage";
import { PROJECT_CHANGED_EVENT, saveOnboardingData } from "@/lib/onboarding-storage";
import { StepProjectSetup } from "./steps/step-project-setup";
import { StepTddDiscovery } from "./steps/step-tdd-discovery";
import { StepPlanning } from "./steps/step-planning";
import { StepInviteTeam } from "./steps/step-invite-team";
import { StepIntegrations } from "./steps/step-integrations";

function isDiscoveryCanvas(step: number) {
  return step === 1;
}

function isExpandedStep(step: number) {
  return step === 2;
}

function isWideStep(step: number) {
  return step === 2 || step === 4;
}

function OnboardingWizardContent() {
  const router = useRouter();
  const { userId, isLoaded: userReady } = useInternalUserId();
  const {
    step,
    step3,
    step4,
    inviteToken,
    setInviteToken,
    toOnboardingData,
    toInitializePayload,
    goToPreviousStep,
  } = useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectCreateError, setProjectCreateError] = useState<string | null>(
    null,
  );
  const projectCreationRef = useRef(false);
  const lastSyncedStepRef = useRef(-1);

  const persistProject = useCallback(async () => {
    const result = await initializeProject(toInitializePayload());
    setInviteToken(result.project.inviteToken);
    saveOnboardingData({
      ...toOnboardingData(),
      projectId: result.project.id,
      workspaceId: result.project.workspaceId,
      projectName: result.project.name,
    });
    window.dispatchEvent(new Event(PROJECT_CHANGED_EVENT));
    return result;
  }, [setInviteToken, toInitializePayload, toOnboardingData]);

  // Create the project as soon as step 1 ("Create project") is done so an
  // invite link can be shared before the rest of onboarding is finished.
  useEffect(() => {
    if (step < 1 || inviteToken || projectCreationRef.current || !userReady) {
      return;
    }
    projectCreationRef.current = true;
    setProjectCreateError(null);

    persistProject().catch((createError) => {
      projectCreationRef.current = false;
      setProjectCreateError(
        extractApiError(createError, "Could not create project. Please retry."),
      );
    });
  }, [step, inviteToken, userReady, persistProject]);

  // Sync milestones and collaborators to the cloud as the user advances.
  useEffect(() => {
    if (step < 2 || !userReady || !inviteToken || step <= lastSyncedStepRef.current) {
      return;
    }
    lastSyncedStepRef.current = step;
    void persistProject().catch(() => {
      lastSyncedStepRef.current = step - 1;
    });
  }, [step, inviteToken, userReady, persistProject]);

  const finish = async () => {
    if (!userReady) {
      setError("Sign in to finish onboarding and save your project.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (
        step3.githubConnected &&
        step4.milestoneDrafts.some((draft) => draft.tasks.some((task) => task.trim()))
      ) {
        setGithubUserId(userId);
        const status = await fetchGithubStatus();
        if (status.repoOwner && status.repoName && status.githubProjectId) {
          await exportGithubMilestones({
            owner: status.repoOwner,
            repo: status.repoName,
            githubProjectId: status.githubProjectId,
            milestones: step4.milestoneDrafts
              .filter((draft) => draft.isApproved)
              .map((draft) => ({
                title: draft.title,
                tasks: draft.tasks,
              })),
          });
        }
      }

      const result = await persistProject();
      const members = result.members.map((member) => ({
        email: member.email,
        name: member.email.split("@")[0] ?? member.email,
        role: member.role,
      }));

      saveOnboardingData({
        ...toOnboardingData(),
        projectId: result.project.id,
        workspaceId: result.project.workspaceId,
        projectName: result.project.name,
        members,
      });

      await fetchMyProjects({ force: true });
      clearOnboardingDraft();
      router.push("/dashboard");
    } catch (finishError) {
      setError(
        extractApiError(
          finishError,
          "Could not save your project. Check your connection and try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (isDiscoveryCanvas(step)) {
    return (
      <OnboardingShell
        step={step}
        maxWidth="full"
        onBack={goToPreviousStep}
        fillHeight
        immersive
        contentClassName="min-h-0"
      >
        {projectCreateError ? (
          <p className="mb-4 text-center text-sm text-amber-400">
            {projectCreateError}
          </p>
        ) : null}
        <StepTddDiscovery />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={step}
      onBack={goToPreviousStep}
      maxWidth={isWideStep(step) ? "xl" : "lg"}
      fillHeight={isExpandedStep(step)}
      contentClassName={isExpandedStep(step) ? "min-h-0 py-4 md:py-6" : undefined}
    >
      {projectCreateError ? (
        <p className="mb-4 text-center text-sm text-amber-400">
          {projectCreateError}
        </p>
      ) : null}
      {step === 0 ? <StepProjectSetup /> : null}
      {step === 2 ? <StepPlanning /> : null}
      {step === 3 ? <StepInviteTeam /> : null}
      {step === 4 ? <StepIntegrations onFinish={finish} disabled={saving} /> : null}

      {error ? (
        <p className="mt-4 text-center text-sm text-amber-400">{error}</p>
      ) : null}
    </OnboardingShell>
  );
}

export function OnboardingWizard() {
  return (
    <OnboardingStoreProvider>
      <OnboardingWizardContent />
    </OnboardingStoreProvider>
  );
}
