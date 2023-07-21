import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
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
  const revalidator = useRevalidator();

  useEffect(() => {
    const timer = setInterval(() => {
      revalidator.revalidate();
    }, 1000);
    return () => clearInterval(timer);
  }, [revalidator]);

  return (
    <div className="mx-2 pt-2">
      <Link className="btn-sm btn mb-1" to="/profiler/reset">
        Reset
      </Link>
      <div className="overflow-x-auto">
        <table className="table-zebra table-xs table">
          {/* head */}
          <thead>
            <tr>
              <th>class</th>
              <th>method</th>
              <th>count</th>
              <th>p50 exec time</th>
              <th>p90 exec time</th>
              <th>p95 exec time</th>
              <th>avg exec time</th>
              <th>p50 * count</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={`${stat.className}.${stat.methodName}`}>
                <th>{stat.className}</th>
                <th>{stat.methodName}</th>
                <th>{stat.callCount}</th>
                <th>{Math.round(stat.p50)}</th>
                <th>{Math.round(stat.p90)}</th>
                <th>{Math.round(stat.p95)}</th>
                <th>{Math.round(stat.average)}</th>
                <th>{Math.round(stat.p50Total)}</th>
              </tr>
            ))}
          </tbody>
        </table>
        <small>
          The durations are in microseconds, the table is sorted by p50 exec
          time * count.
        </small>
      </div>
    </div>
  );
}
