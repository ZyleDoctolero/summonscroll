extends Node
## Headless network smoke test — run with:
##   godot --headless res://tests/net_check.tscn --quit-after 600
## Uses a deliberately invalid login: proves the GoTrue round-trip and the
## error path without touching real credentials.

func _ready() -> void:
	print("NET CHECK: signing in with invalid credentials (expected to fail cleanly)…")
	var res: Dictionary = await Sb.sign_in("nobody@example.com", "definitely-wrong")
	if res.get("ok", false):
		print("NET CHECK FAIL — invalid login unexpectedly succeeded?!")
	elif str(res.get("error", "")) != "":
		print("NET CHECK PASS — server said: ", res.get("error"))
	else:
		print("NET CHECK FAIL — no error message surfaced")
	get_tree().quit(0)
