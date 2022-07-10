import { Form } from "@remix-run/react";

export default function Settings() {
  return (
    <div style={{ minHeight: "60%" }} className="flex flex-col">
      <Form action="/logout" method="post">
        <button type="submit" className="ml-1 btn btn-error btn-xs">
          Logout
        </button>
      </Form>
    </div>
  );
}
