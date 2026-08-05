"use client";

import { useCallback, useEffect, useState } from "react";
import { portalApi, clearPortalToken } from "@/lib/portal/client";
import { PatientProfile } from "@/types/database";

interface MeResponse {
  profile: PatientProfile;
}

export function usePortalSession() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await portalApi<MeResponse>("/api/portal/me");
      setProfile(data.profile);
    } catch (error) {
      setProfile(null);
      clearPortalToken();
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return { profile, loading, refresh };
}
