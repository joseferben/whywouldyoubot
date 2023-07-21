import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { config } from "~/config";
import { container } from "~/container.server";
import { Profiler } from "~/engine/Profiler";

export const loader = async ({ request }: LoaderArgs) => {
  const player = await container.authService.ensurePlayer(request);
  if (player.username !== config.adminUsername) redirect("/");
  container.onlineService.ensureOnline(player);
  const stats = Profiler.getStats();
  return json({
    stats,
  });
};

export default function ProfilerStats() {
  const { stats } = useLoaderData<typeof loader>();
  return (
    <div className="overflow-x-auto">
      <table className="table">
        {/* head */}
        <thead>
          <tr>
            <th>class</th>
            <th>method</th>
            <th>count</th>
            <th>p50 exec time</th>
            <th>p50 exec time * count</th>
            <th>p90 exec time</th>
            <th>p95 exec time</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr key={`${stat.className}.${stat.methodName}`}>
              <th>{stat.className}</th>
              <th>{stat.methodName}</th>
              <th>{stat.callCount}</th>
              <th>{stat.p50}</th>
              <th>{stat.p50Total}</th>
              <th>{stat.p90}</th>
              <th>{stat.p95}</th>
            </tr>
          ))}
        </tbody>
      </table>
      <small className="ml-2">
        The durations are in ms, the table is sorted by p50 exec time * count.
      </small>
    </div>
  );
}
