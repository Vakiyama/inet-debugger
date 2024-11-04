{
  stdenv,
  lib,
  makeBinaryWrapper,
  writeScriptBin,
  bun,
  nodeModules,
}:
let
  src = ../.;

  packageJSON = lib.importJSON "${src}/package.json";
  pname = packageJSON.name;
  version = packageJSON.version;

  server = writeScriptBin "server" (
    builtins.replaceStrings [ "@bun@" ] [ "${bun}" ] (builtins.readFile ./bun_serve.js)
  );
in
stdenv.mkDerivation {
  inherit pname version src;

  buildInputs = [
    nodeModules
  ];

  nativeBuildInputs = [
    makeBinaryWrapper
    bun
  ];

  configurePhase = ''
    runHook preConfigure

    mkdir -p .bin

    for bin in ${nodeModules}/bin/*; do
      name=$(basename "$bin")
      target=$(readlink "$bin")
      module_name=''${target#../}
      module_path="${nodeModules}/lib/node_modules/$module_name"

      makeWrapper ${bun}/bin/bun .bin/$name \
        --add-flags "$module_path" \
        --set NODE_PATH "${nodeModules}/lib/node_modules"
    done

    export PATH="$PWD/.bin:$PATH"
    ln -sf ${nodeModules}/lib/node_modules ./node_modules

    runHook postConfigure
  '';

  buildPhase = ''
    runHook preBuild

    ${bun}/bin/bun run --prefer-offline --no-install build

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/static
    mv ./dist/* $out/static

    mkdir -p $out/bin
    makeWrapper ${server}/bin/server $out/bin/${pname} \
      --chdir $out

    runHook postInstall
  '';
}
