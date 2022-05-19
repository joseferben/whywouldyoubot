open Sihl.Config

let database_url = "postgresql://admin:password@127.0.0.1:5432/dev"
let debug = env_bool "DEBUG"
let test = env_bool "TEST"

let middlewares handler =
  Dream.logger
  @@ Dream.sql_pool database_url
  @@ Dream.cookie_sessions
  @@ handler
;;
