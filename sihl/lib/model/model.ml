module Ptime = struct
  include Ptime

  let to_yojson ptime = Yojson.Safe.from_string (Ptime.to_rfc3339 ptime)

  let of_yojson json =
    try
      match Ptime.of_rfc3339 @@ Yojson.Safe.to_string json with
      | Ok (ptime, _, _) -> Ok ptime
      | Error _ -> Error "Invalid ptime provided"
    with
    | _ -> Error "Could not parse ptime"
  ;;
end

type database =
  | Postgresql
  | Mariadb
  | Sqlite

let list_of_model = Obj.magic

module type MODEL = sig end

type 'a t = { model : unit }
type field = Int
type schema = field list

let int ~primary_key:_ = Obj.magic
let primary_key = Obj.magic
let enum _ _ = Obj.magic
let field = Obj.magic
let email = Obj.magic
let string ~max_length:_ _ = Obj.magic
let timestamp ~default:_ ~update:_ _ = Obj.magic

let create
    ~to_yojson:_
    ~of_yojson:_
    (name : string)
    (fields : string list)
    (schema : schema)
  =
  name |> ignore;
  fields |> ignore;
  schema |> ignore;
  ()
;;

type timestamp_default =
  | Fn of (unit -> Ptime.t)
  | Now
