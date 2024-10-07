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
      in
      {
        packages.default = pkgs.callPackage ./nix { inherit (pkgs) bun vite; };

        devShells.default = pkgs.mkShell { buildInputs = [ pkgs.bun ]; };
      }
    );
}
