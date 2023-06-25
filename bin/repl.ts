import * as repl from "repl";
import { container } from "~/container.server";

const replServer = repl.start({ prompt: "> " });

replServer.context.container = container;
