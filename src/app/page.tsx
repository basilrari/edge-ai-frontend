import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { getMaptilerApiKey } from "../lib/mapRuntimeConfig";

export const dynamic = "force-dynamic";

export default function Page(): JSX.Element {
  return <DashboardLayout maptilerApiKey={getMaptilerApiKey()} />;
}
