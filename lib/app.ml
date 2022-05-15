module Config = (val !Settings.config : Settings.S)

let routes =
  [ Dream.get "/" Handlers.home
  ; Dream.scope "/users" [] Sihl.User.routes
  ; Dream.scope
      "/game"
      [ Sihl.User.authentication_required ]
      [ (*   Dream.get "/" Handlers.order_list *)
        (* ; Dream.get "/:id" Handlers.order_detail *)
        (* ; Dream.get "/create" Handlers.order_create *) ]
  ]
;;

let run () =
  Sihl.User.configure !Settings.config;
  Dream.run ~interface:"0.0.0.0" @@ Config.middlewares @@ Dream.router routes
;;
