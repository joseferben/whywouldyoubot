let database_url = "postgresql://admin:password@127.0.0.1:5432/dev"
let debug = Sihl.Env.bool "DEBUG"
let test = Sihl.Env.bool "TEST"

let middlewares handler =
  Dream.logger
  @@ Dream.sql_pool database_url
  @@ Dream.cookie_sessions
  @@ handler
;;
