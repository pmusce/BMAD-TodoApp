import { useRef, useState } from "react";

export interface TaskInputProps {
  createTask: (text: string) => Promise<void>;
}

export function TaskInput({ createTask }: TaskInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;

    setValue("");
    await createTask(trimmed);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.isComposing) {
      void handleSubmit();
    }
  }

  return (
    <div>
      <label htmlFor="task-input">New task</label>
      <input
        id="task-input"
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?"
        aria-label="New task"
      />
      <button
        type="button"
        onClick={() => void handleSubmit()}
        aria-label="Add task"
      >
        Add
      </button>
    </div>
  );
}
