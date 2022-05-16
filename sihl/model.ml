type database =
  | Postgresql
  | Mariadb
  | Sqlite

let list_of_model = Obj.magic

module type MODEL = sig end

type 'a t = { model : unit }
