import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  generateText,
  requireChatAgentModel,
  getProject,
  getConfiguration,
  listSections,
  listCompetitors,
} = vi.hoisted(() => ({
  generateText: vi.fn(),
  requireChatAgentModel: vi.fn(),
  getProject: vi.fn(),
  getConfiguration: vi.fn(),
  listSections: vi.fn(),
  listCompetitors: vi.fn(),
}));

vi.mock("ai", () => ({
  generateText,
  Output: { object: (value: unknown) => value },
}));
vi.mock(
  "@/server/features/chat-provider/services/ChatAgentModelService",
  () => ({ requireChatAgentModel }),
);
vi.mock("@/server/lib/chatAgent", () => ({ openRouterCostUsd: () => 0 }));
vi.mock("@/server/lib/runtime-env", () => ({
  isHostedServerAuthMode: async () => false,
}));
vi.mock("@/server/billing/subscription", () => ({
  checkUsageCreditsDepleted: vi.fn(),
}));
vi.mock("@/server/billing/researchSpend", () => ({
  billResearchSpend: vi.fn(),
}));
vi.mock("../repositories/AiVisibilityRepository", () => ({
  AiVisibilityRepository: { getConfiguration },
}));
vi.mock("@/server/features/projects/repositories/ProjectRepository", () => ({
  ProjectRepository: { getProjectForOrganization: getProject },
}));
vi.mock(
  "@/server/features/project-context/repositories/ProjectContextRepository",
  () => ({
    ProjectContextRepository: { listSections, listCompetitors },
  }),
);

import { customer } from "./aiVisibilityTestFixtures";
import { generateAiPrompts } from "./aiPromptSuggestions";

const chatModel = { modelId: "saved-chat-model" };

describe("generateAiPrompts", () => {
  beforeEach(() => {
    requireChatAgentModel.mockResolvedValue(chatModel);
    getProject.mockResolvedValue({
      id: "project",
      name: "OpenSEO",
      domain: "openseo.so",
    });
    getConfiguration.mockResolvedValue(null);
    listSections.mockResolvedValue([]);
    listCompetitors.mockResolvedValue([]);
    generateText.mockResolvedValue({
      output: {
        name: "SEO tools",
        prompts: [
          "Which SEO tool is best?",
          "How do SEO tools compare?",
          "What is an affordable SEO tool?",
          "Which SEO tool is easiest to use?",
          "What should I look for in an SEO tool?",
        ],
      },
    });
  });

  it("uses the resolved chat provider model", async () => {
    await generateAiPrompts(
      {
        projectId: "project",
        excludePrompts: [],
        locationCode: 2840,
        languageCode: "en",
      },
      customer,
    );

    expect(requireChatAgentModel).toHaveBeenCalledWith("low");
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: chatModel,
      }),
    );
  });
});
