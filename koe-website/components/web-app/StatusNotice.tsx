import { AlertTriangle } from "lucide-react";

type StatusNoticeProps = {
  busyLabel: string;
  status: string;
  isSupported: boolean;
};

export function StatusNotice({ busyLabel, status, isSupported }: StatusNoticeProps) {
  return (
    <div className="panel-brutal-amber p-4 md:p-5 flex items-start gap-3 normal-case">
      <AlertTriangle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
      <p className="text-sm text-muted leading-relaxed">
        {busyLabel || status}{" "}
        {!isSupported
          ? "Browser recording is unavailable in this environment."
          : "Audio is processed for the request; signed-in transcript text is stored with your account for history and future sync."}
      </p>
    </div>
  );
}
