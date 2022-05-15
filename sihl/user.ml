type t = Types.user

let migrations =
  Migration.
    [ ( (fun migration ->
          migration
          |> (table "users"
             |> increments "id"
             |> string ~nullable:false "short_name"
             |> string ~nullable:false "full_name"
             |> string ~unique:true "email"
             |> raw_column "foo VARCHAR(255)"
             |> integer "role"
             |> timestamps ()
             |> table_create)
          |> (table "customers"
             |> increments "id"
             |> fk ~on_delete:Cascade ~references:"users.id" "user_id"
             |> table_alter)
          |> table_drop "users"
          |> raw "SELECT * FROM ..."
          |> run (fun () -> Lwt.return ()))
      , fun migration -> migration )
    ]
;;

module Handler = struct
  let login = Handler.template "templates/login.html"
  let signup = Handler.template "templates/signup.html"
  let logout = Handler.template "templates/logout.html"
  let profile = Handler.template "templates/profile.html"
end

let routes =
  [ Dream.get "login/" Handler.login
  ; Dream.get "signup/" Handler.signup
  ; Dream.get "logout/" Handler.logout
  ; Dream.get "profile/:pk/" Handler.profile
  ]
;;

let authentication_required = Obj.magic
let configure _ = ()
