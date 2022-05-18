module Config = (val !Settings.config : Settings.S)

let routes =
  [ Dream.get "/" Handlers.home
  ; Dream.scope
      "/orders"
      [ Sihl.User.is_authenticated ]
      [ Sihl.User.is_staff @@ Dream.get "/" Handlers.order_list
      ; Sihl.Model.single_object ~pk:"id"
        @@ Sihl.User.passes_test Customer.owns_order
        @@ Dream.get "/:id" Handlers.order_detail
      ; Sihl.Model.single_object ~pk:"id"
        @@ Sihl.User.passes_test Customer.owns_order
        @@ Dream.delete "/:id" Handlers.order_delete
      ; Dream.scope "/create" Handlers.order_create
      ]
  ; Dream.scope
      "/customers"
      [ Sihl.User.is_authenticated; Sihl.User.is_superuser ]
      [ Dream.get "/" Handlers.customer_list ]
  ]
;;

let run () =
  Sihl.run (module Config)
  @@ Dream.serve ~interface:"0.0.0.0"
  @@ Config.middlewares
  @@ Dream.router routes
;;
