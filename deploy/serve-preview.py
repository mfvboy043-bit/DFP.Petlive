#!/usr/bin/env python3
"""
Petlive LAN / Tailscale preview server.

Use --daemon to double-fork away from Cursor/agent shells so the process
keeps serving after the parent exits.
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import socket
import subprocess
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PORT = 5173
DEFAULT_LOG = Path(__file__).resolve().parent / "preview-access.log"
PIDFILE = Path(__file__).resolve().parent / "preview-server.pid"

ROOT = DEFAULT_ROOT
LOG = DEFAULT_LOG


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        client = self.client_address[0]
        ua = self.headers.get("User-Agent", "-")
        line = (
            f"{dt.datetime.now().isoformat(timespec='seconds')} "
            f"{client} {self.command} {self.path} "
            f"\"{ua[:160]}\"\n"
        )
        try:
            with LOG.open("a", encoding="utf-8") as fh:
                fh.write(line)
        except OSError:
            pass
        sys.stderr.write(line)
        sys.stderr.flush()

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def print_urls(port: int) -> None:
    wifi = subprocess.getoutput("ipconfig getifaddr en1").strip()
    eth = subprocess.getoutput("ipconfig getifaddr en0").strip()
    ts_bin = "/Applications/Tailscale.app/Contents/MacOS/Tailscale"
    tsip = ""
    if Path(ts_bin).exists():
        tsip = subprocess.getoutput(f"{ts_bin} ip -4").strip().split("\n")[0]

    print(f"Serving {ROOT} on 0.0.0.0:{port}", flush=True)
    print(f"Access log → {LOG}", flush=True)
    if wifi:
        print(f"Phone (same Wi‑Fi):  http://{wifi}:{port}/apps/web/", flush=True)
    if eth and eth != wifi:
        print(f"Ethernet only:       http://{eth}:{port}/apps/web/", flush=True)
    if tsip:
        print(f"Tailscale (remote):  http://{tsip}:{port}/apps/web/", flush=True)
        print("  (iPhone Tailscale must be Connected on the same account)", flush=True)


def health_ok(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1.5) as sock:
            sock.sendall(
                b"GET /apps/web/ HTTP/1.0\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n"
            )
            data = sock.recv(64)
            return data.startswith(b"HTTP/1.") and b" 200" in data[:32]
    except OSError:
        return False


def daemonize() -> None:
    """Classic double-fork so we leave Cursor's process group."""
    if os.fork() > 0:
        raise SystemExit(0)
    os.setsid()
    if os.fork() > 0:
        raise SystemExit(0)
    sys.stdout.flush()
    sys.stderr.flush()
    with open("/dev/null", "rb", 0) as devnull:
        os.dup2(devnull.fileno(), sys.stdin.fileno())
    out = open(PIDFILE.with_suffix(".out"), "a", buffering=1)
    os.dup2(out.fileno(), sys.stdout.fileno())
    os.dup2(out.fileno(), sys.stderr.fileno())


def main() -> int:
    global ROOT, LOG

    parser = argparse.ArgumentParser(description="Petlive phone preview server")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--log", type=Path, default=DEFAULT_LOG)
    parser.add_argument(
        "--daemon",
        action="store_true",
        help="Double-fork into background (survives Cursor agent exit)",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 0 if loopback /apps/web/ returns HTTP 200",
    )
    args = parser.parse_args()
    ROOT = args.root.resolve()
    LOG = args.log.resolve()

    if args.check:
        return 0 if health_ok(args.port) else 1

    if args.daemon:
        daemonize()

    server = ThreadingHTTPServer(("0.0.0.0", args.port), PreviewHandler)
    server.daemon_threads = True
    try:
        PIDFILE.write_text(str(os.getpid()) + "\n", encoding="utf-8")
    except OSError:
        pass
    print_urls(args.port)
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        print("\nStopped.", flush=True)
    finally:
        server.server_close()
        try:
            if PIDFILE.exists() and PIDFILE.read_text().strip() == str(os.getpid()):
                PIDFILE.unlink()
        except OSError:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
