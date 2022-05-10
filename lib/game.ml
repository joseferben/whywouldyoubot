module Sihl = struct
  let view_template _ = Obj.magic ()

  module User = struct
    module View = struct
      let login = view_template "templates/login.html"
      let signup = view_template "templates/signup.html"
      let logout = view_template "templates/logout.html"
      let profile = view_template "templates/profile.html"
    end

    let routes =
      [ Dream.get "login/" View.login
      ; Dream.get "signup/" View.signup
      ; Dream.get "logout/" View.logout
      ; Dream.get "profile/" View.profile
      ]
    ;;

    let middleware_authenticated = Obj.magic
  end
end

module View = struct
  let home = Sihl.view_template "templates/home.html"
end

let game_routes = []

let routes =
  [ Dream.get "" View.home
  ; Dream.scope "users/" [] Sihl.User.routes
  ; Dream.scope "game/" [ Sihl.User.middleware_authenticated ] game_routes
  ]
;;

let run () =
  Dream.run ~interface:"0.0.0.0"
  @@ Dream.logger
  @@ Dream.sql_pool "postgresql://admin:password@127.0.0.1:5432/dev"
  @@ Dream.cookie_sessions
  @@ Dream.router routes
;;
