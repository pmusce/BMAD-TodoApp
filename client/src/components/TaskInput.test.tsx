import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { TaskInput } from "./TaskInput";

describe("TaskInput", () => {
  const mockCreateTask = vi.fn<(text: string) => Promise<void>>();

  beforeEach(() => {
    mockCreateTask.mockClear();
    mockCreateTask.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders input and submit button", () => {
    render(<TaskInput createTask={mockCreateTask} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("calls createTask with trimmed text on button click and clears input", async () => {
    render(<TaskInput createTask={mockCreateTask} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "  Buy milk  ");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(mockCreateTask).toHaveBeenCalledWith("Buy milk");
    expect(input).toHaveValue("");
  });

  it("calls createTask with trimmed text on Enter keypress", async () => {
    render(<TaskInput createTask={mockCreateTask} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "Walk the dog");
    await userEvent.keyboard("{Enter}");
    expect(mockCreateTask).toHaveBeenCalledWith("Walk the dog");
    expect(input).toHaveValue("");
  });

  it("does not call createTask when input is empty", async () => {
    render(<TaskInput createTask={mockCreateTask} />);
    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it("does not call createTask when input is whitespace only", async () => {
    render(<TaskInput createTask={mockCreateTask} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "   ");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it("input is cleared after successful submit", async () => {
    render(<TaskInput createTask={mockCreateTask} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "New task");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(input).toHaveValue("");
  });

  it("returns focus to input after create", async () => {
    render(<TaskInput createTask={mockCreateTask} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "New task");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });
});
