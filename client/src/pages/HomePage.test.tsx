import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HomePage } from "./HomePage";

// Mock the hook — HomePage test only cares that it wires props correctly
vi.mock("../hooks/useTasks", () => ({
  useTasks: vi.fn(),
}));

// Mock child components as identifiable stubs
vi.mock("../components/TaskInput", () => ({
  TaskInput: (props: { createTask: unknown }) => (
    <div
      data-testid="task-input"
      data-has-create={String(typeof props.createTask === "function")}
    />
  ),
}));

vi.mock("../components/TaskList", () => ({
  TaskList: (props: {
    tasks: unknown[];
    isLoading: boolean;
    error: string | null;
    toggleTask: unknown;
    deleteTask: unknown;
  }) => (
    <div
      data-testid="task-list"
      data-loading={String(props.isLoading)}
      data-error={String(props.error)}
      data-task-count={String(props.tasks.length)}
      data-has-toggle={String(typeof props.toggleTask === "function")}
      data-has-delete={String(typeof props.deleteTask === "function")}
    />
  ),
}));

import { useTasks } from "../hooks/useTasks";
const mockUseTasks = vi.mocked(useTasks);

describe("HomePage", () => {
  beforeEach(() => {
    mockUseTasks.mockReturnValue({
      tasks: [],
      isLoading: false,
      error: null,
      createTask: vi.fn(),
      toggleTask: vi.fn(),
      deleteTask: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders TaskInput and TaskList", () => {
    render(<HomePage />);
    expect(screen.getByTestId("task-input")).toBeInTheDocument();
    expect(screen.getByTestId("task-list")).toBeInTheDocument();
  });

  it("passes createTask from useTasks to TaskInput", () => {
    render(<HomePage />);
    expect(screen.getByTestId("task-input").dataset.hasCreate).toBe("true");
  });

  it("passes isLoading from useTasks to TaskList", () => {
    mockUseTasks.mockReturnValue({
      tasks: [],
      isLoading: true,
      error: null,
      createTask: vi.fn(),
      toggleTask: vi.fn(),
      deleteTask: vi.fn(),
    });
    render(<HomePage />);
    expect(screen.getByTestId("task-list").dataset.loading).toBe("true");
  });

  it("passes error from useTasks to TaskList", () => {
    mockUseTasks.mockReturnValue({
      tasks: [],
      isLoading: false,
      error: "Something went wrong",
      createTask: vi.fn(),
      toggleTask: vi.fn(),
      deleteTask: vi.fn(),
    });
    render(<HomePage />);
    expect(screen.getByTestId("task-list").dataset.error).toBe(
      "Something went wrong",
    );
  });

  it("passes tasks array from useTasks to TaskList", () => {
    mockUseTasks.mockReturnValue({
      tasks: [
        { id: 1, text: "Task A", completed: false, createdAt: Date.now() },
        { id: 2, text: "Task B", completed: true, createdAt: Date.now() },
      ],
      isLoading: false,
      error: null,
      createTask: vi.fn(),
      toggleTask: vi.fn(),
      deleteTask: vi.fn(),
    });
    render(<HomePage />);
    expect(screen.getByTestId("task-list").dataset.taskCount).toBe("2");
  });

  it("passes toggleTask and deleteTask from useTasks to TaskList", () => {
    render(<HomePage />);
    const list = screen.getByTestId("task-list");
    expect(list.dataset.hasToggle).toBe("true");
    expect(list.dataset.hasDelete).toBe("true");
  });
});
