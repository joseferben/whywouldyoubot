open Cmdliner

let revolt () = print_endline "Revolt!"
let revolt_t = Term.(const revolt $ const ())
let revolt_cmd = Cmd.v (Cmd.info "revolt") revolt_t

let chorus count msg =
  for _ = 1 to count do
    print_endline msg
  done
;;

let count =
  let doc = "Repeat the message $(docv) times." in
  Arg.(value & opt int 10 & info [ "c"; "count" ] ~docv:"COUNT" ~doc)
;;

let msg =
  let env =
    let doc = "Overrides the default message to print." in
    Cmd.Env.info "CHORUS_MSG" ~doc
  in
  let doc = "The message to print." in
  Arg.(value & pos 0 string "Revolt!" & info [] ~env ~docv:"MSG" ~doc)
;;

let chorus_t = Term.(const chorus $ count $ msg)

let chorus_cmd =
  let doc = "print a customizable message repeatedly" in
  let man =
    [ `S Manpage.s_bugs; `P "Email bug reports to <bugs@example.org>." ]
  in
  let info = Cmd.info "chorus" ~version:"%‌%VERSION%%" ~doc ~man in
  Cmd.v info chorus_t
;;

let doc = "A web framework"
let cmds = [ revolt_cmd; chorus_cmd ]

(* TODO exits, man, sdocs, and envs *)

let info = Cmd.info "sihl" ~version:"%%VERSION%%" ~doc

let () =
  Printexc.record_backtrace true;
  let main = Cmd.group info !Sihl.Command.registry in
  Stdlib.exit @@ Cmd.eval main
;;
