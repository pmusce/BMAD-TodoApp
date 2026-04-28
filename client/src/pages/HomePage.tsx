import { useTasks } from "../hooks/useTasks";
import { TaskInput } from "../components/TaskInput";
import { TaskList } from "../components/TaskList";

export function HomePage() {
  const { tasks, isLoading, error, createTask, toggleTask, deleteTask } =
    useTasks();

  return (
    <main className="home-page">
      <TaskInput createTask={createTask} />
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        error={error}
        toggleTask={toggleTask}
        deleteTask={deleteTask}
      />
    </main>
  );
}
