"use client";

import { useState } from "react";
import Header from "./Header";
import MediaBrowser from "../panels/MediaBrowser";
import PreviewPanel from "../preview/PreviewPanel";
import TimelineCanvas from "../timeline/TimelineCanvas";
import AgentPanel from "../agent/AgentPanel";
import TextPanel from "../panels/TextPanel";
import FiltersPanel from "../panels/FiltersPanel";
import TransitionsPanel from "../panels/TransitionsPanel";
import ProjectSettingsPanel from "../panels/ProjectSettingsPanel";

type LeftTab = "media" | "text" | "filters" | "transitions" | "settings";

export default function EditorLayout() {
  const [projectName] = useState("Untitled Project");
  const [leftTab, setLeftTab] = useState<LeftTab>("media");

  const renderLeftPanel = () => {
    switch (leftTab) {
      case "media":
        return <MediaBrowser />;
      case "text":
        return <TextPanel />;
      case "filters":
        return <FiltersPanel />;
      case "transitions":
        return <TransitionsPanel />;
      case "settings":
        return <ProjectSettingsPanel />;
      default:
        return <MediaBrowser />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-dark-900">
      <Header projectName={projectName} />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel with Tabs */}
        <aside className="w-72 border-r border-dark-700 bg-dark-800 flex flex-col">
          {/* Tab Bar */}
          <div className="flex border-b border-dark-700">
            <TabButton
              active={leftTab === "media"}
              onClick={() => setLeftTab("media")}
              title="Media"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              }
            />
            <TabButton
              active={leftTab === "text"}
              onClick={() => setLeftTab("text")}
              title="Text"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              }
            />
            <TabButton
              active={leftTab === "filters"}
              onClick={() => setLeftTab("filters")}
              title="Filters"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              }
            />
            <TabButton
              active={leftTab === "transitions"}
              onClick={() => setLeftTab("transitions")}
              title="Trans"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              }
            />
            <TabButton
              active={leftTab === "settings"}
              onClick={() => setLeftTab("settings")}
              title="Settings"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
            />
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">{renderLeftPanel()}</div>
        </aside>

        {/* Center Section */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Preview Area */}
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
              <PreviewPanel />
            </div>

            {/* Right Panel - Agent */}
            <aside className="w-80 border-l border-dark-700 bg-dark-800 flex flex-col">
              <AgentPanel />
            </aside>
          </div>

          {/* Timeline */}
          <div className="h-52 border-t border-dark-700 bg-dark-800">
            <TimelineCanvas />
          </div>
        </section>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  title,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors ${
        active
          ? "bg-dark-700 text-white"
          : "text-dark-400 hover:text-white hover:bg-dark-750"
      }`}
      title={title}
    >
      {icon}
      <span className="text-[10px]">{title}</span>
    </button>
  );
}
