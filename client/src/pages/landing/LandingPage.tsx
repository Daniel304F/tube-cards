import { Link } from "react-router-dom";
import {
  Play,
  BookOpen,
  FileText,
  Folder,
  Upload,
  MonitorPlay,
  Cpu,
  Terminal,
  Server,
  ArrowRight,
  Zap,
  Shield,
  Wifi,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps): React.JSX.Element {
  return (
    <div className="
      rounded-lg border border-border bg-white
      p-5
      transition-shadow hover:shadow-md
    ">
      <div className="inline-flex items-center justify-center size-10 rounded-lg bg-brand-surface mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-text-base mb-1">{title}</h3>
      <p className="text-sm text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps): React.JSX.Element {
  return (
    <div className="flex gap-4">
      <div className="
        shrink-0 size-8 rounded-full
        bg-brand text-white
        flex items-center justify-center
        text-sm font-bold
      ">
        {number}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-base">{title}</h3>
        <p className="text-sm text-text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }): React.JSX.Element {
  return (
    <pre className="
      rounded-lg bg-text-base text-white
      p-4 overflow-x-auto
      text-xs leading-relaxed
      font-mono
    ">
      <code>{children}</code>
    </pre>
  );
}

export default function LandingPage(): React.JSX.Element {
  return (
    <div className="max-w-4xl mx-auto space-y-16 md:space-y-24 pb-12">
      {/* Hero */}
      <section className="text-center pt-8 md:pt-16">
        <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-brand-surface mb-6">
          <MonitorPlay className="size-10 text-brand" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-text-base mb-4 tracking-tight">
          TubeCards
        </h1>
        <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
          Turn any YouTube video into flashcards and summaries.
          Self-hosted, private, powered by your choice of LLM.
        </p>
        <Link
          to="/process"
          className="
            inline-flex items-center gap-2
            rounded-lg bg-brand
            px-6 py-3
            text-base font-medium text-white
            transition-colors hover:bg-brand-dark
            focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2
          "
        >
          <Play className="size-5" />
          Get Started
          <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold text-text-base text-center mb-8">
          How It Works
        </h2>
        <div className="space-y-6 max-w-lg mx-auto">
          <Step
            number={1}
            title="Paste a YouTube URL"
            description="Enter any YouTube video URL with available captions."
          />
          <Step
            number={2}
            title="AI generates flashcards & summary"
            description="The transcript is sent to your configured LLM (OpenAI, Anthropic, or local Ollama)."
          />
          <Step
            number={3}
            title="Review and organize"
            description="Browse your flashcards, read the summary, organize into folders."
          />
          <Step
            number={4}
            title="Export to Notion or Remnote"
            description="Send your flashcards to your favorite knowledge management tool."
          />
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold text-text-base text-center mb-8">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<BookOpen className="size-5 text-brand" />}
            title="Smart Flashcards"
            description="AI-generated Q&A pairs that test key concepts from the video content."
          />
          <FeatureCard
            icon={<FileText className="size-5 text-brand" />}
            title="Concise Summaries"
            description="Structured summaries that capture the main ideas and takeaways."
          />
          <FeatureCard
            icon={<Folder className="size-5 text-brand" />}
            title="Folders"
            description="Organize your flashcards and summaries into custom folders."
          />
          <FeatureCard
            icon={<Upload className="size-5 text-brand" />}
            title="Export"
            description="One-click export to Notion and Remnote for seamless integration."
          />
          <FeatureCard
            icon={<Zap className="size-5 text-brand" />}
            title="Multiple LLMs"
            description="Use OpenAI, Anthropic, or run completely local with Ollama."
          />
          <FeatureCard
            icon={<Shield className="size-5 text-brand" />}
            title="Self-Hosted"
            description="Your data stays on your machine. No cloud accounts required."
          />
        </div>
      </section>

      {/* Raspberry Pi Installation Guide */}
      <section>
        <div className="rounded-xl border border-border bg-white p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center size-10 rounded-lg bg-brand-surface">
              <Cpu className="size-5 text-brand" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-base">Raspberry Pi Installation</h2>
              <p className="text-sm text-text-muted">Run TubeCards on your own hardware</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Server className="size-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-base">Prerequisites</h3>
              </div>
              <ul className="text-sm text-text-muted space-y-1 ml-6 list-disc">
                <li>Raspberry Pi 4 (4GB+ RAM recommended)</li>
                <li>Raspberry Pi OS (64-bit)</li>
                <li>Docker and Docker Compose installed</li>
                <li>Internet connection for API access</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="size-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-base">1. Clone the repository</h3>
              </div>
              <CodeBlock>{`git clone https://github.com/your-user/tube-cards.git
cd tube-cards`}</CodeBlock>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="size-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-base">2. Configure environment</h3>
              </div>
              <CodeBlock>{`cp api/.env.example api/.env
nano api/.env  # Add your API keys`}</CodeBlock>
              <p className="text-xs text-text-muted mt-2">
                Set your LLM provider API key. For local models, install Ollama and set
                <code className="px-1 py-0.5 bg-brand-surface rounded text-text-base text-xs mx-1">LLM_PROVIDER=ollama</code>.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="size-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-base">3. Start with Docker Compose</h3>
              </div>
              <CodeBlock>{`docker compose up -d`}</CodeBlock>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="size-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-base">4. Access the app</h3>
              </div>
              <p className="text-sm text-text-muted">
                Open your browser and navigate to{" "}
                <code className="px-1.5 py-0.5 bg-brand-surface rounded text-text-base text-xs">
                  http://raspberrypi.local:5173
                </code>{" "}
                or use your Pi's IP address.
              </p>
            </div>

            <div className="rounded-lg bg-brand-surface p-4">
              <p className="text-sm text-text-base">
                <strong>Tip:</strong> For local-only LLM usage, install Ollama on the Pi with{" "}
                <code className="px-1 py-0.5 bg-white rounded text-xs">curl -fsSL https://ollama.ai/install.sh | sh</code>{" "}
                and pull a model like{" "}
                <code className="px-1 py-0.5 bg-white rounded text-xs">ollama pull llama3.2</code>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
