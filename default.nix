with import <nixpkgs> {};
let
  unstable = import
    (builtins.fetchTarball https://github.com/nixos/nixpkgs/archive/master.tar.gz)
    {};
in

mkShell {
  buildInputs = with xorg; [
    unstable.cypress
  ];
  shellHook = with pkgs; ''
    export CYPRESS_INSTALL_BINARY=0
    export CYPRESS_RUN_BINARY="${unstable.cypress}/bin/Cypress"
    export PRISMA_MIGRATION_ENGINE_BINARY="${prisma-engines}/bin/migration-engine"
    export PRISMA_QUERY_ENGINE_BINARY="${prisma-engines}/bin/query-engine"
    export PRISMA_QUERY_ENGINE_LIBRARY="${prisma-engines}/lib/libquery_engine.node"
    export PRISMA_INTROSPECTION_ENGINE_BINARY="${prisma-engines}/bin/introspection-engine"
    export PRISMA_FMT_BINARY="${prisma-engines}/bin/prisma-fmt"
'';
}
