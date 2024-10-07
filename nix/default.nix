{
  stdenv,
  lib,
  bun,
  makeBinaryWrapper,
  vite,
}:
let
  src = ../.;

  packageJSON = lib.importJSON "${src}/package.json";
  pname = packageJSON.name;
  version = packageJSON.version;

  nodeModules = stdenv.mkDerivation {
    pname = "${pname}_node_modules";
    inherit src version;
    nativeBuildInputs = [ bun ];
    dontConfigure = true;
    dontFixup = true;
    buildPhase = ''
      runHook preBuild

      export HOME=$TMPDIR
      bun install --no-progress --frozen-lockfile

      runHook postBuild
    '';
    installPhase = ''
      runHook preInstall

      mkdir -p $out/node_modules
      cp -R ./node_modules/* $out

      runHook postInstall
    '';
    outputHash = "sha256-QmQ+g59PC7yMR6aQkWW4ajih6Uv6yV1Px3Fp2uyQOus=";
    outputHashAlgo = "sha256";
    outputHashMode = "recursive";
  };
in

stdenv.mkDerivation {
  inherit pname version src;

  nativeBuildInputs = [
    makeBinaryWrapper
    bun
    vite
  ];

  dontConfigure = true;

  buildPhase = ''
    runHook preBuild

    export HOME=$TMPDIR

    ln -s ${nodeModules} ./node_modules

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin

    cp -R ./* $out

    makeBinaryWrapper ${bun}/bin/bun $out/bin/${pname} \
        --prefix PATH : ${lib.makeBinPath [ vite ]} \
        --add-flags "run --prefer-offline --no-install --cwd $out dev"

    runHook postInstall
  '';
}
