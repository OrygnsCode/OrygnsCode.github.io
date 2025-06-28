{ pkgs, ... }: {
 idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
 "nix-shell" "--pure" "-p" "nodePackages.http-server" "--run" "http-server --port $PORT --host 0.0.0.0 --disable-host-check"
        ];
 manager = "web";
      };
    };
  };
}