{stdenv, fetchurl, autoPatchelfHook, xorg, gtk2, gnome2, nss, alsaLib, udev, unzip}:
stdenv.mkDerivation rec{
  version = "3.1.5";
  name = "cypress-${version}";
  src = fetchurl {
    url = "https://download.cypress.io/desktop/${version}?platform=linux64";
    sha256 = "19ilnb0ww8zvzxv0pq0qsjy6zp789c26rw6559j8q2s3f59jqv05";
  };

  # don't remove runtime deps
  dontPatchELF = true;

  nativeBuildInputs = [ autoPatchelfHook ];

  buildInputs = with xorg; [
    libXScrnSaver libXdamage libXtst
  ] ++ [
    nss gtk2 alsaLib gnome2.GConf unzip
  ];

  runtimeDependencies = [ udev.lib ];

  unpackCmd = ''
    unzip $curSrc
  '';

  installPhase = ''
    ls -la
    mkdir -p $out/bin $out/opt/cypress
    cp -r * $out/opt/cypress
    ln -s $out/opt/cypress/Cypress $out/bin/Cypress
  '';

  meta = with stdenv.lib; {
    description = "Fast, easy and reliable testing for anything that runs in a browser.";
    homepage = https://www.cypress.io;
    license = licenses.mit;
    platforms = ["x86_64-linux"];
  };
}
