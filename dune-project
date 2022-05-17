(lang dune 2.8)

(name app)

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
  lwt_ppx
  reason
  caqti-driver-postgresql))

(package
 (name app)
 (synopsis "A short synopsis")
 (description "A longer description")
 (depends
  ocaml
  dune
  tyxml
  tyxml-jsx
  sihl)
 (tags
  (topics "to describe" your project)))
