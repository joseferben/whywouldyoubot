module type S = sig
  include module type of Production
end

let config = ref (module Local : S)

let () =
  match Sihl.Env.bool "DEBUG", Sihl.Env.bool "TEST" with
  | true, false -> config := (module Local)
  | _, true -> config := (module Test)
  | _ -> config := (module Production)
;;
