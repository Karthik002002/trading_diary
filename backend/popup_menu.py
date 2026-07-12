"""Floating trade popup for quick trade creation.

Run:
  python3 popup_menu.py

Fix: Forces Tkinter out of macOS Dark Mode by setting explicit appearance.
"""

from __future__ import annotations

import json
import os
import platform
import subprocess
import threading
from datetime import datetime, timezone
from urllib import error, request

import tkinter as tk

# Optional global hotkey support using pynput (best-effort)
try:
    from pynput import keyboard as _pynput_keyboard
    PYNPUT_AVAILABLE = True
except Exception:
    _pynput_keyboard = None
    PYNPUT_AVAILABLE = False
from tkinter import ttk

IS_MAC = platform.system() == "Darwin"

API_BASE_URL        = os.getenv("API_BASE_URL", "http://localhost:5001/api")
AUTOCLOSE_MS        = int(os.getenv("POPUP_MENU_AUTOCLOSE_MS", "0"))
DEFAULT_SIDE        = os.getenv("DEFAULT_TRADE_SIDE", "buy").lower()
DEFAULT_STRATEGY_ID = os.getenv("DEFAULT_STRATEGY_ID")

# ── colours (light theme, forced) ──────────────────────────────────────────
BG       = "#ffffff"
BG_ROOT  = "#e5e7eb"
BG_FIELD = "#f3f4f6"
FG       = "#111827"
FG_MUTED = "#6b7280"
FG_LABEL = "#374151"
BORDER   = "#d1d5db"
ACCENT   = "#2563eb"
GREEN    = "#16a34a"
RED      = "#dc2626"
AMBER    = "#b45309"
SELL_BG  = "#f3f4f6"


def _force_light_mode_mac(root: tk.Tk) -> None:
    """
    On macOS, Tkinter inherits the system appearance (dark/light).
    We force Aqua light appearance at the Tcl level so all widgets
    render with a white background regardless of system dark mode.
    """
    try:
        root.tk.call("tk::unsupported::MacWindowStyle", "appearance",
                     root._w, "NSAppearanceNameAqua")
    except Exception:
        pass

    # Also set every ttk style to explicit light colours
    style = ttk.Style(root)
    style.theme_use("default")


class PopupMenuApp:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.withdraw()          # hide while we set up to avoid flash

        # ── macOS: force light appearance BEFORE any widgets are drawn ──
        if IS_MAC:
            _force_light_mode_mac(self.root)
            self.root.resizable(False, False)
        else:
            self.root.overrideredirect(True)

        # No longer forcing "always on top" — remove the topmost attribute
        self.root.title("Minimal Trade Logger")
        self.root.geometry("460x540+220+180")

        # Force the root itself to white — critical on dark-mode macOS
        self.root.configure(bg=BG)
        self.root.update()            # apply appearance before building widgets

        self.drag_x = 0
        self.drag_y = 0
        self.symbols: list[dict] = []
        self.strategies: list[dict] = []
        self.busy = False
        self.reference_loading = False
        self.reference_retry_job = None

        self.stock_var  = tk.StringVar()
        self.entry_var  = tk.StringVar()
        self.exit_var   = tk.StringVar()
        self.target_var = tk.StringVar()
        self.stop_var   = tk.StringVar()
        self.qty_var    = tk.StringVar()
        self.side_var   = tk.StringVar(value="BUY" if DEFAULT_SIDE != "sell" else "SELL")
        self.status_var = tk.StringVar(value="Ready to save a trade")

        self._build_ui()

        if not IS_MAC:
            self._bind_window_drag()

        self.root.deiconify()         # show the fully-built window
        self.is_visible = True
        self._setup_hotkeys()
        self._load_reference_data()

        if AUTOCLOSE_MS > 0:
            self.root.after(AUTOCLOSE_MS, self.root.destroy)

        # Start global hotkey listener (Ctrl+T) if available and enabled
        enable_hotkey = os.getenv("POPUP_ENABLE_HOTKEY", "1")
        if enable_hotkey not in ("0", "false", "False") and PYNPUT_AVAILABLE:
            self._start_hotkey_listener()
        elif enable_hotkey not in ("0", "false", "False") and not PYNPUT_AVAILABLE:
            # inform user that pynput is not available
            self._set_status("Hotkey listener unavailable (install pynput)", "#b45309", "")

    # ── UI ──────────────────────────────────────────────────────────────────

    def _lf(self, parent, **kw):
        """Shorthand: tk.Frame with explicit bg=BG."""
        return tk.Frame(parent, bg=BG, **kw)

    def _ll(self, parent, **kw):
        """Shorthand: tk.Label with explicit bg=BG."""
        return tk.Label(parent, bg=BG, **kw)

    def _build_ui(self) -> None:
        # Root padding
        outer = tk.Frame(self.root, bg=BG)
        outer.pack(fill="both", expand=True, padx=12, pady=12)

        # Card with border
        card = tk.Frame(outer, bg=BG,
                        highlightthickness=1, highlightbackground=BORDER)
        card.pack(fill="both", expand=True)

        # ── header ──────────────────────────────────────────────────────
        header = self._lf(card)
        header.pack(fill="x", padx=16, pady=(14, 6))
        self.drag_handle = header

        title_row = self._lf(header)
        title_row.pack(fill="x")

        self._ll(title_row, text="Quick Trade",
                 fg=FG, font=("Arial", 14, "bold")).pack(side="left")

        self.tick_label = self._ll(title_row, text="",
                                   fg=GREEN, font=("Arial", 16, "bold"))
        self.tick_label.pack(side="right")

        self._ll(header,
                 text="Log a trade without leaving the overlay",
                 fg=FG_MUTED, font=("Arial", 9)).pack(anchor="w", pady=(3, 0))

        # divider
        tk.Frame(card, bg=BORDER, height=1).pack(fill="x", padx=16, pady=(6, 10))

        # ── form ────────────────────────────────────────────────────────
        form = self._lf(card)
        form.pack(fill="x", padx=16)

        # Stock Name: use a combobox (dropdown) populated from API symbols
        self._create_stock_combobox(form)
        self._field(form, "Entry",      self.entry_var)
        self._field(form, "Exit",       self.exit_var)
        self._field(form, "Target",     self.target_var)
        self._field(form, "Stop Loss",  self.stop_var)
        self._field(form, "Quantity",   self.qty_var)

        # ── side ────────────────────────────────────────────────────────
        side_row = self._lf(form)
        side_row.pack(fill="x", pady=(12, 4))

        self._ll(side_row, text="Side",
                 fg=FG_LABEL, font=("Arial", 10, "bold"),
                 width=12, anchor="w").pack(side="left")

        self.buy_btn = tk.Button(
            side_row, text="BUY",
            command=lambda: self._set_side("BUY"),
            bg=ACCENT, fg="white",
            relief="flat", bd=0,
            activebackground="#1d4ed8", activeforeground="white",
            cursor="hand2", padx=16, pady=6,
            font=("Arial", 10, "bold"),
        )
        self.buy_btn.pack(side="left", padx=(0, 6))

        self.sell_btn = tk.Button(
            side_row, text="SELL",
            command=lambda: self._set_side("SELL"),
            bg=SELL_BG, fg=FG,
            relief="flat", bd=0,
            activebackground=BORDER, activeforeground=FG,
            cursor="hand2", padx=16, pady=6,
            font=("Arial", 10, "bold"),
        )
        self.sell_btn.pack(side="left")

        self._ll(side_row, textvariable=self.side_var,
                 fg=AMBER, font=("Arial", 10, "bold")).pack(side="right")

        # divider
        tk.Frame(card, bg=BORDER, height=1).pack(fill="x", padx=16, pady=(10, 8))

        # ── status ──────────────────────────────────────────────────────
        status_row = self._lf(card)
        status_row.pack(fill="x", padx=16, pady=(0, 8))

        self.status_label = self._ll(status_row,
                                     textvariable=self.status_var,
                                     fg=FG_MUTED, font=("Arial", 9), anchor="w")
        self.status_label.pack(fill="x")

        # ── action buttons ───────────────────────────────────────────────
        btn_row = self._lf(card)
        btn_row.pack(fill="x", padx=16, pady=(0, 16))

        self.save_button = tk.Button(
            btn_row, text="Create Trade",
            command=self.submit_trade,
            bg=GREEN, fg="white",
            relief="flat", bd=0,
            activebackground="#15803d", activeforeground="white",
            cursor="hand2",
            font=("Arial", 10, "bold"),
            padx=16, pady=9,
        )
        self.save_button.pack(side="left")

        self.refetch_button = tk.Button(
            btn_row, text="Refetch",
            command=self.refetch_reference_data,
            bg=SELL_BG, fg=FG,
            relief="flat", bd=0,
            activebackground=BORDER, activeforeground=FG,
            cursor="hand2",
            font=("Arial", 9, "bold"),
            padx=12, pady=9,
        )
        self.refetch_button.pack(side="right", padx=(8, 0))

        tk.Button(
            btn_row, text="✕  Close",
            command=self.root.destroy,
            bg=SELL_BG, fg=FG_MUTED,
            relief="flat", bd=0,
            activebackground=BORDER, activeforeground=FG,
            cursor="hand2",
            font=("Arial", 9),
            padx=12, pady=9,
        ).pack(side="right")

        self.root.bind("<Return>", lambda _e: self.submit_trade())
        self.root.bind("<Escape>", lambda _e: self.root.destroy())

    def _field(self, parent: tk.Widget, label: str, variable: tk.StringVar) -> None:
        row = self._lf(parent)
        row.pack(fill="x", pady=4)

        self._ll(row, text=label,
                 fg=FG_LABEL, font=("Arial", 10, "bold"),
                 width=12, anchor="w").pack(side="left")

        tk.Entry(
            row, textvariable=variable,
            bg=BG_FIELD,        # light grey so field box is clearly visible
            fg=FG,
            disabledbackground=BG_FIELD,
            insertbackground=FG,
            relief="flat",
            highlightthickness=1,
            highlightbackground=BORDER,
            highlightcolor=ACCENT,
            font=("Arial", 11),
        ).pack(side="left", fill="x", expand=True, ipady=7)

    def _create_stock_combobox(self, parent: tk.Widget) -> None:
        """Create a ttk.Combobox for stock selection and wire it to self.stock_var."""
        try:
            frame = self._lf(parent)
            frame.pack(fill="x", pady=4)
            self._ll(frame, text="Stock Name", fg=FG_LABEL, font=("Arial", 10, "bold"), width=12, anchor="w").pack(side="left")

            # Lazy import ttk to avoid overhead on non-GUI environments
            try:
                from tkinter import ttk as _ttk
            except Exception:
                _ttk = None

            if _ttk:
                self.stock_combo = _ttk.Combobox(frame, textvariable=self.stock_var, values=[], font=("Arial", 11))
                self.stock_combo.pack(side="left", fill="x", expand=True, ipady=6)
                # allow typing to search
                self.stock_combo.configure(state="normal")
            else:
                # Fallback to a simple entry if ttk is not available
                tk.Entry(frame, textvariable=self.stock_var, bg=BG_FIELD, fg=FG, insertbackground=FG, relief="flat", font=("Arial", 11)).pack(side="left", fill="x", expand=True, ipady=7)
        except Exception:
            # If anything goes wrong, fall back to text entry
            self._field(parent, "Stock Name", self.stock_var)

    def _set_side(self, side: str) -> None:
        self.side_var.set(side)
        if side == "BUY":
            self.buy_btn.configure(bg=ACCENT, fg="white")
            self.sell_btn.configure(bg=SELL_BG, fg=FG)
        else:
            self.sell_btn.configure(bg=RED, fg="white")
            self.buy_btn.configure(bg=SELL_BG, fg=FG)

    # ── window drag (non-mac only) ───────────────────────────────────────

    def _bind_window_drag(self) -> None:
        def start(e: tk.Event) -> None:
            self.drag_x, self.drag_y = e.x, e.y

        def move(e: tk.Event) -> None:
            self.root.geometry(f"+{e.x_root - self.drag_x}+{e.y_root - self.drag_y}")

        def bind_all(w) -> None:
            w.bind("<ButtonPress-1>", start)
            w.bind("<B1-Motion>", move)
            for c in w.winfo_children():
                bind_all(c)

        bind_all(self.drag_handle)

    # ── helpers ──────────────────────────────────────────────────────────

    def _load_reference_data(self, schedule_retry: bool = True) -> None:
        if self.reference_loading:
            return

        self.reference_loading = True

        def load() -> None:
            try:
                symbols = self._get_json("/symbols?market_type=equity")
                strategies = self._get_json("/strategies?market_type=equity")

                def apply_success() -> None:
                    self.symbols = symbols
                    self.strategies = strategies

                    # Build display list and mapping for the combobox
                    try:
                        display_list = []
                        self._symbol_display_map = {}
                        self._symbol_code_map = {}
                        for s in self.symbols:
                            code = str(s.get("symbol", "")).upper()
                            name = str(s.get("name", "")).strip()
                            display = f"{code} - {name}" if name else code
                            display_list.append(display)
                            sid = int(s.get("id")) if s.get("id") is not None else None
                            self._symbol_display_map[display] = sid
                            if code:
                                self._symbol_code_map[code] = sid

                        # Update combobox values if widget exists
                        if hasattr(self, "stock_combo"):
                            try:
                                self.stock_combo['values'] = display_list
                                cur = self.stock_var.get()
                                if not cur and display_list:
                                    self.stock_var.set(display_list[0])
                            except Exception:
                                pass
                    except Exception:
                        # non-fatal: continue without combobox population
                        pass

                    self._set_status(
                        f"Loaded {len(self.symbols)} symbols · {len(self.strategies)} strategies",
                        FG_MUTED,
                        "",
                    )
                    self.reference_loading = False
                    if self.reference_retry_job is not None:
                        try:
                            self.root.after_cancel(self.reference_retry_job)
                        except Exception:
                            pass
                        self.reference_retry_job = None

                self.root.after(0, apply_success)
            except Exception as exc:
                def apply_failure(exc=exc) -> None:
                    self._set_status(f"Reference data not loaded: {exc}", RED, "")
                    self.reference_loading = False
                    if schedule_retry and not self.symbols and not self.strategies:
                        # schedule another attempt in 5s
                        try:
                            self.reference_retry_job = self.root.after(5000, lambda: self._load_reference_data(schedule_retry))
                        except Exception:
                            self.reference_retry_job = None

                self.root.after(0, apply_failure)

        threading.Thread(target=load, daemon=True).start()

    def refetch_reference_data(self) -> None:
        """Manual refetch triggered by the Refetch button."""
        # Cancel any pending retry and start an immediate load
        try:
            if self.reference_retry_job is not None:
                self.root.after_cancel(self.reference_retry_job)
        except Exception:
            pass
        self.reference_retry_job = None
        self._set_status("Refetching reference data...", FG_MUTED, "")
        # Ensure we actually attempt reload even if a prior load is flagged
        self.reference_loading = False
        self._load_reference_data(schedule_retry=True)

    def _set_status(self, msg: str, color: str, tick: str) -> None:
        def apply():
            self.status_var.set(msg)
            self.status_label.configure(fg=color)
            self.tick_label.configure(text=tick)
        self.root.after(0, apply)

    def _set_busy(self, value: bool) -> None:
        def apply():
            self.busy = value
            self.save_button.configure(state="disabled" if value else "normal")
            self.root.configure(cursor="watch" if value else "")
        self.root.after(0, apply)

    def _get_json(self, path: str):
        with request.urlopen(
            request.Request(f"{API_BASE_URL}{path}", method="GET"), timeout=10
        ) as r:
            return json.loads(r.read().decode())

    def _post_json(self, path: str, payload: dict):
        data = json.dumps(payload).encode()
        req  = request.Request(f"{API_BASE_URL}{path}", data=data,
                               headers={"Content-Type": "application/json"},
                               method="POST")
        with request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())

    def _resolve_symbol_id(self, stock_name: str) -> int:
        # Prefer lookup from combobox mapping if available
        val = stock_name.strip()
        if not val:
            raise ValueError("Stock name is required")

        # If user selected the display string from combobox
        if hasattr(self, "_symbol_display_map") and val in self._symbol_display_map:
            sid = self._symbol_display_map.get(val)
            if sid is not None:
                return int(sid)

        # If user typed a code like 'AAPL', try code map
        code = val.upper()
        if hasattr(self, "_symbol_code_map") and code in self._symbol_code_map:
            sid = self._symbol_code_map.get(code)
            if sid is not None:
                return int(sid)

        # Fallback: search loaded symbols by name or code
        if not self.symbols:
            self.symbols = self._get_json("/symbols?market_type=equity")

        n = val.lower()
        exact, partial = [], []
        for s in self.symbols:
            code = str(s.get("symbol", "")).strip().lower()
            name = str(s.get("name", "")).strip().lower()
            if n == code or n == name:
                exact.append(s)
            elif n in code or n in name:
                partial.append(s)
        chosen = (exact or partial or [None])[0]
        if not chosen:
            raise ValueError(f"Unknown stock: {stock_name}")
        sid = chosen.get("id")
        if sid is None:
            raise ValueError(f"Could not resolve id for: {stock_name}")
        return int(sid)

    def _resolve_strategy_id(self) -> int:
        if self.strategies:
            sid = self.strategies[0].get("id")
            if sid is not None:
                return int(sid)
        if DEFAULT_STRATEGY_ID and DEFAULT_STRATEGY_ID.isdigit():
            return int(DEFAULT_STRATEGY_ID)
        raise ValueError("No equity strategy found. Create one or set DEFAULT_STRATEGY_ID.")

    def _rf(self, var: tk.StringVar, name: str, cast):
        raw = var.get().strip()
        if not raw:
            raise ValueError(f"{name} is required")
        return cast(float(raw))

    # ── submit ───────────────────────────────────────────────────────────

    def submit_trade(self) -> None:
        if self.busy:
            return
        stock_name = self.stock_var.get().strip()
        if not stock_name:
            self._set_status("Stock name is required", RED, "")
            return
        try:
            entry_price = self._rf(self.entry_var,  "Entry",     float)
            exit_price  = self._rf(self.exit_var,   "Exit",      float)
            take_profit = self._rf(self.target_var, "Target",    float)
            stop_loss   = self._rf(self.stop_var,   "Stop loss", float)
            quantity    = self._rf(self.qty_var,    "Quantity",  int)
            side        = self.side_var.get().strip().lower()
            if side not in {"buy", "sell"}:
                raise ValueError("Side must be BUY or SELL")
        except ValueError as exc:
            self._set_status(str(exc), RED, "")
            return

        def worker() -> None:
            self._set_busy(True)
            try:
                symbol_id   = self._resolve_symbol_id(stock_name)
                strategy_id = self._resolve_strategy_id()
                if side == "buy":
                    outcome = "win" if exit_price > entry_price else "loss" if exit_price < entry_price else "neutral"
                else:
                    outcome = "win" if exit_price < entry_price else "loss" if exit_price > entry_price else "neutral"

                saved    = self._post_json("/trades", {
                    "strategy_id": strategy_id, "symbol_id": symbol_id,
                    "quantity": quantity, "type": side,
                    "trade_date": datetime.now(timezone.utc).isoformat(),
                    "entry_price": entry_price, "exit_price": exit_price,
                    "stop_loss": stop_loss, "take_profit": take_profit,
                    "outcome": outcome, "trade_type": "equity",
                })
                trade_id = saved.get("_id") or saved.get("id") or "saved"

                def on_success():
                    self.status_var.set(f"✓ Trade {trade_id} saved successfully")
                    self.status_label.configure(fg=GREEN)
                    self.tick_label.configure(text="✓")
                    for v in (self.entry_var, self.exit_var, self.target_var,
                              self.stop_var, self.qty_var):
                        v.set("")
                    self.save_button.configure(text="Saved ✓")
                    self.root.after(1500, lambda: self.save_button.configure(text="Create Trade"))
                self.root.after(0, on_success)

            except error.HTTPError as exc:
                msg = exc.read().decode("utf-8", errors="ignore")
                try:
                    detail = json.loads(msg).get("message") or json.loads(msg).get("error") or msg
                except Exception:
                    detail = msg or str(exc)
                self._set_status(f"Save failed: {detail}", RED, "")
            except Exception as exc:
                self._set_status(f"Save failed: {exc}", RED, "")
            finally:
                self._set_busy(False)

        threading.Thread(target=worker, daemon=True).start()

    def _setup_hotkeys(self) -> None:
        """Local key binding when the popup has focus (Control+T)."""
        try:
            # Local binding — works when the popup is focused
            self.root.bind_all("<Control-t>", lambda _e: self._toggle_visibility())
        except Exception:
            pass

    def _start_hotkey_listener(self) -> None:
        """Start a background listener that toggles popup visibility on Ctrl+T.

        This uses pynput if available. The listener runs in a daemon thread so it
        doesn't block program exit.
        """
        # Guard double-start
        if getattr(self, "_hotkey_listener_started", False):
            return
        self._hotkey_listener_started = True

        def on_press(key):
            try:
                # For letter keys, pynput gives KeyCode with .char
                if hasattr(key, "char") and key.char and key.char.lower() == "t":
                    if any(k in ( _pynput_keyboard.Key.ctrl_l, _pynput_keyboard.Key.ctrl_r) for k in pressed_keys):
                        toggle()
                elif key in (_pynput_keyboard.Key.ctrl_l, _pynput_keyboard.Key.ctrl_r):
                    pressed_keys.add(key)
            except Exception:
                pass

        def on_release(key):
            try:
                if key in (_pynput_keyboard.Key.ctrl_l, _pynput_keyboard.Key.ctrl_r) and key in pressed_keys:
                    pressed_keys.discard(key)
            except Exception:
                pass

        def toggle():
            # Use after to ensure thread-safety with tkinter
            self.root.after(0, self._toggle_visibility)

        pressed_keys = set()

        listener = _pynput_keyboard.Listener(on_press=on_press, on_release=on_release)
        listener.daemon = True
        listener.start()

    def _toggle_visibility(self) -> None:
        """Hide or show the popup window (do not destroy).

        Use an internal flag (`self.is_visible`) because some platforms
        don't reliably report `state()` after withdraw().
        """
        try:
            # Prefer explicit state tracking
            currently_visible = getattr(self, "is_visible", True)

            if currently_visible:
                # hide
                try:
                    self.root.withdraw()
                except Exception:
                    # fallback
                    try:
                        self.root.iconify()
                    except Exception:
                        pass
                self.is_visible = False
            else:
                # show
                try:
                    self.root.deiconify()
                    self.root.lift()
                    self.root.focus_force()
                    # Do not force topmost; let window manager handle stacking
                except Exception:
                    try:
                        self.root.wm_deiconify()
                    except Exception:
                        pass
                self.is_visible = True
        except Exception:
            # Last-resort fallback using wm_state
            try:
                if self.root.wm_state() in ("iconic", "withdrawn"):
                    self.root.deiconify()
                    self.is_visible = True
                else:
                    self.root.withdraw()
                    self.is_visible = False
            except Exception:
                pass

    def run(self) -> None:
        self.root.mainloop()


if __name__ == "__main__":
    try:
        print("Popup menu opened. Enter stock, prices, and click Create Trade.")
        PopupMenuApp().run()
    except tk.TclError as exc:
        print(f"Unable to open the popup menu: {exc}")
