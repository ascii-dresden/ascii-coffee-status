{
  description = "Ascii Coffee Status Server";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  inputs.napalm.url = "github:nix-community/napalm";

  outputs = { self, nixpkgs, napalm }:
    let
      # Generate a user-friendly version number.
      version = builtins.substring 0 8 self.lastModifiedDate;
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "i686-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f:
        nixpkgs.lib.genAttrs supportedSystems (system: f system);

      # Nixpkgs instantiated for supported system types.
      nixpkgsFor = forAllSystems (system:
        import nixpkgs {
          inherit system;
          overlays = [
            self.overlay
          ];
        });

    in
    {
      overlay = final: prev: {
        ascii-coffee-status = (napalm.overlay final prev).napalm.buildPackage ./. {
          customPatchPackages = {
            "husky" = pkgs: prev: {};
            "typescript" = pkgs: prev: {};
          };
        };
      };

      # Provide your packages for selected system types.
      packages = forAllSystems (system: {
        inherit (nixpkgsFor.${system}) ascii-coffee-status;
      });

      # The default package for 'nix build'. This makes sense if the
      # flake provides only one package or there is a clear "main"
      # package.
      defaultPackage =
        forAllSystems (system: self.packages.${system}.ascii-coffee-status);
    };
}
