type t = Types.user

let postgresql_migrations_up =
  [ {sql|CREATE TABLE IF NOT EXISTS user_users (
  id          SERIAL UNIQUE,
  email       VARCHAR(255) NOT NULL,
  short_name  VARCHAR(255) NOT NULL,
  long_name   VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)|sql}
  ; {sql|CREATE TRIGGER OR REPLACE update_users_updated_at
BEFORE UPDATE ON customer
FOR EACH ROW EXECUTE PROCEDURE
update_updated_at_column()|sql}
  ]
;;

let postgresql_migrations_down =
  [ "DROP TABLE IF EXISTS user_users"
  ; "DROP TRIGGER IF EXISTS update_users_updated_at"
  ]
;;

let mariadb_migrations_up =
  [ {sql|CREATE TABLE IF NOT EXISTS user_users (
  id          BIGINT UNSIGNED NOT NULL AUTOINCREMENT,
  email       VARCHAR(255) NOT NULL,
  short_name  VARCHAR(255) NOT NULL,
  long_name   VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)|sql}
  ]
;;

let mariadb_migrations_down = [ "DROP TABLE IF EXISTS user_users;" ]

let migrations = function
  | Model.Postgresql -> postgresql_migrations_up, postgresql_migrations_down
  | Model.Mariadb -> mariadb_migrations_up, mariadb_migrations_down
  | Model.Sqlite -> failwith "sqlite is not supported yet"
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
