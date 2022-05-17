type authentiacted_user =
  { id : int
  ; email : string
  ; short_name : string
  ; full_name : string
  }

type user =
  | AnonymousUser
  | AuthenticatedUser of authentiacted_user
