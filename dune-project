(lang dune 2.8)

(name sihl)

(generate_opam_files true)

(source
 (github username/reponame))

(authors "Author Name")

(maintainers "Maintainer Name")

(license LICENSE)

(documentation https://url/to/documentation)

(package
 (name sihl)
 (depends
  ocaml
  dune
  dream
  containers
  omigrate
  minicli
  lwt_ppx
  reason
  dune-build-info
  caqti-driver-postgresql))
