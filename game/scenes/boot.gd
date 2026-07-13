extends Control
## Boot: restore the saved session, then route (GAME_PLAN.md v6 scene 1).

@onready var _label := Label.new()


func _ready() -> void:
	_label.text = "SummonScroll — waking the scroll…"
	_label.set_anchors_preset(Control.PRESET_CENTER)
	add_child(_label)
	_route.call_deferred()


func _route() -> void:
	if Sb.refresh_token != "":
		_label.text = "Restoring your session…"
		var ok: bool = await Sb.try_refresh()
		if ok:
			get_tree().change_scene_to_file("res://scenes/sanctum.tscn")
			return
	get_tree().change_scene_to_file("res://scenes/login.tscn")
