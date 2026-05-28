import { MissionLayout } from "../../components/dashboard/MissionLayout";
import { getMaptilerApiKey } from "../../lib/mapRuntimeConfig";

export const dynamic = "force-dynamic";

export default function MissionPage(): JSX.Element {
  return <MissionLayout maptilerApiKey={getMaptilerApiKey()} />;
}
