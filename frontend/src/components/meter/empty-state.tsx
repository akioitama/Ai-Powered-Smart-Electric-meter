import Link from "next/link";
import { CircuitBoard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoMeterState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="glass p-12 text-center max-w-2xl mx-auto">
      <div className="mx-auto h-14 w-14 rounded-2xl border border-electric-400/40 bg-electric-400/10 grid place-items-center shadow-glow mb-4">
        <CircuitBoard className="h-6 w-6 text-electric-300" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No meter connected yet</h2>
      <p className="text-ink-muted text-sm max-w-md mx-auto mb-6">
        {isAdmin
          ? "Provision a meter from the admin panel — you'll receive a unique meter UID and access token to flash onto the Raspberry Pi."
          : "Ask your administrator to assign a meter to your account. Once it's online, live readings will appear here in real time."}
      </p>
      {isAdmin && (
        <Button asChild>
          <Link href="/admin/meters">
            <Zap className="h-4 w-4" />
            Provision a meter
          </Link>
        </Button>
      )}
    </div>
  );
}
