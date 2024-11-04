{
  description = "Next.js Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };

        nodeModules = pkgs.callPackage ./nix/node_modules.nix { };

        staticServe = pkgs.callPackage ./nix/default.nix { inherit nodeModules; };
      in
      {
        packages.default = staticServe;

        devShells.default = pkgs.mkShell { buildInputs = [ pkgs.bun ]; };
      }
    );
}
