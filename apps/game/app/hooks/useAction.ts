import { useState } from "react";

type UseActionReturn<I, O> = {
  submitting: boolean;
  error: string | null;
  value: I | undefined;
  set: (value: I) => void;
  submit: (value?: I) => Promise<O | string | void>;
};

export function useAction<I, O = void>(
  handler: (data: I) => Promise<O | string | void>
): UseActionReturn<I, O> {
  const [value, set] = useState<I>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function hookHandler(provided?: I) {
    setSubmitting(true);
    const resp = await handler((provided || value) as I);
    setSubmitting(false);
    if (typeof resp === "string") {
      setError(resp);
      return resp;
    } else {
      set(undefined);
      setError(null);
      return resp;
    }
  }

  return {
    submit: hookHandler,
    error: error,
    submitting: submitting,
    value,
    set,
  };
}
