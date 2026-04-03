import { useState, useEffect } from "react";
import { Loader2, Save, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useConfig } from "../../hooks/useConfig";
import type { ConfigUpdateData } from "../../api/config";

interface FieldConfig {
  key: keyof ConfigUpdateData;
  label: string;
  placeholder: string;
  sensitive: boolean;
}

interface SectionConfig {
  title: string;
  description: string;
  fields: FieldConfig[];
}

const SECTIONS: SectionConfig[] = [
  {
    title: "YouTube",
    description: "API key for fetching video metadata.",
    fields: [
      {
        key: "youtube_api_key",
        label: "YouTube API Key",
        placeholder: "AIza...",
        sensitive: true,
      },
    ],
  },
  {
    title: "LLM Provider",
    description: "Configure the AI model used for generating flashcards and summaries.",
    fields: [
      {
        key: "llm_provider",
        label: "Provider",
        placeholder: "openai, anthropic, or ollama",
        sensitive: false,
      },
      {
        key: "llm_model",
        label: "Model",
        placeholder: "gpt-4o-mini",
        sensitive: false,
      },
      {
        key: "llm_api_key",
        label: "API Key",
        placeholder: "sk-...",
        sensitive: true,
      },
      {
        key: "ollama_base_url",
        label: "Ollama Base URL",
        placeholder: "http://localhost:11434",
        sensitive: false,
      },
    ],
  },
  {
    title: "Notion",
    description: "API key for exporting flashcards and summaries to Notion.",
    fields: [
      {
        key: "notion_api_key",
        label: "Notion API Key",
        placeholder: "ntn_...",
        sensitive: true,
      },
    ],
  },
  {
    title: "Remnote",
    description: "API key for exporting flashcards and summaries to Remnote.",
    fields: [
      {
        key: "remnote_api_key",
        label: "Remnote API Key",
        placeholder: "rem_...",
        sensitive: true,
      },
    ],
  },
];

function ConfigSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card p-6 animate-pulse"
        >
          <div className="h-5 w-32 rounded bg-border dark:bg-dark-surface mb-2" />
          <div className="h-4 w-64 rounded bg-border dark:bg-dark-surface mb-4" />
          <div className="h-10 w-full rounded bg-border dark:bg-dark-surface" />
        </div>
      ))}
    </div>
  );
}

interface SecretInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id: string;
}

function SecretInput({ value, onChange, placeholder, id }: SecretInputProps): React.JSX.Element {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const isMasked = value.startsWith("••••");

  function handleFocus(): void {
    if (isMasked) {
      onChange("");
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="
          w-full rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card
          px-3 py-2 pr-10
          text-sm text-text-base dark:text-dark-text
          placeholder:text-text-muted dark:placeholder:text-dark-muted
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand
        "
      />
      <button
        type="button"
        onClick={() => setIsVisible((prev) => !prev)}
        className="
          absolute right-2 top-1/2 -translate-y-1/2
          p-1 text-text-muted dark:text-dark-muted
          hover:text-text-base dark:hover:text-dark-text
          transition-colors
        "
        aria-label={isVisible ? "Hide value" : "Show value"}
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export default function ConfigPage(): React.JSX.Element {
  const { config, isLoading, isSaving, error, saveSuccess, save } = useConfig();
  const [formData, setFormData] = useState<ConfigUpdateData>({});
  const [dirty, setDirty] = useState<boolean>(false);

  useEffect(() => {
    if (config) {
      setFormData({ ...config });
      setDirty(false);
    }
  }, [config]);

  function handleChange(key: keyof ConfigUpdateData, value: string): void {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    await save(formData);
    setDirty(false);
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">Configuration</h1>
        <ConfigSkeleton />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">Configuration</h1>
        <div className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">Configuration</h1>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {SECTIONS.map((section) => (
          <fieldset
            key={section.title}
            className="rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card p-6"
          >
            <legend className="text-base font-semibold text-text-base dark:text-dark-text px-1">
              {section.title}
            </legend>
            <p className="text-sm text-text-muted dark:text-dark-muted mb-4">{section.description}</p>

            <div className="space-y-4">
              {section.fields.map((field) => {
                const value = (formData[field.key] as string | undefined) ?? "";
                return (
                  <div key={field.key}>
                    <label
                      htmlFor={field.key}
                      className="block text-sm font-medium text-text-base dark:text-dark-text mb-1"
                    >
                      {field.label}
                    </label>
                    {field.sensitive ? (
                      <SecretInput
                        id={field.key}
                        value={value}
                        onChange={(v) => handleChange(field.key, v)}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <input
                        id={field.key}
                        type="text"
                        value={value}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="
                          w-full rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card
                          px-3 py-2
                          text-sm text-text-base dark:text-dark-text
                          placeholder:text-text-muted dark:placeholder:text-dark-muted
                          transition-colors
                          focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand
                        "
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="size-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {saveSuccess && !dirty && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-4 text-sm text-green-700 dark:text-green-400">
            <CheckCircle className="size-5 shrink-0" />
            <p>Configuration saved successfully.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || !dirty}
          className="
            inline-flex items-center gap-2
            rounded-lg bg-brand px-4 py-2.5
            text-sm font-medium text-white
            transition-colors
            hover:bg-brand-dark
            focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-dark-bg
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isSaving ? "Saving…" : "Save Configuration"}
        </button>
      </form>
    </div>
  );
}
