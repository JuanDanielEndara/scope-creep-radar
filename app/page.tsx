"use client";

import { useEffect, useState, type ChangeEvent } from "react";

type RiskLevel = "Low" | "Medium" | "High" | "Critical";

type RecommendedAction =
  | "Accept as low-risk"
  | "Clarify before committing"
  | "Estimate separately"
  | "Split into discovery"
  | "Trade off against current sprint scope"
  | "Escalate for prioritization"
  | "Defer";

type AnalysisResult = {
  risk_level: RiskLevel;
  risk_explanation: string;
  hidden_assumptions: string[];
  why_bigger: string;
  clarifying_questions: string[];
  recommended_action: RecommendedAction;
  recommended_action_explanation: string;
  suggested_response: string;
};

type ExampleRequest = {
  requestText: string;
  requestSource: string;
  projectStage: string;
  optionalContext: string;
};

type ProjectContext = {
  id: string;
  name: string;
  context: string;
};

const EXAMPLES: Record<string, ExampleRequest> = {
  "PDF export request": {
    requestText:
      "I was thinking about the dashboard... maybe we could add an export to PDF button for the user activity report? Just a simple icon next to the date picker.",
    requestSource: "Client message",
    projectStage: "Development",
    optionalContext:
      "The team is currently focused on finishing the dashboard MVP this sprint. The original scope includes viewing user activity in the dashboard, but does not mention exports, downloadable reports, or PDF formatting.",
  },
  "Smart table highlight": {
    requestText:
      "Could we make the user activity table easier to scan? Maybe highlight rows where the activity level is unusually high compared to normal behavior, so admins can spot important changes faster. It does not need to be a full alerting system, just something smart in the table.",
    requestSource: "Client message",
    projectStage: "Development",
    optionalContext:
      "The dashboard MVP already includes the user activity table and the activity data is available. However, the current scope does not define thresholds, anomaly logic, user-specific baselines, alerting, or configurable rules. The team still has a few days left in the sprint, but most MVP items are already committed.",
  },
  "Slack integration": {
    requestText:
      "Could we also add a simple Slack integration so admins get notified whenever a high-priority user activity event happens? It should just send a quick message to a channel.",
    requestSource: "Client message",
    projectStage: "Development",
    optionalContext:
      "The current MVP scope only includes the dashboard UI. There is no existing notification system, Slack integration, webhook infrastructure, or event priority definition.",
  },
  "Multi-tenant launch request": {
    requestText:
      "I know we are close to launch, but leadership wants the MVP to support multiple client workspaces before release. Each client should only see their own users, reports, and settings. Ideally this should be included in the launch next week, since we cannot go live without it.",
    requestSource: "Internal stakeholder message",
    projectStage: "QA",
    optionalContext:
      "The current MVP was built for a single workspace and single-client usage. The data model, permissions, reporting views, and QA plan were not designed for multi-tenant usage. Launch is scheduled for next week and the team is currently fixing final QA issues.",
  },
};

const NO_EXAMPLE_SELECTED = "No example selected";

const PROJECT_CONTEXTS_STORAGE_KEY = "scope-creep-radar-project-contexts";

const riskStyles: Record<RiskLevel, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-orange-200 bg-orange-50 text-orange-700",
  Critical: "border-red-200 bg-red-50 text-red-700",
};

function Badge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${riskStyles[level]}`}
    >
      {level}
    </span>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ResultList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No items identified.</p>;
  }

  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function LoadingAnalysis() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Analyzing request…
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Looking for hidden assumptions, scope risk, and next actions.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <div className="mb-3 h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <div className="mb-4 h-4 w-36 animate-pulse rounded bg-slate-200" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <div className="mb-4 h-4 w-44 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [requestText, setRequestText] = useState("");
  const [requestSource, setRequestSource] = useState("Client message");
  const [projectStage, setProjectStage] = useState("Development");
  const [optionalContext, setOptionalContext] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedExample, setSelectedExample] = useState(NO_EXAMPLE_SELECTED);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [toneLoading, setToneLoading] = useState<"softer" | "firmer" | null>(
    null
  );
  const [projectContexts, setProjectContexts] = useState<ProjectContext[]>([]);
  const [selectedProjectContextId, setSelectedProjectContextId] = useState("");
  const [projectContextName, setProjectContextName] = useState("");
  const [contextMessage, setContextMessage] = useState("");
  const [fileMessage, setFileMessage] = useState("");

  useEffect(() => {
    const savedContexts = window.localStorage.getItem(
      PROJECT_CONTEXTS_STORAGE_KEY
    );

    if (!savedContexts) return;

    try {
      const parsedContexts = JSON.parse(savedContexts);

      if (Array.isArray(parsedContexts)) {
        setProjectContexts(parsedContexts);
      }
    } catch {
      window.localStorage.removeItem(PROJECT_CONTEXTS_STORAGE_KEY);
    }
  }, []);

  function persistProjectContexts(contexts: ProjectContext[]) {
    setProjectContexts(contexts);
    window.localStorage.setItem(
      PROJECT_CONTEXTS_STORAGE_KEY,
      JSON.stringify(contexts)
    );
  }

  function loadExample(exampleName: string) {
    setSelectedExample(exampleName);
    setAnalysis(null);
    setErrorMessage("");
    setCopied(false);
    setContextMessage("");
    setFileMessage("");

    if (exampleName === NO_EXAMPLE_SELECTED) {
      setRequestText("");
      setRequestSource("Client message");
      setProjectStage("Development");
      setOptionalContext("");
      setSelectedProjectContextId("");
      setProjectContextName("");
      return;
    }

    const example = EXAMPLES[exampleName];

    if (!example) return;

    setRequestText(example.requestText);
    setRequestSource(example.requestSource);
    setProjectStage(example.projectStage);
    setOptionalContext(example.optionalContext);
    setSelectedProjectContextId("");
    setProjectContextName("");
  }

  function handleSaveProjectContext() {
    setContextMessage("");

    const trimmedName = projectContextName.trim();
    const trimmedContext = optionalContext.trim();

    if (!trimmedName) {
      setContextMessage("Add a name before saving this context.");
      return;
    }

    if (!trimmedContext) {
      setContextMessage("Add project context before saving.");
      return;
    }

    const existingContext = projectContexts.find(
      (context) => context.name.toLowerCase() === trimmedName.toLowerCase()
    );

    let updatedContexts: ProjectContext[];

    if (existingContext) {
      updatedContexts = projectContexts.map((context) =>
        context.id === existingContext.id
          ? {
            ...context,
            name: trimmedName,
            context: trimmedContext,
          }
          : context
      );

      setSelectedProjectContextId(existingContext.id);
      setContextMessage("Context updated.");
    } else {
      const newContext: ProjectContext = {
        id: crypto.randomUUID(),
        name: trimmedName,
        context: trimmedContext,
      };

      updatedContexts = [...projectContexts, newContext];
      setSelectedProjectContextId(newContext.id);
      setContextMessage("Context saved.");
    }

    persistProjectContexts(updatedContexts);

    if (typeof pendo !== "undefined") {
      pendo.track("project_context_saved", {
        is_update: !!existingContext,
        context_name: trimmedName,
        context_text_length: trimmedContext.length,
        total_saved_contexts: updatedContexts.length,
      });
    }
  }

  function handleLoadProjectContext(contextId: string) {
    setSelectedProjectContextId(contextId);
    setContextMessage("");

    if (!contextId) return;

    const selectedContext = projectContexts.find(
      (context) => context.id === contextId
    );

    if (!selectedContext) return;

    setOptionalContext(selectedContext.context);
    setProjectContextName(selectedContext.name);
    setAnalysis(null);
  }

  function handleDeleteProjectContext() {
    setContextMessage("");

    if (!selectedProjectContextId) {
      setContextMessage("Select a saved context to delete.");
      return;
    }

    const updatedContexts = projectContexts.filter(
      (context) => context.id !== selectedProjectContextId
    );

    persistProjectContexts(updatedContexts);

    if (typeof pendo !== "undefined") {
      pendo.track("project_context_deleted", {
        total_saved_contexts_remaining: updatedContexts.length,
      });
    }

    setSelectedProjectContextId("");
    setProjectContextName("");
    setContextMessage("Context deleted.");
  }

  async function handleUploadNotes(event: ChangeEvent<HTMLInputElement>) {
    setFileMessage("");

    const file = event.target.files?.[0];

    if (!file) return;

    const allowedExtensions = [".txt", ".md", ".docx"];
    const fileName = file.name.toLowerCase();
    const isAllowedFile = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!isAllowedFile) {
      setFileMessage("Please upload a .txt, .md, or .docx file.");
      event.target.value = "";
      return;
    }

    const maxFileSizeInBytes = 2 * 1024 * 1024; // 2 MB

    if (file.size > maxFileSizeInBytes) {
      setFileMessage("File is too large. Please upload a file under 2 MB.");
      event.target.value = "";
      return;
    }

    try {
      let fileContent = "";

      if (fileName.endsWith(".docx")) {
        const mammoth = await import("mammoth/mammoth.browser");
        const arrayBuffer = await file.arrayBuffer();

        const result = await mammoth.extractRawText({
          arrayBuffer,
        });

        fileContent = result.value;
      } else {
        fileContent = await file.text();
      }

      if (!fileContent.trim()) {
        setFileMessage("The file appears to be empty.");
        event.target.value = "";
        return;
      }

      setRequestText(fileContent.trim());
      setRequestSource("Transcript");
      setSelectedExample(NO_EXAMPLE_SELECTED);
      setAnalysis(null);
      setErrorMessage("");
      setCopied(false);
      setFileMessage(`Loaded ${file.name}.`);

      if (typeof pendo !== "undefined") {
        pendo.track("notes_file_uploaded", {
          file_type: fileName.substring(fileName.lastIndexOf(".")),
          file_size_bytes: file.size,
          extracted_content_length: fileContent.trim().length,
        });
      }

      event.target.value = "";
    } catch (error) {
      console.error("File upload error:", error);
      setFileMessage("Could not read the file. Please try another file.");
      event.target.value = "";
    }
  }

  async function handleAnalyze() {
    setErrorMessage("");
    setCopied(false);

    if (!requestText.trim()) {
      setErrorMessage("Please paste a request before analyzing.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestText,
          requestSource,
          projectStage,
          optionalContext: projectContextName.trim()
            ? `Project context name: ${projectContextName.trim()}\n\nProject context details:\n${optionalContext}`
            : optionalContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setAnalysis(data);

      if (typeof pendo !== "undefined") {
        pendo.track("scope_analysis_completed", {
          risk_level: data.risk_level,
          recommended_action: data.recommended_action,
          request_source: requestSource,
          project_stage: projectStage,
          has_project_context: optionalContext.trim().length > 0,
          has_saved_context: selectedProjectContextId !== "",
          request_text_length: requestText.length,
          hidden_assumptions_count: data.hidden_assumptions?.length ?? 0,
          clarifying_questions_count: data.clarifying_questions?.length ?? 0,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected error while analyzing request.";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClearAll() {
    setRequestText("");
    setRequestSource("Client message");
    setProjectStage("Development");
    setOptionalContext("");
    setSelectedExample(NO_EXAMPLE_SELECTED);
    setSelectedProjectContextId("");
    setProjectContextName("");
    setAnalysis(null);
    setErrorMessage("");
    setCopied(false);
    setContextMessage("");
    setFileMessage("");
    setToneLoading(null);
  }

  async function handleCopyResponse() {
    if (!analysis?.suggested_response) return;

    await navigator.clipboard.writeText(analysis.suggested_response);
    setCopied(true);

    if (typeof pendo !== "undefined") {
      pendo.track("suggested_response_copied", {
        risk_level: analysis.risk_level,
        recommended_action: analysis.recommended_action,
        response_length: analysis.suggested_response.length,
      });
    }

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  function buildFullReport() {
    if (!analysis) return "";

    const hiddenAssumptions = analysis.hidden_assumptions
      .map((item) => `- ${item}`)
      .join("\n");

    const clarifyingQuestions = analysis.clarifying_questions
      .map((item) => `- ${item}`)
      .join("\n");

    return `# Scope Creep Analysis

Risk level: ${analysis.risk_level}

Risk summary:
${analysis.risk_explanation}

Hidden assumptions:
${hiddenAssumptions}

Why this may be bigger than it sounds:
${analysis.why_bigger}

Clarifying questions:
${clarifyingQuestions}

Recommended next action:
${analysis.recommended_action}

Recommended action explanation:
${analysis.recommended_action_explanation}

Suggested response:
${analysis.suggested_response}`;
  }

  async function handleCopyFullReport() {
    if (!analysis) return;

    const fullReport = buildFullReport();

    try {
      await navigator.clipboard.writeText(fullReport);
      setCopied(true);

      if (typeof pendo !== "undefined") {
        pendo.track("full_report_copied", {
          risk_level: analysis.risk_level,
          recommended_action: analysis.recommended_action,
          report_length: fullReport.length,
          hidden_assumptions_count: analysis.hidden_assumptions.length,
          clarifying_questions_count: analysis.clarifying_questions.length,
        });
      }

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setErrorMessage("Could not copy the full report.");
    }
  }
  async function handleRewriteTone(tone: "softer" | "firmer") {
    if (!analysis?.suggested_response) return;

    setErrorMessage("");
    setCopied(false);
    setToneLoading(tone);

    try {
      const response = await fetch("/api/rewrite-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentResponse: analysis.suggested_response,
          tone,
          riskLevel: analysis.risk_level,
          requestText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setAnalysis({
        ...analysis,
        suggested_response: data.rewrittenResponse,
      });

      if (typeof pendo !== "undefined") {
        pendo.track("response_tone_rewritten", {
          tone,
          risk_level: analysis.risk_level,
          request_text_length: requestText.length,
          original_response_length: analysis.suggested_response.length,
          rewritten_response_length: (data.rewrittenResponse as string).length,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected error while rewriting response.";

      setErrorMessage(message);
    } finally {
      setToneLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">
              Scope Creep Radar
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Review hidden assumptions before you commit.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              Analyze stakeholder requests, identify scope risk, and generate a response
              that protects delivery without sounding defensive.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <section className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Analyze a request
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Paste a client email, Slack message, meeting note, or transcript
                excerpt. Get hidden assumptions, clarifying questions, and a
                response you can send.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Load an example
                </label>
                <select
                  value={selectedExample}
                  onChange={(event) => loadExample(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value={NO_EXAMPLE_SELECTED}>{NO_EXAMPLE_SELECTED}</option>
                  {Object.keys(EXAMPLES).map((exampleName) => (
                    <option key={exampleName} value={exampleName}>
                      {exampleName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Request text
                </label>
                <textarea
                  className="h-52 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  placeholder="Paste a client email, Slack message, meeting note, or transcript excerpt..."
                  value={requestText}
                  onChange={(event) => setRequestText(event.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Request source
                  </label>
                  <select
                    value={requestSource}
                    onChange={(event) => setRequestSource(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  >
                    <option>Client message</option>
                    <option>Internal stakeholder message</option>
                    <option>Meeting note</option>
                    <option>Transcript</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Project stage
                  </label>
                  <select
                    value={projectStage}
                    onChange={(event) => setProjectStage(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  >
                    <option>Discovery</option>
                    <option>Design</option>
                    <option>Development</option>
                    <option>QA</option>
                    <option>Post-launch</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Project context
                    </label>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Save reusable context for clients, projects, or internal teams.
                      Contexts are stored locally in your browser.
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                    Local
                  </span>
                </div>

                <div className="mb-3">
                  <label className="mb-2 block text-xs font-medium text-slate-600">
                    Saved context
                  </label>
                  <select
                    value={selectedProjectContextId}
                    onChange={(event) => handleLoadProjectContext(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">No saved context selected</option>
                    {projectContexts.map((context) => (
                      <option key={context.id} value={context.id}>
                        {context.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="mb-2 block text-xs font-medium text-slate-600">
                    Context name
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    placeholder="e.g. Client A - Dashboard MVP"
                    value={projectContextName}
                    onChange={(event) => setProjectContextName(event.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-600">
                    Optional project context
                  </label>
                  <textarea
                    className="h-32 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Add current sprint goal, deadline, known scope, constraints, team capacity, or client-specific context..."
                    value={optionalContext}
                    onChange={(event) => {
                      setOptionalContext(event.target.value);
                      setContextMessage("");
                    }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSaveProjectContext}
                    className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                  >
                    Save context
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteProjectContext}
                    disabled={!selectedProjectContextId}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Delete
                  </button>
                </div>

                {contextMessage ? (
                  <p className="mt-3 text-xs font-medium text-slate-500">{contextMessage}</p>
                ) : null}
              </div>

              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="cursor-pointer rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-3 text-center text-sm font-medium text-indigo-700 transition hover:bg-indigo-100">
                    Upload notes
                    <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-indigo-500">
                      .txt / .md / .docx
                    </span>
                    <input
                      type="file"
                      accept=".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleUploadNotes}
                    />
                  </label>

                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-400"
                  >
                    Add Google Doc link
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
                      Coming soon
                    </span>
                  </button>
                </div>

                {fileMessage ? (
                  <p className="mt-2 text-xs font-medium text-slate-500">{fileMessage}</p>
                ) : null}
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="flex-1 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isLoading ? "Analyzing..." : "Analyze request"}
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={isLoading}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Clear all
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
                {isLoading ? (
                  <LoadingAnalysis />
                ) : !analysis ? (
                  <section className="flex min-h-[520px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                    <div className="max-w-md">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
                        ◌
                      </div>
                      <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                        Your analysis will appear here
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        Paste a request or load an example, then run the radar to see
                        the scope risk, hidden assumptions, clarifying questions, and a
                        copy-ready response.
                      </p>
                    </div>
                  </section>
                ) : (
                  <>
                    <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                        Quick read
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        This looks like a{" "}
                        <span className="font-semibold text-slate-950">
                          {analysis.risk_level}
                        </span>{" "}
                        scope risk because {analysis.risk_explanation.toLowerCase()}
                      </p>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      <Card title="Scope risk">
                        <div className="mb-3">
                          <Badge level={analysis.risk_level} />
                        </div>
                        <p className="text-sm leading-6 text-slate-700">
                          {analysis.risk_explanation}
                        </p>
                      </Card>

                      <Card title="Recommended next action">
                        <p className="font-semibold text-slate-950">
                          {analysis.recommended_action}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {analysis.recommended_action_explanation}
                        </p>
                      </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <Card title="Hidden assumptions">
                        <ResultList items={analysis.hidden_assumptions} />
                      </Card>

                      <Card title="Clarifying questions">
                        <ResultList items={analysis.clarifying_questions} />
                      </Card>
                    </div>

                    <Card title="Why this may be bigger than it sounds">
                      <p className="text-sm leading-6 text-slate-700">
                        {analysis.why_bigger}
                      </p>
                    </Card>

                    <Card title="Suggested response">
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {analysis.suggested_response}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleCopyResponse}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        >
                          {copied ? "Copied!" : "Copy response"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyFullReport}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          {copied ? "Copied!" : "Copy full report"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRewriteTone("softer")}
                          disabled={!analysis || toneLoading !== null}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          {toneLoading === "softer" ? "Softening..." : "Make softer"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRewriteTone("firmer")}
                          disabled={!analysis || toneLoading !== null}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          {toneLoading === "firmer" ? "Making firmer..." : "Make firmer"}
                        </button>
                      </div>
                    </Card>
                  </>
                )}
          </section>
        </div>
      </div>
    </main>
  );
}
