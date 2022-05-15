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
 (name app)
 (synopsis "A short synopsis")
 (description "A longer description")
 (depends
  ocaml
  dune
  dream
  tyxml
  tyxml-jsx
  containers
  lwt_ppx
  reason
  caqti-driver-postgresql)
 (tags
  (topics "to describe" your project)))
