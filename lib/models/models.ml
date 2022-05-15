module Order = struct
  type t = unit

  let t : t Sihl.Model.t = Obj.magic ()
  let model : t Sihl.Model.t = Obj.magic ()
end

module Customer = struct
  type t = unit

  let t : t Sihl.Model.t = Obj.magic ()
  let model : t Sihl.Model.t = Obj.magic ()
end
