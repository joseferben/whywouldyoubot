open Sihl.Config

module type S = sig
  include module type of Production
end

let config = ref (module Local : S)

let () =
  match env_bool "DEBUG", env_bool "TEST" with
  | true, false -> config := (module Local)
  | _, true -> config := (module Test)
  | _ -> config := (module Production)
;;
