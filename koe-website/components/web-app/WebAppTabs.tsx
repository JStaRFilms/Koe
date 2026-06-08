import { History, Mic, Upload, UserRound } from "lucide-react";
import { WebAppTab } from "./types";

type WebAppTabsProps = {
  activeTab: WebAppTab;
  onTabChange: (tab: WebAppTab) => void;
};

const tabs = [
  { id: "record", label: "Record", icon: Mic },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "account", label: "Account", icon: UserRound },
  { id: "history", label: "History", icon: History },
] satisfies Array<{ id: WebAppTab; label: string; icon: typeof Mic }>;

export function WebAppTabs({ activeTab, onTabChange }: WebAppTabsProps) {
  return (
    <div className="md:hidden webapp-tabs-shell grid grid-cols-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`webapp-tab ${selected ? "webapp-tab-active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            aria-pressed={selected}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
