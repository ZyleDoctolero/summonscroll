extends Node
## Supabase client (autoload "Sb").
##
## Design rules (see GAME_PLAN.md v3/v4/v9):
##  - The game owns NO authoritative state. Reads via PostgREST, writes only
##    through existing RPCs (e.g. run_expedition).
##  - Tokens live in user://session.cfg only. On 401 we refresh once, then
##    give up and route back to login.
##  - Every call is awaitable and returns { ok, status, data|error }.

const SESSION_PATH := "user://session.cfg"

var access_token: String = ""
var refresh_token: String = ""
var user_id: String = ""


func _ready() -> void:
	_load_session()


# ── auth ─────────────────────────────────────────────────────────────────────

func is_logged_in() -> bool:
	return access_token != "" and user_id != ""


func sign_in(email: String, password: String) -> Dictionary:
	var res := await _raw_request(
		Config.SUPABASE_URL + "/auth/v1/token?grant_type=password",
		HTTPClient.METHOD_POST,
		JSON.stringify({"email": email, "password": password}),
		false
	)
	if res.ok and res.data is Dictionary and res.data.has("access_token"):
		_store_session(res.data)
		return {"ok": true}
	var msg: String = "Sign-in failed"
	if res.data is Dictionary:
		msg = str(res.data.get("error_description", res.data.get("msg", msg)))
	return {"ok": false, "error": msg}


func try_refresh() -> bool:
	if refresh_token == "":
		return false
	var res := await _raw_request(
		Config.SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token",
		HTTPClient.METHOD_POST,
		JSON.stringify({"refresh_token": refresh_token}),
		false
	)
	if res.ok and res.data is Dictionary and res.data.has("access_token"):
		_store_session(res.data)
		return true
	sign_out()
	return false


func sign_out() -> void:
	access_token = ""
	refresh_token = ""
	user_id = ""
	if FileAccess.file_exists(SESSION_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SESSION_PATH))


func _store_session(data: Dictionary) -> void:
	access_token = str(data.get("access_token", ""))
	refresh_token = str(data.get("refresh_token", ""))
	var user: Dictionary = data.get("user", {})
	user_id = str(user.get("id", ""))
	var cfg := ConfigFile.new()
	cfg.set_value("session", "refresh_token", refresh_token)
	cfg.set_value("session", "user_id", user_id)
	cfg.save(SESSION_PATH)


func _load_session() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SESSION_PATH) != OK:
		return
	refresh_token = str(cfg.get_value("session", "refresh_token", ""))
	user_id = str(cfg.get_value("session", "user_id", ""))
	# access_token is intentionally not persisted; Boot calls try_refresh().


# ── REST / RPC ───────────────────────────────────────────────────────────────

## GET /rest/v1/<path>. `path` includes the query string.
func rest_get(path: String) -> Dictionary:
	return await _authed_request(
		Config.SUPABASE_URL + "/rest/v1/" + path, HTTPClient.METHOD_GET, ""
	)


## POST /rest/v1/rpc/<fn> with a Dictionary payload.
func rpc_call(fn: String, payload: Dictionary) -> Dictionary:
	return await _authed_request(
		Config.SUPABASE_URL + "/rest/v1/rpc/" + fn,
		HTTPClient.METHOD_POST,
		JSON.stringify(payload)
	)


## Request with bearer auth + one automatic refresh-and-retry on 401.
func _authed_request(url: String, method: int, body: String) -> Dictionary:
	var res := await _raw_request(url, method, body, true)
	if res.status == 401 and await try_refresh():
		res = await _raw_request(url, method, body, true)
	return res


func _raw_request(url: String, method: int, body: String, authed: bool) -> Dictionary:
	var req := HTTPRequest.new()
	add_child(req)
	var headers := PackedStringArray([
		"apikey: " + Config.SUPABASE_ANON_KEY,
		"Content-Type: application/json",
	])
	if authed and access_token != "":
		headers.append("Authorization: Bearer " + access_token)
	var err := req.request(url, headers, method, body)
	if err != OK:
		req.queue_free()
		return {"ok": false, "status": 0, "error": "request error %d" % err, "data": null}
	var result: Array = await req.request_completed
	req.queue_free()
	# result = [result_code, response_code, headers, body]
	var status: int = result[1]
	var raw: PackedByteArray = result[3]
	var data: Variant = null
	var text := raw.get_string_from_utf8()
	if text != "":
		data = JSON.parse_string(text)
	var ok := status >= 200 and status < 300
	var out := {"ok": ok, "status": status, "data": data}
	if not ok:
		var msg := "HTTP %d" % status
		if data is Dictionary:
			msg = str(data.get("message", data.get("error_description", data.get("msg", msg))))
		out["error"] = msg
	return out


# ── derived game stats (mirror of the web app's power math) ─────────────────

## Derive display/battle stats from a user_monsters row joined with monsters.
## Single source of truth is the DB row; nothing here is persisted.
static func derive_stats(um: Dictionary) -> Dictionary:
	var m: Dictionary = um.get("monster", {})
	if m == null:
		m = {}
	var level := int(um.get("level", 1))
	var ascension := int(um.get("ascension_level", 0))
	var bond := float(um.get("bond_percent", 0))
	var scale := (1.0 + level * 0.05) * (1.0 + ascension * 0.1)
	var fatigue := 0.7 if bond < 10.0 else 1.0
	return {
		"um_id": str(um.get("id", "")),
		"name": str(m.get("name", "Unknown")),
		"element": str(m.get("element", "arcane")),
		"rarity": str(m.get("rarity", "common")),
		"role": str(m.get("role", "attacker")),
		"art_url": m.get("art_url"),
		"level": level,
		"bond": bond,
		"hp": int(float(m.get("base_hp", 100)) * scale * fatigue),
		"atk": int(float(m.get("base_atk", 20)) * scale * fatigue),
		"def": int(float(m.get("base_def", 15)) * scale * fatigue),
		"spd": int(float(m.get("base_spd", 10))),
	}
