open Cmdliner

let registry : unit Cmd.t list ref = ref [ Cmd_db.t ]
let register (cmd : unit Cmd.t) = registry := List.cons cmd !registry
