open Cmdliner

let destroy () = ()
let t = Term.(const destroy $ const ())

let cmd =
  let doc = "" in
  let man =
    [ `S Manpage.s_bugs; `P "Email bug reports to <bugs@example.org>." ]
  in
  let info = Cmd.info "chorus" ~version:"%‌%VERSION%%" ~doc ~man in
  Cmd.v info t
;;
