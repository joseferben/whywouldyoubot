import { configServer } from "~/configServer";
import { initOnce } from "~/utils";

const methodExecutionTimes: Record<string, number[]> = initOnce(
  "profiler.executionTimes",
  () => ({})
)[0];
const methodCallCounts: Record<string, number> = initOnce(
  "profiler.methodCallCounts",
  () => ({})
)[0];
const methodExecutionSums: Record<string, number> = initOnce(
  "profiler.methodExecutionSums",
  () => ({})
)[0];

export type Stats = {
  className: string;
  methodName: string;
  callCount: number;
  p50: number;
  p50Total: number;
  p90: number;
  p95: number;
  average: number;
};

export abstract class Profiler {
  constructor() {
    for (const propertyName of Object.getOwnPropertyNames(
      Object.getPrototypeOf(this)
    )) {
      if (!configServer.serviceProfiling) return;
      if (propertyName !== "constructor") {
        const originalMethod = (this as any)[propertyName];
        if (typeof originalMethod === "function") {
          (this as any)[propertyName] = (...args: any[]) => {
            const className = this.constructor.name;
            const fullMethodName = `${className}.${propertyName}`;

            const start = process.hrtime.bigint();
            const result = originalMethod.apply(this, args);
            const end = process.hrtime.bigint();

            const executionTime = Number(end - start) / 1000000;

            methodExecutionSums[fullMethodName] =
              (methodExecutionSums[fullMethodName] || 0) + executionTime;

            if (!methodExecutionTimes[fullMethodName]) {
              methodExecutionTimes[fullMethodName] = [];
            } else if (
              methodExecutionTimes[fullMethodName].length >=
              configServer.serviceProfilerMaxExecutions
            ) {
              methodExecutionSums[fullMethodName] -=
                methodExecutionTimes[fullMethodName].shift()!;
            }
            methodExecutionTimes[fullMethodName].push(executionTime);

            // Increment the call count
            methodCallCounts[fullMethodName] =
              (methodCallCounts[fullMethodName] || 0) + 1;

            if (result instanceof Promise) {
              return result.then((res) => {
                const endAsync = process.hrtime.bigint();
                const executionTimeAsync = Number(endAsync - start) / 1000000;

                methodExecutionSums[fullMethodName] +=
                  executionTimeAsync - executionTime;

                if (
                  methodExecutionTimes[fullMethodName].length >=
                  configServer.serviceProfilerMaxExecutions
                ) {
                  methodExecutionSums[fullMethodName] -=
                    methodExecutionTimes[fullMethodName].shift()!;
                }
                methodExecutionTimes[fullMethodName].push(executionTimeAsync);

                return res;
              });
            } else {
              return result;
            }
          };
        }
      }
    }
  }

  static getPercentileExecutionTime(
    methodName: string,
    percentile: number
  ): number {
    const executionTimes = methodExecutionTimes[methodName];

    if (!executionTimes) {
      return 0;
    }

    const sortedTimes = executionTimes.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sortedTimes.length) - 1;

    return sortedTimes[index];
  }

  static getAverageExecutionTime(methodName: string): number {
    const sum = methodExecutionSums[methodName] || 0;
    const count = methodCallCounts[methodName] || 0;
    return count > 0 ? sum / count : 0;
  }

  static getStats(): Stats[] {
    const stats: Stats[] = [];
    for (const fullMethodName in methodExecutionTimes) {
      const [className, methodName] = fullMethodName.split(".");

      stats.push({
        className,
        methodName,
        callCount: methodCallCounts[fullMethodName] || 0,
        p50: this.getPercentileExecutionTime(fullMethodName, 50),
        p50Total:
          this.getPercentileExecutionTime(fullMethodName, 50) *
          (methodCallCounts[fullMethodName] || 0),
        p90: this.getPercentileExecutionTime(fullMethodName, 90),
        p95: this.getPercentileExecutionTime(fullMethodName, 95),
        average: this.getAverageExecutionTime(fullMethodName),
      });
    }

    // Sort the stats by the product of call count and 50th percentile, descending
    stats.sort((a, b) => b.p50Total - a.p50Total);

    return stats;
  }

  static resetStats() {
    Object.keys(methodExecutionTimes).forEach((key) => {
      delete methodExecutionTimes[key];
    });
    Object.keys(methodCallCounts).forEach((key) => {
      delete methodCallCounts[key];
    });
    Object.keys(methodExecutionSums).forEach((key) => {
      delete methodExecutionSums[key];
    });
  }
}
