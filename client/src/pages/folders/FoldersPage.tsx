import { useState } from "react";
import { Link } from "react-router-dom";
import { Folder, Plus, Trash2, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { useFolders } from "../../hooks/useFolders";

function FoldersSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card p-4 animate-pulse">
          <div className="h-5 w-40 rounded bg-border dark:bg-dark-surface" />
        </div>
      ))}
    </div>
  );
}

export default function FoldersPage(): React.JSX.Element {
  const { folders, isLoading, error, create, remove } = useFolders();
  const [newName, setNewName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setIsCreating(true);
    await create(trimmed);
    setNewName("");
    setIsCreating(false);
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">Folders</h1>
        <FoldersSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">Folders</h1>
        <div className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">Folders</h1>

      {/* Create folder */}
      <form onSubmit={(e) => void handleCreate(e)} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New folder name…"
          className="
            flex-1 rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card
            px-3 py-2 text-sm text-text-base dark:text-dark-text
            placeholder:text-text-muted dark:placeholder:text-dark-muted
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand
          "
        />
        <button
          type="submit"
          disabled={!newName.trim() || isCreating}
          className="
            inline-flex items-center gap-2
            rounded-lg bg-brand px-4 py-2
            text-sm font-medium text-white
            transition-colors hover:bg-brand-dark
            focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-dark-bg
            disabled:opacity-50 disabled:cursor-not-allowed
            min-h-[44px]
          "
        >
          {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Create
        </button>
      </form>

      {/* Folder list */}
      {folders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-text-muted dark:text-dark-muted">
          <Folder className="size-8 opacity-40" />
          <p className="text-sm">No folders yet. Create one above to organize your content.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="
                flex items-center justify-between
                rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card
                transition-shadow hover:shadow-sm
              "
            >
              <Link
                to={`/folders/${folder.id}`}
                className="
                  flex items-center gap-3 flex-1
                  px-4 py-3
                  min-h-[44px]
                  transition-colors hover:bg-brand-surface dark:hover:bg-dark-surface
                  rounded-l-lg
                "
              >
                <Folder className="size-5 text-brand shrink-0" />
                <span className="text-sm font-medium text-text-base dark:text-dark-text truncate">
                  {folder.name}
                </span>
                <ChevronRight className="size-4 text-text-muted dark:text-dark-muted ml-auto shrink-0" />
              </Link>
              <button
                type="button"
                onClick={() => void remove(folder.id)}
                className="
                  p-3 min-w-[44px] min-h-[44px]
                  flex items-center justify-center
                  text-text-muted dark:text-dark-muted hover:text-red-500
                  transition-colors
                "
                aria-label={`Delete folder ${folder.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
