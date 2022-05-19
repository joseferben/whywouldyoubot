module Config = (val !Settings.config : Settings.S)

let routes =
  [ Dream.get "/" Handlers.home
  ; Dream.scope
      "/game"
      [ Sihl.Web.is_authenticated ]
      [ Dream.get "/" Handlers.game ]
  ]
  @ Sihl_auth.handlers "/users"
;;

let run () =
  Sihl.run (module Config)
  @@ Dream.serve ~interface:"0.0.0.0"
  @@ Config.middlewares
  @@ Dream.router routes
;;
