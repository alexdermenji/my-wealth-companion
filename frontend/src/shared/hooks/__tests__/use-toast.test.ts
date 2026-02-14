import { describe, it, expect } from "vitest";
import { reducer } from "../use-toast";

type Toast = { id: string; title?: string; open?: boolean };
type State = { toasts: Toast[] };

const makeToast = (id: string, title = `Toast ${id}`): Toast => ({
  id,
  title,
  open: true,
});

describe("use-toast reducer", () => {
  it("ADD_TOAST adds a toast to the beginning", () => {
    const state: State = { toasts: [] };
    const result = reducer(state, {
      type: "ADD_TOAST",
      toast: makeToast("1"),
    } as never);
    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].id).toBe("1");
  });

  it("ADD_TOAST prepends new toast before existing ones", () => {
    const state: State = { toasts: [makeToast("1")] };
    const result = reducer(state, {
      type: "ADD_TOAST",
      toast: makeToast("2"),
    } as never);
    expect(result.toasts[0].id).toBe("2");
  });

  it("ADD_TOAST enforces limit of 1", () => {
    const state: State = { toasts: [makeToast("1")] };
    const result = reducer(state, {
      type: "ADD_TOAST",
      toast: makeToast("2"),
    } as never);
    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].id).toBe("2");
  });

  it("UPDATE_TOAST updates matching toast", () => {
    const state: State = { toasts: [makeToast("1", "Old")] };
    const result = reducer(state, {
      type: "UPDATE_TOAST",
      toast: { id: "1", title: "New" },
    } as never);
    expect(result.toasts[0].title).toBe("New");
  });

  it("UPDATE_TOAST does not affect non-matching toasts", () => {
    const state: State = { toasts: [makeToast("1", "Keep")] };
    const result = reducer(state, {
      type: "UPDATE_TOAST",
      toast: { id: "999", title: "New" },
    } as never);
    expect(result.toasts[0].title).toBe("Keep");
  });

  it("DISMISS_TOAST sets open to false for matching toast", () => {
    const state: State = { toasts: [makeToast("1")] };
    const result = reducer(state, {
      type: "DISMISS_TOAST",
      toastId: "1",
    } as never);
    expect(result.toasts[0].open).toBe(false);
  });

  it("DISMISS_TOAST without id dismisses all toasts", () => {
    const state: State = {
      toasts: [makeToast("1"), makeToast("2")],
    };
    const result = reducer(state, { type: "DISMISS_TOAST" } as never);
    expect(result.toasts.every((t: Toast) => t.open === false)).toBe(true);
  });

  it("REMOVE_TOAST removes matching toast", () => {
    const state: State = { toasts: [makeToast("1")] };
    const result = reducer(state, {
      type: "REMOVE_TOAST",
      toastId: "1",
    } as never);
    expect(result.toasts).toHaveLength(0);
  });

  it("REMOVE_TOAST without id removes all toasts", () => {
    const state: State = {
      toasts: [makeToast("1"), makeToast("2")],
    };
    const result = reducer(state, { type: "REMOVE_TOAST" } as never);
    expect(result.toasts).toHaveLength(0);
  });
});
