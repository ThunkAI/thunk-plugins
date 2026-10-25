export type Thunk = {
  id: string;
  name: string;
  url: string;
  phase: string;
  folder: string;
};

// What the pane knows about the person's thunks: nothing yet (Claude has not listed them in
// this or an earlier session), or the last unfiltered list Claude ran and when.
export type Account =
  | { kind: "unknown" }
  | { kind: "ready"; thunks: Thunk[]; listedAt: number };

// The thunk the person is working on; the name when the pane knows it.
export type CurrentThunk = { id: string; name?: string };

export type NextStep = { label: string; prompt: string };

declare module "claude-code" {
  interface PluginState {
    "thunk-skills": {
      account: Account;
      isNew: boolean;
      next: NextStep | null;
      isPaneOpen: boolean;
      isChipHidden: boolean;
      current: CurrentThunk | null;
    };
  }
}
