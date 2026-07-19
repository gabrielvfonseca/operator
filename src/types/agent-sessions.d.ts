// Declares extension points for agent session type augmentation.
export type OperatorAgentSessionSkillSourceAugmentation = never;

declare module "operator/plugin-sdk/agent-sessions" {
  interface Skill {
    // Operator relies on the source identifier returned by skill loaders.
    source: string;
  }
}
