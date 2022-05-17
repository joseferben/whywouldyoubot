open Cmdliner

let doc = "Run migrations and manage your database"
let info = Cmd.info "db" ~version:"%%VERSION%%" ~doc
let t : unit Cmd.t = Cmd.group info []
