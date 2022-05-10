with import <nixpkgs> { };

mkShell {
  buildInputs = [ gmp pkgconfig openssl libev libevdev postgresql sqlite ];
  shellHook = "eval $(opam env)";
}
