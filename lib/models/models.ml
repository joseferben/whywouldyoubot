module Order = struct
  type t = unit

  let t = Obj.magic ()
  let model = Obj.magic ()
end

module Customer = struct
  type t = unit

  let t = Obj.magic ()
  let model = Obj.magic ()
end
